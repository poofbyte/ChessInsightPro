import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { verifyAccessToken } from "@core/auth";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token, process.env.JWT_ACCESS_SECRET || "default_access");
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
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
    console.error("Payment config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
