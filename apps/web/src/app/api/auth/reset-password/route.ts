import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { hashPassword, getAccessSecret } from "@core/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    const { token, password } = await req.json();

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: "Invalid token or password" }, { status: 400 });
    }

    const secret = getAccessSecret();
    
    // Decode token
    let decodedStr: string;
    try {
      decodedStr = Buffer.from(token, "base64").toString("utf-8");
    } catch (e) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    const parts = decodedStr.split("|");
    if (parts.length !== 3) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const [email, expiryStr, providedHmac] = parts;
    const expiry = parseInt(expiryStr, 10);

    if (Date.now() > expiry) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    const dataToSign = `${email}|${expiry}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(dataToSign).digest("hex");

    if (providedHmac !== expectedHmac) {
      return NextResponse.json({ error: "Invalid token signature" }, { status: 400 });
    }

    // Verify user exists
    const result = await dbClient.execute({
      sql: `SELECT id FROM users WHERE email = ?`,
      args: [email]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = result.rows[0].id as string;
    const newHash = await hashPassword(password);

    await dbClient.batch([
      { sql: `UPDATE users SET password_hash = ? WHERE id = ?`, args: [newHash, userId] },
      { sql: `DELETE FROM sessions WHERE user_id = ?`, args: [userId] },
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
