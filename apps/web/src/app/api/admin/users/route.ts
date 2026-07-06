import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await ensureDbReady();
    
    const result = await dbClient.execute(`
      SELECT id, email, plan, is_banned, role, created_at, signup_ip 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
