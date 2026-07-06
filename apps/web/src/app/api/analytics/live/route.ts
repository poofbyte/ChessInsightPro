import { NextResponse } from "next/server";
import { dbClient } from "@/lib/db";

// Force dynamic so Next.js doesn't cache this endpoint
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let lastTimestamp = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "connected" })}\n\n`));

      const interval = setInterval(async () => {
        try {
          const result = await dbClient.execute({
            sql: `
              SELECT event_id, event_type, category, timestamp, platform
              FROM analytics_events 
              WHERE timestamp > ?
              ORDER BY timestamp ASC
              LIMIT 50
            `,
            args: [lastTimestamp],
          });

          if (result.rows.length > 0) {
            // Update lastTimestamp to the latest one we got
            lastTimestamp = Number(result.rows[result.rows.length - 1].timestamp);

            const data = JSON.stringify({ events: result.rows });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } else {
            // Send a ping to keep connection alive
            controller.enqueue(encoder.encode(`: ping\n\n`));
          }
        } catch (err) {
          console.error("SSE Poll Error:", err);
        }
      }, 3000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
