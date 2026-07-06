import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { generateTokens } from "@core/auth";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }
    
    const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    
    const result = await dbClient.execute({
      sql: `
        SELECT s.user_id, s.expires_at, u.role 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.refresh_token_hash = ?
      `,
      args: [refreshHash]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }
    
    const session = result.rows[0];
    const expiresAt = new Date(session.expires_at as string).getTime();
    
    if (expiresAt < Date.now()) {
      // Clean up expired session
      await dbClient.execute({
        sql: `DELETE FROM sessions WHERE refresh_token_hash = ?`,
        args: [refreshHash]
      });
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }
    
    const userId = session.user_id as string;
    const role = (session.role as string) || "USER";
    
    // Generate new tokens
    const accessSecret = process.env.JWT_ACCESS_SECRET || "default_access";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "default_refresh";
    
    const tokens = generateTokens(userId, role, accessSecret, refreshSecret);
    const newRefreshHash = crypto.createHash("sha256").update(tokens.refreshToken).digest("hex");
    
    // Update session
    await dbClient.execute({
      sql: `UPDATE sessions SET refresh_token_hash = ?, expires_at = datetime('now', '+30 days') WHERE refresh_token_hash = ?`,
      args: [newRefreshHash, refreshHash]
    });
    
    cookieStore.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    
    return NextResponse.json({ success: true, accessToken: tokens.accessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
