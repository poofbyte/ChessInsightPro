import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    
    const body = await req.json();
    const { event_name, url, referrer, properties } = body;
    
    if (!event_name) {
      return NextResponse.json({ error: "Missing event_name" }, { status: 400 });
    }
    
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("analytics_session_id")?.value;
    
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookieStore.set("analytics_session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: "/",
      });
    }
    
    const userAgent = req.headers.get("user-agent") || "";
    const id = crypto.randomUUID();
    
    // We will attempt to get user_id from the authorization if available, but for now we leave it null 
    // unless they send it from the client securely. A better way would be verifying a token, 
    // but anonymous events are also fine.
    
    await dbClient.execute({
      sql: `INSERT INTO analytics_events (id, event_name, session_id, user_id, url, referrer, user_agent, properties) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        event_name,
        sessionId,
        null, // user_id (could be populated if logged in)
        url || null,
        referrer || null,
        userAgent,
        properties ? JSON.stringify(properties) : null
      ]
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
