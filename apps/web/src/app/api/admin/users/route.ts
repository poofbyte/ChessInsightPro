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
    const result = await dbClient.execute(`
      SELECT id, email, plan, is_banned, role, created_at, signup_ip 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();
    const { userId, action } = await req.json();
    
    if (action === "BAN") {
      await dbClient.execute({ sql: "UPDATE users SET is_banned = 1 WHERE id = ?", args: [userId] });
    } else if (action === "UNBAN") {
      await dbClient.execute({ sql: "UPDATE users SET is_banned = 0 WHERE id = ?", args: [userId] });
    } else if (action === "PROMOTE") {
      await dbClient.execute({ sql: "UPDATE users SET role = 'ADMIN' WHERE id = ?", args: [userId] });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
