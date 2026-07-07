import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import crypto from "crypto";
import { verifyAccessToken } from "@core/auth";
import { headers } from "next/headers";
import { sendUpgradeApprovedEmail, sendUpgradeRejectedEmail } from "@core/email";

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
      SELECT p.*, u.email as user_email
      FROM pending_upgrade_requests p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    
    return NextResponse.json({ requests: result.rows });
  } catch (error) {
    console.error("Admin upgrade requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await ensureDbReady();
    const { requestId, action, note } = await req.json();
    
    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    
    const requestRes = await dbClient.execute({
      sql: `SELECT req.user_id, req.requested_plan, req.requested_quotas, req.requested_price_bdt, 
                   u.email, u.plan, u.custom_quotas, u.plan_renews_at
            FROM pending_upgrade_requests req
            JOIN users u ON req.user_id = u.id
            WHERE req.id = ? AND req.status = 'PENDING'`,
      args: [requestId]
    });
    
    if (requestRes.rows.length === 0) {
      return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
    }
    
    const reqData = requestRes.rows[0];
    
    const statements: ({ sql: string; args: any[] })[] = [];

    if (action === "APPROVE") {
      const currentUserPlan = reqData.plan as string;
      const currentRenewsAt = reqData.plan_renews_at ? new Date(reqData.plan_renews_at as string) : null;

      let newPlan = reqData.requested_plan as string;
      let newQuotasStr = reqData.requested_quotas as string | null;
      let newRenewsAt = `datetime('now', '+30 days')`;

      if (currentUserPlan !== 'FREE' && currentRenewsAt && currentRenewsAt > new Date()) {
        const currentQuotas = typeof reqData.custom_quotas === 'string' && reqData.custom_quotas.trim().startsWith('{')
          ? JSON.parse(reqData.custom_quotas)
          : {};

        const requestedQuotas = newQuotasStr ? JSON.parse(newQuotasStr) : {};

        const combinedQuotas = { ...currentQuotas };
        for (const key of Object.keys(requestedQuotas)) {
          combinedQuotas[key] = (combinedQuotas[key] || 0) + (requestedQuotas[key] || 0);
        }

        newQuotasStr = JSON.stringify(combinedQuotas);
        newPlan = 'CUSTOM';
        newRenewsAt = `datetime('${currentRenewsAt.toISOString()}', '+30 days')`;
      }

      statements.push({
        sql: `UPDATE users SET plan = ?, custom_quotas = ?, plan_renews_at = ${newRenewsAt} WHERE id = ?`,
        args: [newPlan, newQuotasStr, reqData.user_id as string]
      });

      statements.push({
        sql: `UPDATE pending_upgrade_requests SET status = 'APPROVED' WHERE id = ?`,
        args: [requestId]
      });
    } else {
      statements.push({
        sql: `UPDATE pending_upgrade_requests SET status = 'REJECTED' WHERE id = ?`,
        args: [requestId]
      });
    }

    const auditId = crypto.randomUUID();
    statements.push({
      sql: `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [auditId, adminId, `${action}_UPGRADE_REQUEST`, "pending_upgrade_requests", requestId, JSON.stringify({ note })]
    });

    await dbClient.batch(statements);

    if (action === "APPROVE") {
      await sendUpgradeApprovedEmail(
        reqData.email as string,
        reqData.requested_plan as string,
        reqData.requested_price_bdt as string
      );
    } else {
      await sendUpgradeRejectedEmail(
        reqData.email as string,
        note || ""
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin upgrade requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

