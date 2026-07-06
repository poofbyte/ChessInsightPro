import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";

export async function GET() {
  try {
    await ensureDbReady();
    const result = await dbClient.execute(`SELECT key, value FROM system_config WHERE key LIKE 'content_%'`);

    const content: Record<string, any> = {};
    for (const row of result.rows as any[]) {
      try {
        content[row.key.replace("content_", "")] = JSON.parse(row.value);
      } catch {
        content[row.key.replace("content_", "")] = row.value;
      }
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
