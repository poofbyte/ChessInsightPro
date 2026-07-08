import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { verifyPassword, generateTokens, checkLoginRateLimit, recordLoginAttempt, getAccessSecret, getRefreshSecret } from "@core/auth";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }
    
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // 1. Check Rate Limits
    const rateLimit = await checkLoginRateLimit(dbClient as any, ip, email);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.reason }, { status: 429 });
    }
    
    const result = await dbClient.execute({
      sql: `SELECT id, password_hash, plan, role, is_banned, ban_reason FROM users WHERE email = ?`,
      args: [email]
    });
    
    if (result.rows.length === 0) {
      await recordLoginAttempt(dbClient as any, ip, email, false);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    const user = result.rows[0];
    
    if (user.is_banned === 1) {
      return NextResponse.json({ 
        error: `Account is banned: ${user.ban_reason || "No reason provided"}. Please contact us to get back your account.` 
      }, { status: 403 });
    }
    const isValid = await verifyPassword(password, user.password_hash as string);
    
    if (!isValid) {
      await recordLoginAttempt(dbClient as any, ip, email, false);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await recordLoginAttempt(dbClient as any, ip, email, true);
    
    // Generate tokens
    const accessSecret = getAccessSecret();
    const refreshSecret = getRefreshSecret();
    
    const role = (user.role as string) || "USER";
    const { accessToken, refreshToken } = generateTokens(user.id as string, role, accessSecret, refreshSecret);
    
    // Hash refresh token for DB storage
    const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const sessionId = crypto.randomUUID();
    
    const userAgent = req.headers.get("user-agent") || "";
    
    await dbClient.execute({
      sql: `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at, user_agent, ip) VALUES (?, ?, ?, datetime('now', '+30 days'), ?, ?)`,
      args: [sessionId, user.id, refreshHash, userAgent, ip]
    });
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    
    return NextResponse.json({ 
      success: true, 
      accessToken, 
      user: { id: user.id, plan: user.plan, email, role } 
    });
    
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
