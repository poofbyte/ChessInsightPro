import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { checkAndConsumeQuota, EventType, PlanConfig } from "@core/quota";

const PLANS: Record<string, PlanConfig> = {
  FREE: { reviewsPerDay: 1, practiceRushPuzzlePerDay: 10 },
  PRO: { reviewsPerMonth: 50, practiceRushPuzzlePerMonth: 1000 }
};

export async function GET(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    
    let userId = "anonymous";
    let plan = "FREE";
    
    if (!(authResult instanceof NextResponse)) {
      userId = authResult.userId;
      const userRes = await dbClient.execute({
        sql: `SELECT plan FROM users WHERE id = ?`,
        args: [userId]
      });
      if (userRes.rows.length > 0) {
        plan = userRes.rows[0].plan as string;
      }
    }

    const { searchParams } = new URL(req.url);
    const feature = searchParams.get("feature") as EventType;
    
    if (!feature) {
      return NextResponse.json({ error: "Missing feature" }, { status: 400 });
    }
    
    if (userId === "anonymous" && feature !== "practiceRushPuzzle") {
      return NextResponse.json({ 
        allowed: false, 
        reason: "auth_required",
        message: "Sign in to use this feature." 
      });
    }

    const result = await checkAndConsumeQuota(dbClient as any, userId, feature, PLANS, plan);
    
    return NextResponse.json({ allowed: result.allowed, plan });
  } catch (error) {
    console.error("Quota check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
