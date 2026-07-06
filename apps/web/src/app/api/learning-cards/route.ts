import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    
    const result = await dbClient.execute({
      sql: `SELECT id, concept_id, box, due_at, last_reviewed_at FROM learning_cards WHERE user_id = ?`,
      args: [authResult.userId]
    });
    
    const cards = result.rows.map(row => ({
      id: row.id,
      conceptId: row.concept_id,
      box: row.box,
      dueAt: row.due_at,
      lastReviewedAt: row.last_reviewed_at
    }));
    
    return NextResponse.json({ success: true, cards });
  } catch (error) {
    console.error("GET learning-cards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureDbReady();
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    
    const body = await req.json();
    const cards = Array.isArray(body) ? body : [body];
    
    for (const card of cards) {
      if (!card.id || !card.conceptId) continue;
      
      await dbClient.execute({
        sql: `INSERT INTO learning_cards (id, user_id, concept_id, box, due_at, last_reviewed_at) 
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET 
                box = excluded.box, 
                due_at = excluded.due_at, 
                last_reviewed_at = excluded.last_reviewed_at`,
        args: [card.id, authResult.userId, card.conceptId, card.box || 0, card.dueAt, card.lastReviewedAt || null]
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT learning-cards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
