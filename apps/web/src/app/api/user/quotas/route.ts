import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { verifyAccessToken } from "@core/auth";
import { checkAndConsumeQuota } from "@core/quota";
import { getAllConfig } from "@core/config";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token, process.env.JWT_ACCESS_SECRET || "default_access");
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await ensureDbReady();
    const result = await dbClient.execute({
      sql: `SELECT plan, custom_quotas, plan_renews_at FROM users WHERE id = ?`,
      args: [decoded.userId]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const user = result.rows[0];
    const plan = user.plan as string;
    const customQuotas = user.custom_quotas as string | null;
    const planRenewsAt = user.plan_renews_at as string | null;
    
    const config = await getAllConfig(dbClient);
    const plans = config.plans || {
      FREE: { reviewsPerDay: 1, practiceRushPuzzlePerDay: 3 },
      TIER1: { reviewsPerMonth: 100, practiceRushPuzzlePerMonth: 300 },
      TIER2: { reviewsPerMonth: 500, practiceRushPuzzlePerMonth: 1000 }
    };
    
    // Check usage without consuming by passing a negative count or just doing the DB query ourselves
    // We will do the DB query manually to get exactly how many they've used
    const isDaily = plan === "FREE";
    const timeFilter = isDaily ? `datetime('now', 'start of day')` : `datetime('now', 'start of month')`;
    
    const usageResult = await dbClient.execute({
      sql: `SELECT event_type, count(*) as count FROM usage_events WHERE user_id = ? AND created_at >= ${timeFilter} GROUP BY event_type`,
      args: [decoded.userId]
    });
    
    let reviewsUsed = 0;
    let puzzlesUsed = 0;
    
    usageResult.rows.forEach(r => {
      if (r.event_type === 'review') reviewsUsed = r.count as number;
      if (r.event_type === 'practiceRushPuzzle') puzzlesUsed = r.count as number;
    });
    
    const activePlan = plan === "CUSTOM" && customQuotas
      ? JSON.parse(customQuotas)
      : plans[plan] || plans["FREE"];
      
    const reviewsLimit = isDaily ? activePlan.reviewsPerDay : activePlan.reviewsPerMonth;
    const puzzlesLimit = isDaily ? activePlan.practiceRushPuzzlePerDay : activePlan.practiceRushPuzzlePerMonth;
    
    return NextResponse.json({
      plan,
      planRenewsAt,
      isDaily,
      limits: {
        reviews: {
          used: reviewsUsed,
          total: reviewsLimit,
          remaining: reviewsLimit !== undefined ? Math.max(0, reviewsLimit - reviewsUsed) : 'unlimited'
        },
        puzzles: {
          used: puzzlesUsed,
          total: puzzlesLimit,
          remaining: puzzlesLimit !== undefined ? Math.max(0, puzzlesLimit - puzzlesUsed) : 'unlimited'
        }
      }
    });
  } catch (error) {
    console.error("Fetch quotas error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
