import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { hashPassword, checkSignupRateLimit, recordSignupAttempt } from "@core/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    
    // Get IP for rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    
    // Check rate limit
    const allowed = await checkSignupRateLimit(dbClient, ip, 3);
    if (!allowed) {
      await recordSignupAttempt(dbClient, ip);
      return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429 });
    }
    
    await recordSignupAttempt(dbClient, ip);
    
    const { email, password } = await req.json();
    
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Invalid email or password (min 6 chars)" }, { status: 400 });
    }
    
    // Check existing
    const existing = await dbClient.execute({
      sql: `SELECT id FROM users WHERE email = ?`,
      args: [email]
    });
    
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    
    // Hash and create
    const hashed = await hashPassword(password);
    const userId = crypto.randomUUID();
    
    await dbClient.execute({
      sql: `INSERT INTO users (id, email, password_hash, plan, signup_ip) VALUES (?, ?, ?, ?, ?)`,
      args: [userId, email, hashed, "FREE", ip]
    });
    
    return NextResponse.json({ success: true, userId });
    
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
