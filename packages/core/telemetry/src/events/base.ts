import { z } from "zod";

export const EventPrioritySchema = z.enum(["Critical", "High", "Normal", "Low"]);

export const TelemetryMetadataSchema = z.object({
  timestamp: z.number(),
  appVersion: z.string(),
  platform: z.enum(["web", "mobile", "desktop"]),
  environment: z.enum(["development", "staging", "production"]),
  sdkVersion: z.string(),
  timezone: z.string(),
  locale: z.string(),
  sampleRate: z.number().optional(),
});

export const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  correlationId: z.string().optional(),
  sessionId: z.string(),
  category: z.enum([
    "analysis",
    "learning",
    "training",
    "engine",
    "product",
    "business",
    "system",
  ]),
  eventType: z.string(),
  version: z.number(),
  priority: EventPrioritySchema,
  metadata: TelemetryMetadataSchema,
  properties: z.record(z.any()),
  context: z.record(z.any()).optional(),
});

export type TelemetryMetadata = z.infer<typeof TelemetryMetadataSchema>;
export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type EventPriority = z.infer<typeof EventPrioritySchema>;
