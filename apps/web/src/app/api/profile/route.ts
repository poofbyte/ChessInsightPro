import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    
    const result = await dbClient.execute({
      sql: `SELECT elo, accuracy_history, weaknesses, updated_at FROM profiles WHERE user_id = ?`,
      args: [authResult.userId]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: true, profile: null });
    }
    
    const row = result.rows[0];
    const profile = {
      elo: row.elo,
      accuracyHistory: row.accuracy_history ? JSON.parse(row.accuracy_history as string) : [],
      weaknesses: row.weaknesses ? JSON.parse(row.weaknesses as string) : {},
      updatedAt: row.updated_at
    };
    
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("GET profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    
    const body = await req.json();
    const accuracyHistoryStr = body.accuracyHistory ? JSON.stringify(body.accuracyHistory) : null;
    const weaknessesStr = body.weaknesses ? JSON.stringify(body.weaknesses) : null;
    
    await dbClient.execute({
      sql: `INSERT INTO profiles (user_id, elo, accuracy_history, weaknesses, updated_at) 
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET 
              elo = excluded.elo, 
              accuracy_history = excluded.accuracy_history, 
              weaknesses = excluded.weaknesses,
              updated_at = excluded.updated_at`,
      args: [authResult.userId, body.elo || 1200, accuracyHistoryStr, weaknessesStr]
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
