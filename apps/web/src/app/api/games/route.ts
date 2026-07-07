import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    
    const result = await dbClient.execute({
      sql: `SELECT id, pgn, headers, analysis, created_at FROM games WHERE user_id = ? ORDER BY created_at DESC`,
      args: [authResult.userId]
    });
    
    const games = result.rows.map(row => ({
      id: row.id,
      pgn: row.pgn,
      headers: row.headers ? JSON.parse(row.headers as string) : null,
      analysis: row.analysis ? JSON.parse(row.analysis as string) : null,
      createdAt: row.created_at
    }));
    
    return NextResponse.json({ success: true, games });
  } catch (error) {
    console.error("GET games error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    
    const body = await req.json();
    const games = Array.isArray(body) ? body : [body];
    
    const statements: any[] = [];
    
    for (const game of games) {
      if (!game.id || !game.pgn) continue;
      
      const headersJson = game.headers ? JSON.stringify(game.headers) : null;
      const analysisJson = game.analysis ? JSON.stringify(game.analysis) : null;
      
      statements.push({
        sql: `INSERT INTO games (id, user_id, pgn, headers, analysis) 
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET 
                pgn = excluded.pgn, 
                headers = excluded.headers, 
                analysis = excluded.analysis`,
        args: [game.id, authResult.userId, game.pgn, headersJson, analysisJson]
      });
    }

    if (statements.length > 0) {
      statements.push({
        sql: `INSERT INTO usage_events (id, user_id, event_type) VALUES (?, ?, ?)`,
        args: [crypto.randomUUID(), authResult.userId, "review"]
      });
      await dbClient.batch(statements, "write");
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST games error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
