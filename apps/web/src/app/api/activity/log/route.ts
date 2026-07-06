import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authResult = requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    await ensureDbReady();
    const { activity_type, activity_name, details } = await req.json();

    if (!activity_type) {
      return NextResponse.json({ error: "activity_type is required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

    await dbClient.execute({
      sql: `INSERT INTO activity_logs (id, user_id, activity_type, activity_name, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, authResult.userId, activity_type, activity_name || "", JSON.stringify(details || {}), ip],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Activity log error:", error);
    return NextResponse.json({ success: false });
  }
}
