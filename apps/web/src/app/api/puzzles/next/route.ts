import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await ensureDbReady();
    
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get("theme");
    
    let sql = `SELECT id, fen, solution_uci, themes, rating, source_game_url 
               FROM generated_puzzles`;
    let args: any[] = [];
    
    if (theme && theme !== "All") {
      sql += ` WHERE json_extract(themes, '$') LIKE ?`;
      args.push(`%${theme}%`);
    }
    
    sql += ` ORDER BY times_served ASC, random() LIMIT 1`;

    const result = await dbClient.execute({ sql, args });
    
    if (result.rows.length === 0) {
      // Return a fallback puzzle if db is empty (so it doesn't break)
      return NextResponse.json({
        success: true,
        puzzle: {
          id: "fallback-1",
          initialFen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5",
          solution: ["f3e5"], // simplistic
          themes: ["fallback"],
          rating: 1200
        }
      });
    }
    
    const row = result.rows[0];
    
    // Increment times_served
    await dbClient.execute({
      sql: `UPDATE generated_puzzles SET times_served = times_served + 1 WHERE id = ?`,
      args: [row.id]
    });
    
    const puzzle = {
      id: row.id,
      initialFen: row.fen,
      solution: JSON.parse(row.solution_uci as string),
      themes: JSON.parse(row.themes as string),
      rating: row.rating,
      sourceGameUrl: row.source_game_url
    };
    
    return NextResponse.json({ success: true, puzzle });
  } catch (error) {
    console.error("GET next puzzle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
