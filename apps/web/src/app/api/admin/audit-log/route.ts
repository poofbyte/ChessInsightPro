import { getAdminUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";



export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await ensureDbReady();
    const result = await dbClient.execute(`
      SELECT a.*, u.email as admin_email
      FROM admin_audit_log a
      LEFT JOIN users u ON a.admin_user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 200
    `);
    
    return NextResponse.json({ logs: result.rows });
  } catch (error) {
    console.error("Admin audit log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

