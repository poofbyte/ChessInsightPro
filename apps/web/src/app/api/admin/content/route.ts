import { getAdminUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { getAllConfig, setConfig } from "@core/config";


export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();
    const config = await getAllConfig(dbClient);
    return NextResponse.json(config);
  } catch (error) {
    console.error("Admin content fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();
    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      await setConfig(dbClient, key, value, adminId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin content save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

