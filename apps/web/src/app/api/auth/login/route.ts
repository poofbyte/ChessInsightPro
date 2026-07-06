import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { verifyPassword, generateTokens } from "@core/auth";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }
    
    const result = await dbClient.execute({
      sql: `SELECT id, password_hash, plan, role FROM users WHERE email = ? AND is_banned = 0`,
      args: [email]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash as string);
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    // Generate tokens
    const accessSecret = process.env.JWT_ACCESS_SECRET || "default_access";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "default_refresh";
    
    const role = (user.role as string) || "USER";
    const { accessToken, refreshToken } = generateTokens(user.id as string, role, accessSecret, refreshSecret);
    
    // Hash refresh token for DB storage
    const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const sessionId = crypto.randomUUID();
    
    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for") || "";
    
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
