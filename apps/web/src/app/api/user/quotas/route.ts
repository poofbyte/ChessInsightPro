import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { verifyAccessToken, getAccessSecret } from "@core/auth";
import { getAllConfig } from "@core/config";

function getPlanQuotas(pricingConfig: any, planId: string) {
  if (pricingConfig?.plans) {
    const plan = pricingConfig.plans.find((p: any) => p.id === planId);
    if (plan?.quotaLimits) return plan.quotaLimits;
  }
  
  // Safe defaults if Admin hasn't saved the pricing config yet
  if (planId === "free") {
    return {
      reviewsPerDay: 2,
      reviewsPerMonth: 60,
      practiceRushPuzzlePerDay: 5,
      practiceRushPuzzlePerMonth: 150
    };
  }
  
  return {};
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token, getAccessSecret());
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
    const pricingConfig = config.pricing_config || {};

    const isDaily = plan === "FREE";
    const startDate = isDaily ? new Date(new Date().toISOString().split("T")[0]).toISOString() : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const usageResult = await dbClient.execute({
      sql: `SELECT event_type, count(*) as count FROM usage_events WHERE user_id = ? AND created_at >= ? GROUP BY event_type`,
      args: [decoded.userId, startDate]
    });

    let reviewsUsed = 0;
    let puzzlesUsed = 0;

    usageResult.rows.forEach(r => {
      if (r.event_type === 'review') reviewsUsed = r.count as number;
      if (r.event_type === 'practiceRushPuzzle') puzzlesUsed = r.count as number;
    });

    const planQuotas = plan === "CUSTOM" && customQuotas
      ? JSON.parse(customQuotas)
      : getPlanQuotas(pricingConfig, plan.toLowerCase());

    const reviewsLimit = isDaily ? planQuotas.reviewsPerDay : planQuotas.reviewsPerMonth;
    const puzzlesLimit = isDaily ? planQuotas.practiceRushPuzzlePerDay : planQuotas.practiceRushPuzzlePerMonth;

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
