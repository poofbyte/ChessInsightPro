import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@core/email";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const result = await dbClient.execute({
      sql: `SELECT id FROM users WHERE email = ?`,
      args: [email]
    });

    if (result.rows.length === 0) {
      // Don't leak whether the email exists or not
      return NextResponse.json({ success: true });
    }

    const userId = result.rows[0].id as string;
    
    // Create a time-limited token (e.g. JWT or simple signed string)
    // For simplicity, we'll use a signed string format: base64(email|expiry|hmac)
    const secret = process.env.JWT_ACCESS_SECRET || "default_access";
    const expiry = Date.now() + 1000 * 60 * 60; // 1 hour
    const dataToSign = `${email}|${expiry}`;
    const hmac = crypto.createHmac("sha256", secret).update(dataToSign).digest("hex");
    const token = Buffer.from(`${dataToSign}|${hmac}`).toString("base64");

    // Send email using @core/email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
