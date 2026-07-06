import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function GET(req: Request) {
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
    
    const requests = await dbClient.execute({
      sql: `SELECT * FROM pending_upgrade_requests WHERE user_id = ? ORDER BY created_at DESC`,
      args: [userId]
    });
    
    return NextResponse.json({ requests: requests.rows });
  } catch (error) {
    console.error("Fetch upgrade requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
