import { z } from "zod";
import { PageViewedEvent, SessionStartedEvent } from "./product";
import { AnalysisStartedEvent, AnalysisCompletedEvent } from "./analysis";

export * from "./base";
export * from "./product";
export * from "./analysis";

export const TelemetryEventSchema = z.discriminatedUnion("eventType", [
  PageViewedEvent,
  SessionStartedEvent,
  AnalysisStartedEvent,
  AnalysisCompletedEvent,
  // Add others here as we build them out
]);

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
