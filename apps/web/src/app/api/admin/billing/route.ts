import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import crypto from "crypto";
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
      SELECT id, email, plan, custom_quotas, plan_renews_at, created_at
      FROM users
      WHERE plan != 'FREE'
      ORDER BY plan_renews_at DESC
    `);

    const now = new Date();
    const subscriptions = result.rows.map((row: any) => {
      const renewsAt = row.plan_renews_at ? new Date(row.plan_renews_at) : null;
      const daysRemaining = renewsAt ? Math.ceil((renewsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const estimatedStart = renewsAt ? new Date(renewsAt.getTime() - 30 * 24 * 60 * 60 * 1000) : null;

      return {
        id: row.id,
        email: row.email,
        plan: row.plan,
        customQuotas: row.custom_quotas,
        planRenewsAt: row.plan_renews_at,
        planStartedAt: estimatedStart ? estimatedStart.toISOString() : null,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired: daysRemaining <= 0,
      };
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Admin billing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();
    const { userId, action, days, plan, expiresAt } = await req.json();

    const userRes = await dbClient.execute({
      sql: `SELECT id, email, plan, plan_renews_at FROM users WHERE id = ?`,
      args: [userId],
    });

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userRes.rows[0] as any;

    try {
      await dbClient.execute("BEGIN TRANSACTION");

      if (action === "extend") {
        const currentRenews = user.plan_renews_at
          ? new Date(user.plan_renews_at)
          : new Date();
        if (currentRenews < new Date()) {
          await dbClient.execute({
            sql: `UPDATE users SET plan_renews_at = datetime('now', ?) WHERE id = ?`,
            args: [`+${days} days`, userId],
          });
        } else {
          await dbClient.execute({
            sql: `UPDATE users SET plan_renews_at = datetime(?, ?) WHERE id = ?`,
            args: [currentRenews.toISOString(), `+${days} days`, userId],
          });
        }
      } else if (action === "remove") {
        await dbClient.execute({
          sql: `UPDATE users SET plan = 'FREE', custom_quotas = NULL, plan_renews_at = NULL WHERE id = ?`,
          args: [userId],
        });
      } else if (action === "set_plan") {
        if (!plan) {
          return NextResponse.json({ error: "Plan is required" }, { status: 400 });
        }
        const renewExpr = expiresAt
          ? `'${expiresAt}'`
          : `datetime('now', '+30 days')`;
        await dbClient.execute({
          sql: `UPDATE users SET plan = ?, plan_renews_at = ${renewExpr} WHERE id = ?`,
          args: [plan, userId],
        });
      } else if (action === "set_expiry") {
        if (!expiresAt) {
          return NextResponse.json({ error: "Expiry date is required" }, { status: 400 });
        }
        await dbClient.execute({
          sql: `UPDATE users SET plan_renews_at = ? WHERE id = ?`,
          args: [expiresAt, userId],
        });
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      const auditId = crypto.randomUUID();
      await dbClient.execute({
        sql: `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          auditId,
          adminId,
          `BILLING_${action.toUpperCase()}`,
          "users",
          userId,
          JSON.stringify({ action, days, plan, expiresAt }),
        ],
      });

      await dbClient.execute("COMMIT");
      return NextResponse.json({ success: true });
    } catch (e) {
      try {
        await dbClient.execute("ROLLBACK");
      } catch {}
      throw e;
    }
  } catch (error) {
    console.error("Admin billing action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
