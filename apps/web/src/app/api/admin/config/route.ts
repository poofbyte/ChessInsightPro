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
    
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Admin config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await ensureDbReady();
    const { key, value } = await req.json();
    
    if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 });
    
    await setConfig(dbClient, key, value, adminId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin config update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

