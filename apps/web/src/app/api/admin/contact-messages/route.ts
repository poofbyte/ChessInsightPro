import { getAdminUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { sendContactReplyEmail } from "@core/email";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const q = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status")?.trim();
    const category = url.searchParams.get("category")?.trim();
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const args: any[] = [];

    if (q) {
      conditions.push("(name LIKE ? OR email LIKE ? OR subject LIKE ?)");
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    if (status) {
      conditions.push("status = ?");
      args.push(status);
    }
    if (category) {
      conditions.push("category = ?");
      args.push(category);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await dbClient.execute({
      sql: `SELECT COUNT(*) as total FROM contact_messages ${where}`,
      args,
    });
    const total = countResult.rows[0]?.total ?? 0;

    const result = await dbClient.execute({
      sql: `SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    return NextResponse.json({
      messages: result.rows,
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    console.error("[Admin Contact Messages] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();

    const body = await req.json();
    const { messageId, status: newStatus, adminNotes, replyBody } = body;

    if (!messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const existing = await dbClient.execute({
      sql: `SELECT * FROM contact_messages WHERE id = ?`,
      args: [messageId],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const msg = existing.rows[0];

    if (replyBody) {
      await dbClient.execute({
        sql: `UPDATE contact_messages SET reply_body = ?, replied_at = datetime('now'), replied_by = ?, status = 'replied', admin_notes = COALESCE(?, admin_notes) WHERE id = ?`,
        args: [replyBody, adminId, adminNotes || null, messageId],
      });

      sendContactReplyEmail(
        msg.email as string,
        msg.name as string,
        replyBody,
        msg.subject as string
      ).catch((err) => {
        console.error("[Admin Contact] Failed to send reply email:", err);
      });
    } else if (newStatus) {
      const updates: string[] = ["status = ?"];
      const updateArgs: any[] = [newStatus];
      if (adminNotes !== undefined) {
        updates.push("admin_notes = ?");
        updateArgs.push(adminNotes);
      }
      updateArgs.push(messageId);
      await dbClient.execute({
        sql: `UPDATE contact_messages SET ${updates.join(", ")} WHERE id = ?`,
        args: updateArgs,
      });
    } else if (adminNotes !== undefined) {
      await dbClient.execute({
        sql: `UPDATE contact_messages SET admin_notes = ? WHERE id = ?`,
        args: [adminNotes, messageId],
      });
    }

    const auditId = crypto.randomUUID();
    await dbClient.execute({
      sql: `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        auditId,
        adminId,
        replyBody ? "CONTACT_REPLIED" : "CONTACT_UPDATED",
        "contact_messages",
        messageId,
        JSON.stringify({ status: newStatus, hasReply: !!replyBody }),
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Contact Messages] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
