import { getAdminUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";



export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await ensureDbReady();
    const result = await dbClient.execute(`SELECT key, value FROM system_config WHERE key IN ('payment_instructions', 'verification_fields', 'upgrade_success_message')`);
    
    const settings: Record<string, any> = {
      payment_instructions: "Please send payment via Mobile Banking.",
      verification_fields: JSON.stringify([{ id: 'trxId', label: 'Transaction ID', type: 'text', required: true }]),
      upgrade_success_message: "Your payment verification is under review. You will receive an email once your account is upgraded."
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
    const { payment_instructions, verification_fields, upgrade_success_message } = await req.json();
    
    await Promise.all([
      dbClient.execute({
        sql: `INSERT INTO system_config (key, value, updated_by) VALUES ('payment_instructions', ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')`,
        args: [payment_instructions, adminId]
      }),
      dbClient.execute({
        sql: `INSERT INTO system_config (key, value, updated_by) VALUES ('verification_fields', ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')`,
        args: [verification_fields, adminId]
      }),
      dbClient.execute({
        sql: `INSERT INTO system_config (key, value, updated_by) VALUES ('upgrade_success_message', ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')`,
        args: [upgrade_success_message, adminId]
      })
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin settings save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

