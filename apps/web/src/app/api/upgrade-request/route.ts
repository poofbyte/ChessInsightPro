import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    
    // Auth check
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const sessionRes = await dbClient.execute({
      sql: `SELECT user_id FROM sessions WHERE refresh_token_hash = ?`,
      args: [refreshHash]
    });
    
    if (sessionRes.rows.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = sessionRes.rows[0].user_id as string;
    
    // Parse body
    const { plan, customPriceBdt, customQuotas } = await req.json();
    
    let price = 0;
    if (plan === "TIER1") price = 100;
    else if (plan === "TIER2") price = 200;
    else if (plan === "CUSTOM") price = customPriceBdt || 0;
    
    const requestId = crypto.randomUUID();
    
    await dbClient.execute({
      sql: `INSERT INTO pending_upgrade_requests (id, user_id, requested_plan, requested_quotas, requested_price_bdt) VALUES (?, ?, ?, ?, ?)`,
      args: [requestId, userId, plan, customQuotas ? JSON.stringify(customQuotas) : null, price]
    });
    
    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    console.error("Upgrade request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
