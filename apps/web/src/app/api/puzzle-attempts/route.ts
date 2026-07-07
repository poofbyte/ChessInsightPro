import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { PuzzleRatingService } from "@/lib/rating";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    
    const body = await req.json();
    const attempts = Array.isArray(body) ? body : [body];
    
    // Fetch current Elo
    const userRes = await dbClient.execute({
      sql: `SELECT elo FROM profiles WHERE user_id = ?`,
      args: [authResult.userId]
    });
    let currentElo = userRes.rows.length > 0 ? (userRes.rows[0].elo as number) : 1200;

    const statements: any[] = [];
    
    for (const attempt of attempts) {
      if (!attempt.id || !attempt.puzzleId) continue;
      
      const hintsUsed = attempt.hintsUsed || 0;
      const mistakes = attempt.mistakes || 0;
      // We assume logged attempts are solved unless explicitly stated otherwise.
      const isSolved = attempt.isSolved !== false; 
      
      const eloChange = PuzzleRatingService.calculateEloChange(isSolved, hintsUsed, mistakes);
      currentElo = PuzzleRatingService.calculateNewElo(currentElo, eloChange);
      
      statements.push({
        sql: `INSERT INTO puzzle_attempts (id, user_id, puzzle_id, mode, hints_used, mistakes, elo_change, solved_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO NOTHING`,
        args: [
          attempt.id, 
          authResult.userId, 
          attempt.puzzleId, 
          attempt.mode || "unknown", 
          hintsUsed, 
          mistakes, 
          eloChange, 
          attempt.solvedAt || new Date().toISOString()
        ]
      });
    }

    // Atomically consume quota for the session
    const hasRush = attempts.some(a => a.mode === "rush");
    if (hasRush) {
      statements.push({
        sql: `INSERT INTO usage_events (id, user_id, event_type) VALUES (?, ?, ?)`,
        args: [crypto.randomUUID(), authResult.userId, "practiceRushPuzzle"]
      });
    }

    if (statements.length > 0) {
      statements.push({
        sql: `UPDATE profiles SET elo = ? WHERE user_id = ?`,
        args: [currentElo, authResult.userId]
      });
      await dbClient.batch(statements, "write");
    }
    
    return NextResponse.json({ success: true, updatedElo: currentElo });
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
