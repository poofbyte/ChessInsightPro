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
      paidTiersRes,
      gamesRes,
      puzzlesRes,
      mrrRes
    ] = await Promise.all([
      dbClient.execute(`SELECT count(*) as count FROM users`),
      dbClient.execute(`SELECT plan, count(*) as count FROM users WHERE plan != 'FREE' GROUP BY plan`),
      dbClient.execute(`SELECT count(*) as count FROM games`),
      dbClient.execute(`SELECT count(*) as count, avg(times_served) as avg_served FROM generated_puzzles`),
      // Calculate MRR from active approved upgrade requests that are recent (e.g. this month), or just sum active custom plans. For now, estimate from Tier1/2 + approved custom
      dbClient.execute(`SELECT sum(requested_price_bdt) as sum FROM pending_upgrade_requests WHERE status = 'APPROVED' AND requested_plan = 'CUSTOM' AND created_at > datetime('now', '-30 days')`)
    ]);

    const totalUsers = totalUsersRes.rows[0].count;
    
    let tier1 = 0;
    let tier2 = 0;
    paidTiersRes.rows.forEach(r => {
      if (r.plan === 'TIER1') tier1 = r.count as number;
      if (r.plan === 'TIER2') tier2 = r.count as number;
    });
    
    const customMrr = (mrrRes.rows[0].sum as number) || 0;
    const estimatedMrr = (tier1 * 100) + (tier2 * 200) + customMrr;
    
    const totalGames = gamesRes.rows[0].count;
    const totalPuzzles = puzzlesRes.rows[0].count;
    const avgPuzzleServed = puzzlesRes.rows[0].avg_served || 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        tier1,
        tier2,
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
