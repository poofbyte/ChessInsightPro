import { z } from "zod";
import { BaseEventSchema } from "./base";

export const AnalysisStartedProperties = z.object({
  gameId: z.string().optional(),
  source: z.enum(["lichess", "chesscom", "pgn", "sandbox"]),
});

export const AnalysisStartedEvent = BaseEventSchema.extend({
  category: z.literal("analysis"),
  eventType: z.literal("AnalysisStarted"),
  properties: AnalysisStartedProperties,
});

export const AnalysisCompletedProperties = z.object({
  gameId: z.string().optional(),
  durationSeconds: z.number(),
});

export const AnalysisCompletedEvent = BaseEventSchema.extend({
  category: z.literal("analysis"),
  eventType: z.literal("AnalysisCompleted"),
  properties: AnalysisCompletedProperties,
});

export type AnalysisStartedEvent = z.infer<typeof AnalysisStartedEvent>;
export type AnalysisCompletedEvent = z.infer<typeof AnalysisCompletedEvent>;
