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
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || "";
    const activityType = url.searchParams.get("activityType") || "";
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

    const conditions: string[] = [];
    const args: any[] = [];

    if (userId) {
      conditions.push("a.user_id = ?");
      args.push(userId);
    }
    if (activityType) {
      conditions.push("a.activity_type = ?");
      args.push(activityType);
    }
    if (search) {
      conditions.push("(u.email LIKE ? OR a.activity_name LIKE ? OR a.details LIKE ?)");
      const pattern = `%${search}%`;
      args.push(pattern, pattern, pattern);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const countResult = await dbClient.execute({
      sql: `SELECT COUNT(*) as total FROM activity_logs a JOIN users u ON a.user_id = u.id ${where}`,
      args
    });
    const total = (countResult.rows[0] as any).total;

    const result = await dbClient.execute({
      sql: `SELECT a.id, a.user_id, a.activity_type, a.activity_name, a.details, a.ip_address, a.created_at, u.email
            FROM activity_logs a
            JOIN users u ON a.user_id = u.id
            ${where}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const distinctResult = await dbClient.execute(`SELECT DISTINCT activity_type FROM activity_logs ORDER BY activity_type`);

    return NextResponse.json({
      logs: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
      activityTypes: (distinctResult.rows as any[]).map((r: any) => r.activity_type),
    });
  } catch (error) {
    console.error("Admin activity logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

