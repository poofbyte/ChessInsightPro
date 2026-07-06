import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";
import { sendAdminUpgradeRequestNotification } from "@core/email";

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
      sql: `SELECT s.user_id, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.refresh_token_hash = ?`,
      args: [refreshHash]
    });
    
    if (sessionRes.rows.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = sessionRes.rows[0].user_id as string;
    const userEmail = sessionRes.rows[0].email as string;
    
    // Parse body
    const { plan, customPriceBdt, customQuotas, verificationDetails } = await req.json();
    
    let price = 0;
    if (plan === "TIER1") price = 100;
    else if (plan === "TIER2") price = 200;
    else if (plan === "CUSTOM") price = customPriceBdt || 0;
    
    const requestId = crypto.randomUUID();
    
    await dbClient.execute({
      sql: `INSERT INTO pending_upgrade_requests (id, user_id, requested_plan, requested_quotas, requested_price_bdt, verification_details) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [requestId, userId, plan, customQuotas ? JSON.stringify(customQuotas) : null, price, verificationDetails ? JSON.stringify(verificationDetails) : null]
    });
    
    await sendAdminUpgradeRequestNotification(userEmail, plan, price, customQuotas);
    
    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    console.error("Upgrade request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
