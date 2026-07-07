import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { contactFormSchema } from "./schema";
import { sendContactConfirmationEmail } from "@core/email";
import crypto from "crypto";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 60_000;

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await req.json();

    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
    }

    const { name, email, subject, category, message } = parsed.data;
    const sanitized = {
      name: stripHtml(name),
      email: stripHtml(email),
      subject: stripHtml(subject),
      message: stripHtml(message),
    };

    await ensureDbReady();

    const id = crypto.randomUUID();
    await dbClient.execute({
      sql: `INSERT INTO contact_messages (id, name, email, subject, category, message, status) VALUES (?, ?, ?, ?, ?, ?, 'new')`,
      args: [id, sanitized.name, sanitized.email, sanitized.subject, category, sanitized.message],
    });

    sendContactConfirmationEmail(sanitized.email, sanitized.name).catch((err) => {
      console.error("[Contact] Failed to send confirmation email:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact] Submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
