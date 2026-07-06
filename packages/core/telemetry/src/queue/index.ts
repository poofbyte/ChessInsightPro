import Dexie, { Table } from "dexie";
import { TelemetryEvent, TelemetryEventSchema } from "../events";

export type EventLifecycleState = 
  | "Queued" 
  | "Validated" 
  | "Stored Locally" 
  | "Uploaded";

export interface QueuedEvent {
  eventId: string;
  payload: TelemetryEvent;
  state: EventLifecycleState;
  queuedAt: number;
  retryCount: number;
}

class TelemetryDatabase extends Dexie {
  events!: Table<QueuedEvent, string>;

  constructor() {
    super("ChessInsightTelemetry");
    this.version(1).stores({
      events: "eventId, state, queuedAt", // Indexes
    });
  }
}

const db = typeof window !== "undefined" ? new TelemetryDatabase() : null;

export async function enqueueEvent(event: TelemetryEvent) {
  if (!db) return; // Server-side environment
  
  // State: Queued -> Validated
  const parsed = TelemetryEventSchema.safeParse(event);
  if (!parsed.success) {
    console.error("Telemetry event validation failed", parsed.error);
    return; // Drop invalid events before storage
  }

  // State: Stored Locally
  await db.events.put({
    eventId: event.eventId,
    payload: event,
    state: "Stored Locally",
    queuedAt: Date.now(),
    retryCount: 0,
  });
  
  // Try flushing immediately
  flushQueue();
}

let isFlushing = false;

export async function flushQueue() {
  if (!db || isFlushing) return;
  isFlushing = true;

  try {
    const pendingEvents = await db.events
      .where("state")
      .equals("Stored Locally")
      .limit(50)
      .toArray();

    if (pendingEvents.length === 0) {
      isFlushing = false;
      return;
    }

    // Call API (State: Uploaded)
    const response = await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: pendingEvents.map((e) => e.payload) }),
    });

    if (response.ok) {
      // Remove uploaded events
      const ids = pendingEvents.map((e) => e.eventId);
      await db.events.bulkDelete(ids);
    } else {
      // Increment retry counts (exponential backoff could be implemented here)
      for (const e of pendingEvents) {
        await db.events.update(e.eventId, { retryCount: e.retryCount + 1 });
      }
    }
  } catch (error) {
    console.warn("Failed to flush telemetry queue (this is expected if offline or server is restarting)", error);
  } finally {
    isFlushing = false;
  }
}
