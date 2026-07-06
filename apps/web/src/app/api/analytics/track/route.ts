import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { TelemetryEventSchema, TursoTelemetryRepository, TelemetryEvent } from "@core/telemetry";

export async function POST(req: Request) {
  try {
    await ensureDbReady();
    
    const body = await req.json();
    
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json({ error: "Invalid payload format. Expected { events: [] }" }, { status: 400 });
    }
    
    const validEvents: TelemetryEvent[] = [];
    
    for (const event of body.events) {
      // Validate runtime payload against Zod schema
      const parsed = TelemetryEventSchema.safeParse(event);
      if (parsed.success) {
        validEvents.push(parsed.data);
      } else {
        console.warn("Invalid telemetry event dropped:", parsed.error);
      }
    }
    
    if (validEvents.length > 0) {
      const repo = new TursoTelemetryRepository(dbClient);
      await repo.saveEvents(validEvents);
    }
    
    return NextResponse.json({ success: true, processedCount: validEvents.length });
    
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
