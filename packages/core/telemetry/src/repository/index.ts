import { TelemetryEvent } from "../events";
import { Client } from "@libsql/client";

export interface TelemetryRepository {
  /**
   * Persist a batch of events.
   */
  saveEvents(events: TelemetryEvent[]): Promise<void>;
}

export class TursoTelemetryRepository implements TelemetryRepository {
  constructor(private dbClient: Client) {}

  async saveEvents(events: TelemetryEvent[]): Promise<void> {
    if (events.length === 0) return;

    const statements = events.map((event) => ({
      sql: `
        INSERT INTO analytics_events (
          event_id, version, category, event_type, correlation_id, 
          session_id, user_id, priority, timestamp, platform, app_version, properties, context, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(event_id) DO NOTHING
      `,
      args: [
        event.eventId,
        event.version,
        event.category,
        event.eventType,
        event.correlationId || null,
        event.sessionId,
        null,
        event.priority,
        event.metadata.timestamp,
        event.metadata.platform,
        event.metadata.appVersion,
        JSON.stringify(event.properties),
        event.context ? JSON.stringify(event.context) : null,
        JSON.stringify(event.metadata),
      ],
    }));

    await this.dbClient.batch(statements);
  }
}
