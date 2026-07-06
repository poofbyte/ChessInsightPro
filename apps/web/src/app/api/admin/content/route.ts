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
    const result = await dbClient.execute(`SELECT key, value, updated_at, updated_by FROM system_config WHERE key LIKE 'content_%' ORDER BY key`);

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
      const configKey = `content_${key}`;
      await dbClient.execute({
        sql: `INSERT INTO system_config (key, value, updated_by) VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')`,
        args: [configKey, JSON.stringify(value), adminId],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin content save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
