import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { verifyAccessToken, getAccessSecret } from "@core/auth";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token, getAccessSecret());
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await ensureDbReady();
    const result = await dbClient.execute({
      sql: `SELECT email, name, phone, chess_com_url, lichess_url, fide_id_url, fide_elo, bio FROM users WHERE id = ?`,
      args: [decoded.userId]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const user = result.rows[0];
    
    return NextResponse.json({
      email: user.email,
      name: user.name,
      phone: user.phone,
      chess_com_url: user.chess_com_url,
      lichess_url: user.lichess_url,
      fide_id_url: user.fide_id_url,
      fide_elo: user.fide_elo,
      bio: user.bio
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token, getAccessSecret());
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { name, phone, chess_com_url, lichess_url, fide_id_url, fide_elo, bio } = body;
    
    await ensureDbReady();
    
    // Check existing profile to protect phone if it is already set
    const current = await dbClient.execute({
      sql: `SELECT phone FROM users WHERE id = ?`,
      args: [decoded.userId]
    });
    
    if (current.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const existingPhone = current.rows[0].phone as string | null;
    let newPhone = phone;
    
    // If phone is already set and not empty, it cannot be changed. 
    // Ignore the new phone value and keep the existing one.
    if (existingPhone && existingPhone.trim() !== "") {
      newPhone = existingPhone;
    }
    
    await dbClient.execute({
      sql: `UPDATE users SET 
        name = ?, 
        phone = ?, 
        chess_com_url = ?, 
        lichess_url = ?, 
        fide_id_url = ?, 
        fide_elo = ?, 
        bio = ?
        WHERE id = ?`,
      args: [
        name || null,
        newPhone || null,
        chess_com_url || null,
        lichess_url || null,
        fide_id_url || null,
        fide_elo ? parseInt(fide_elo, 10) : null,
        bio || null,
        decoded.userId
      ]
    });
    
    return NextResponse.json({ success: true, phone: newPhone });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
