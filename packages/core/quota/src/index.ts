import { Client } from "@libsql/client";
import crypto from "crypto";

export interface PlanConfig {
  reviewsPerDay?: number;
  reviewsPerMonth?: number;
  practiceRushPuzzlePerDay?: number;
  practiceRushPuzzlePerMonth?: number;
}

export type EventType = "review" | "practiceRushPuzzle";

export interface QuotaResult {
  allowed: boolean;
  reason?: "QUOTA_EXCEEDED";
  plan?: string;
  category?: EventType;
  resetsAt?: "daily" | "monthly";
  remaining?: number;
}

export async function checkQuota(
  client: Client,
  userId: string,
  eventType: EventType,
  plans: Record<string, PlanConfig>,
  userPlanName: string,
  customQuotasJSON?: string
): Promise<QuotaResult> {
  const plan = userPlanName === "CUSTOM" && customQuotasJSON
    ? (JSON.parse(customQuotasJSON) as PlanConfig)
    : plans[userPlanName] || plans["FREE"];

  const isDaily = userPlanName === "FREE";
  const limit = isDaily
    ? (eventType === "review" ? plan.reviewsPerDay : plan.practiceRushPuzzlePerDay)
    : (eventType === "review" ? plan.reviewsPerMonth : plan.practiceRushPuzzlePerMonth);

  if (limit === undefined) {
    return { allowed: true }; 
  }

  const timeFilter = isDaily ? `datetime('now', 'start of day')` : `datetime('now', 'start of month')`;

  const result = await client.execute({
    sql: `SELECT count(*) as count FROM usage_events WHERE user_id = ? AND event_type = ? AND created_at >= ${timeFilter}`,
    args: [userId, eventType]
  });

  const count = result.rows[0].count as number;

  if (count >= limit) {
    return {
      allowed: false,
      reason: "QUOTA_EXCEEDED",
      plan: userPlanName,
      category: eventType,
      resetsAt: isDaily ? "daily" : "monthly",
      remaining: 0
    };
  }

  return {
    allowed: true,
    remaining: limit - count
  };
}

export async function consumeQuota(
  client: Client,
  userId: string,
  eventType: EventType
): Promise<void> {
  await client.execute({
    sql: `INSERT INTO usage_events (id, user_id, event_type) VALUES (?, ?, ?)`,
    args: [crypto.randomUUID(), userId, eventType]
  });
}

// Ensure old method crashes if not updated
export async function checkAndConsumeQuota(): Promise<any> {
  throw new Error("checkAndConsumeQuota is deprecated. Use checkQuota and consumeQuota separately.");
}
