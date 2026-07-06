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
      mrrRes
    ] = await Promise.all([
      dbClient.execute(`SELECT count(*) as count FROM users`),
      dbClient.execute(`SELECT plan, count(*) as count FROM users WHERE plan != 'FREE' AND plan IS NOT NULL GROUP BY plan`),
      dbClient.execute(`SELECT count(*) as count FROM games`),
      dbClient.execute(`SELECT count(*) as count, avg(times_served) as avg_served FROM generated_puzzles`),
      dbClient.execute(`SELECT coalesce(sum(requested_price_bdt), 0) as sum FROM pending_upgrade_requests WHERE status = 'APPROVED' AND created_at > datetime('now', '-30 days')`),
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
        avgPuzzleServed: Number(avgPuzzleServed).toFixed(2)
      }
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
