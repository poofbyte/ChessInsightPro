import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST() {
  try {
    await ensureDbReady();
    
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    
    if (refreshToken) {
      const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      
      await dbClient.execute({
        sql: `DELETE FROM sessions WHERE refresh_token_hash = ?`,
        args: [refreshHash]
      });
      
      cookieStore.delete("refresh_token");
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
