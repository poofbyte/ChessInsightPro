import { getAdminUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";



export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();
    const result = await dbClient.execute(`
      SELECT *
      FROM users 
      ORDER BY created_at DESC
    `);
    
    // Omit password hashes
    const users = result.rows.map((r: any) => {
      const { password_hash, ...rest } = r;
      return rest;
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { hashPassword } from "@core/auth";

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();
    const body = await req.json();
    const { userId, action, reason, plan, role, name, phone, bio, chess_com_url, lichess_url, fide_elo, email, password } = body;
    
    if (action === "BAN") {
      await dbClient.execute({ sql: "UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?", args: [reason || null, userId] });
    } else if (action === "UNBAN") {
      await dbClient.execute({ sql: "UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?", args: [userId] });
    } else if (action === "PROMOTE") {
      await dbClient.execute({ sql: "UPDATE users SET role = 'ADMIN' WHERE id = ?", args: [userId] });
    } else if (action === "EDIT") {
      await dbClient.execute({
        sql: `UPDATE users SET plan = ?, role = ?, name = ?, phone = ?, bio = ?, chess_com_url = ?, lichess_url = ?, fide_elo = ? WHERE id = ?`,
        args: [plan, role, name, phone, bio, chess_com_url, lichess_url, fide_elo, userId]
      });
    } else if (action === "DELETE") {
      // Cascading delete
      await dbClient.execute({ sql: "DELETE FROM users WHERE id = ?", args: [userId] });
      await dbClient.execute({ sql: "DELETE FROM profiles WHERE user_id = ?", args: [userId] });
      await dbClient.execute({ sql: "DELETE FROM sessions WHERE user_id = ?", args: [userId] });
      await dbClient.execute({ sql: "DELETE FROM games WHERE user_id = ?", args: [userId] });
    } else if (action === "CREATE") {
      const existing = await dbClient.execute({ sql: `SELECT id FROM users WHERE email = ?`, args: [email] });
      if (existing.rows.length > 0) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      
      const newUserId = crypto.randomUUID();
      const hashed = await hashPassword(password || "defaultPassword123");
      
      await dbClient.execute({
        sql: `INSERT INTO users (id, email, password_hash, plan, role, name, phone, bio, chess_com_url, lichess_url, fide_elo, signup_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [newUserId, email, hashed, plan || "FREE", role || "USER", name, phone, bio, chess_com_url, lichess_url, fide_elo, "admin-panel"]
      });
      return NextResponse.json({ success: true, userId: newUserId });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

