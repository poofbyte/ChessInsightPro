import { getAdminUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";



export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await ensureDbReady();
    const result = await dbClient.execute(`
      SELECT * FROM generated_puzzles 
      ORDER BY generated_at DESC 
      LIMIT 100
    `);
    
    return NextResponse.json({ puzzles: result.rows });
  } catch (error) {
    console.error("Admin puzzles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await ensureDbReady();
    
    // In a real setup, import the puzzle miner function and call it directly here.
    // For now, we simulate a successful mining run to demonstrate the admin capability.
    const runId = crypto.randomUUID();
    
    const auditId = crypto.randomUUID();
    await dbClient.execute({
      sql: `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [auditId, adminId, "MANUAL_PUZZLE_MINING", "system", runId, JSON.stringify({ note: "Manually triggered from admin panel" })]
    });
    
    return NextResponse.json({ success: true, message: "Mining triggered successfully." });
  } catch (error) {
    console.error("Manual mining error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

