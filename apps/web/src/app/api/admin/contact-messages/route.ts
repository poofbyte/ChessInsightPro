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
    const archived = url.searchParams.get("archived");
    const replyMessageId = url.searchParams.get("replies");
    const offset = (page - 1) * limit;

    if (replyMessageId) {
      const repliesResult = await dbClient.execute({
        sql: `SELECT * FROM contact_replies WHERE message_id = ? ORDER BY created_at ASC`,
        args: [replyMessageId],
      });
      return NextResponse.json({ replies: repliesResult.rows });
    }

    const conditions: string[] = [];
    const args: any[] = [];

    if (q) {
      conditions.push("(name LIKE ? OR email LIKE ? OR subject LIKE ?)");
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    if (status) {
      conditions.push("m.status = ?");
      args.push(status);
    }
    if (category) {
      conditions.push("m.category = ?");
      args.push(category);
    }
    if (archived === "1") {
      conditions.push("m.archived_at IS NOT NULL");
    } else if (archived !== "all") {
      conditions.push("m.archived_at IS NULL");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await dbClient.execute({
      sql: `SELECT COUNT(*) as total FROM contact_messages m ${where}`,
      args,
    });
    const total = countResult.rows[0]?.total ?? 0;

    const result = await dbClient.execute({
      sql: `SELECT m.*, (SELECT COUNT(*) FROM contact_replies WHERE message_id = m.id) as reply_count FROM contact_messages m ${where} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
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
    const { messageId, action, status: newStatus, adminNotes, replyBody } = body;

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
    const auditId = crypto.randomUUID();
    let statements: { sql: string; args: any[] }[] = [];
    let auditAction = "CONTACT_UPDATED";

    if (action === "reply") {
      if (!replyBody?.trim()) {
        return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
      }

      const replyId = crypto.randomUUID();
      statements = [
        {
          sql: `INSERT INTO contact_replies (id, message_id, body, sent_by, status) VALUES (?, ?, ?, ?, 'sent')`,
          args: [replyId, messageId, replyBody.trim(), adminId],
        },
        {
          sql: `UPDATE contact_messages SET status = 'replied' WHERE id = ?`,
          args: [messageId],
        },
        {
          sql: `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [auditId, adminId, "CONTACT_REPLIED", "contact_messages", messageId, JSON.stringify({ action, hasReply: true })],
        },
      ];

      await dbClient.batch(statements);

      const emailResult = await sendContactReplyEmail(
        msg.email as string,
        msg.name as string,
        replyBody.trim(),
        msg.subject as string
      );
      if (!emailResult.success) {
        console.error("[Admin Contact] Failed to send reply email:", emailResult.error);
      }
    } else if (action === "archive") {
      statements = [
        { sql: `UPDATE contact_messages SET archived_at = datetime('now') WHERE id = ?`, args: [messageId] },
        { sql: `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)`, args: [auditId, adminId, "CONTACT_ARCHIVED", "contact_messages", messageId, JSON.stringify({ action })] },
      ];
      await dbClient.batch(statements);
    } else if (action === "unarchive") {
      statements = [
        { sql: `UPDATE contact_messages SET archived_at = NULL WHERE id = ?`, args: [messageId] },
        { sql: `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)`, args: [auditId, adminId, "CONTACT_UNARCHIVED", "contact_messages", messageId, JSON.stringify({ action })] },
      ];
      await dbClient.batch(statements);
    } else if (action === "updateStatus") {
      if (!newStatus) {
        return NextResponse.json({ error: "Status is required" }, { status: 400 });
      }
      statements = [
        { sql: `UPDATE contact_messages SET status = ? WHERE id = ?`, args: [newStatus, messageId] },
        { sql: `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)`, args: [auditId, adminId, "CONTACT_UPDATED", "contact_messages", messageId, JSON.stringify({ action, status: newStatus })] },
      ];
      await dbClient.batch(statements);
    } else if (action === "updateNotes") {
      await dbClient.execute({
        sql: `UPDATE contact_messages SET admin_notes = ? WHERE id = ?`,
        args: [adminNotes ?? null, messageId],
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Contact Messages] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
