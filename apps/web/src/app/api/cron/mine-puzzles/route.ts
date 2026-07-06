import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { minePuzzlesFromGame } from "@chessinsight/puzzle-miner";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // 1. Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await ensureDbReady();
    
    // 2. Fetch recent games that haven't been mined (e.g. from users)
    // For this bounded batch, we just pick 20 recent games
    const gamesResult = await dbClient.execute({
      sql: `SELECT id, pgn, headers, analysis FROM games ORDER BY created_at DESC LIMIT 20`,
      args: []
    });
    
    let newPuzzlesCount = 0;
    
    for (const row of gamesResult.rows) {
      // Reconstruct the game object minimally for the miner
      if (!row.analysis) continue;
      
      const game: any = {
        moves: [], // We might need to parse PGN or store moves if the miner needs them
        eval: JSON.parse(row.analysis as string),
        // ... in a full implementation, we'd hydrate the Game object fully
      };
      
      const puzzles = minePuzzlesFromGame(game);
      
      for (const p of puzzles) {
        const id = crypto.randomUUID();
        await dbClient.execute({
          sql: `INSERT INTO generated_puzzles (id, fen, solution_uci, themes, rating, source_game_url)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO NOTHING`,
          args: [id, p.fen, JSON.stringify(p.solution_uci), JSON.stringify(p.themes), p.rating, `/analyze/${row.id}`]
        });
        newPuzzlesCount++;
      }
    }
    
    return NextResponse.json({ success: true, mined: newPuzzlesCount });
  } catch (error) {
    console.error("Cron mine-puzzles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
