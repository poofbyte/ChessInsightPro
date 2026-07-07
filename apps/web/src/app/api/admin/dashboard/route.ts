import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { verifyAccessToken } from "@core/auth";

function getAdminUserId(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token, process.env.JWT_ACCESS_SECRET || "default_access");
  return decoded && decoded.role === "ADMIN" ? decoded.userId : null;
}

export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await ensureDbReady();
    
    const [
      totalUsersRes,
      paidPlansRes,
      gamesRes,
      puzzlesRes,
      mrrRes,
      signupsSeriesRes,
      gamesSeriesRes
    ] = await Promise.all([
      dbClient.execute(`SELECT count(*) as count FROM users`),
      dbClient.execute(`SELECT plan, count(*) as count FROM users WHERE plan != 'FREE' AND plan IS NOT NULL GROUP BY plan`),
      dbClient.execute(`SELECT count(*) as count FROM games`),
      dbClient.execute(`SELECT count(*) as count, avg(times_served) as avg_served FROM generated_puzzles`),
      dbClient.execute(`SELECT coalesce(sum(requested_price_bdt), 0) as sum FROM pending_upgrade_requests WHERE status = 'APPROVED' AND created_at > datetime('now', '-30 days')`),
      dbClient.execute(`SELECT date(created_at) as date, count(*) as count FROM users WHERE created_at > datetime('now', '-7 days') GROUP BY date(created_at) ORDER BY date ASC`),
      dbClient.execute(`SELECT date(created_at) as date, count(*) as count FROM games WHERE created_at > datetime('now', '-7 days') GROUP BY date(created_at) ORDER BY date ASC`)
    ]);

    const totalUsers = totalUsersRes.rows[0].count;
    
    const planCounts: Record<string, number> = {};
    let totalPaid = 0;
    paidPlansRes.rows.forEach(r => {
      const plan = (r.plan as string).toUpperCase();
      planCounts[plan] = r.count as number;
      totalPaid += (r.count as number);
    });

    const tier1 = planCounts["TIER1"] || 0;
    const tier2 = planCounts["TIER2"] || 0;
    const custom = planCounts["CUSTOM"] || 0;
    
    const customMrr = (mrrRes.rows[0].sum as number) || 0;
    const estimatedMrr = (tier1 * 100) + (tier2 * 200) + customMrr;
    
    const totalGames = gamesRes.rows[0].count;
    const totalPuzzles = puzzlesRes.rows[0].count;
    const avgPuzzleServed = puzzlesRes.rows[0].avg_served || 0;

    // Build chart data
    const chartDataMap: Record<string, { date: string; signups: number; games: number }> = {};
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      chartDataMap[dateStr] = { date: dateStr, signups: 0, games: 0 };
    }

    signupsSeriesRes.rows.forEach(r => {
      const date = r.date as string;
      if (chartDataMap[date]) chartDataMap[date].signups = r.count as number;
    });

    gamesSeriesRes.rows.forEach(r => {
      const date = r.date as string;
      if (chartDataMap[date]) chartDataMap[date].games = r.count as number;
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPaid,
        tier1,
        tier2,
        custom,
        planCounts,
        estimatedMrr,
        totalGames,
        totalPuzzles,
        avgPuzzleServed: Number(avgPuzzleServed).toFixed(2),
        chartData: Object.values(chartDataMap)
      }
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

