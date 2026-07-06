import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    
    const body = await req.json();
    const attempts = Array.isArray(body) ? body : [body];
    
    for (const attempt of attempts) {
      if (!attempt.id || !attempt.puzzleId) continue;
      
      await dbClient.execute({
        sql: `INSERT INTO puzzle_attempts (id, user_id, puzzle_id, mode, hints_used, mistakes, elo_change, solved_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO NOTHING`,
        args: [
          attempt.id, 
          authResult.userId, 
          attempt.puzzleId, 
          attempt.mode || "unknown", 
          attempt.hintsUsed || 0, 
          attempt.mistakes || 0, 
          attempt.eloChange || 0, 
          attempt.solvedAt || new Date().toISOString()
        ]
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST puzzle-attempts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    
    const result = await dbClient.execute({
      sql: `SELECT id, puzzle_id, mode, hints_used, mistakes, elo_change, solved_at FROM puzzle_attempts WHERE user_id = ? ORDER BY solved_at DESC LIMIT 50`,
      args: [authResult.userId]
    });
    
    const attempts = result.rows.map(row => ({
      id: row.id,
      puzzleId: row.puzzle_id,
      mode: row.mode,
      hintsUsed: row.hints_used,
      mistakes: row.mistakes,
      eloChange: row.elo_change,
      solvedAt: row.solved_at
    }));
    
    return NextResponse.json({ success: true, attempts });
  } catch (error) {
    console.error("GET puzzle-attempts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
