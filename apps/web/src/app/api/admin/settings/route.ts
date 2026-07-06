import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { verifyAccessToken } from "@core/auth";

function getAdminUserId(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token, process.env.JWT_ACCESS_SECRET || "default_access");
  return decoded && decoded.role === "ADMIN" ? decoded.userId : null;
}

export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await ensureDbReady();
    const result = await dbClient.execute(`SELECT key, value FROM system_config WHERE key IN ('payment_instructions', 'verification_fields')`);
    
    const settings: Record<string, any> = {
      payment_instructions: "Please send payment via Mobile Banking.",
      verification_fields: JSON.stringify([{ id: 'trxId', label: 'Transaction ID', type: 'text', required: true }])
    };
    
    result.rows.forEach(row => {
      settings[row.key as string] = row.value;
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Admin settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await ensureDbReady();
    const { payment_instructions, verification_fields } = await req.json();
    
    await dbClient.execute({
      sql: `INSERT INTO system_config (key, value, updated_by) VALUES ('payment_instructions', ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')`,
      args: [payment_instructions, adminId]
    });
    
    await dbClient.execute({
      sql: `INSERT INTO system_config (key, value, updated_by) VALUES ('verification_fields', ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')`,
      args: [verification_fields, adminId]
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin settings save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
