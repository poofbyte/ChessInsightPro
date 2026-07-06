import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { eventBus } from "../bus";
import {
  AnalysisStartedProperties,
  AnalysisCompletedProperties,
  PageViewedProperties,
  SessionStartedProperties,
  TelemetryEvent,
  EventPriority,
} from "../events";

// Global context that can be set by the app
export const globalTelemetryContext: {
  sessionId?: string;
  appVersion: string;
  platform: "web" | "mobile" | "desktop";
  environment: "development" | "staging" | "production";
} = {
  appVersion: "1.0.0",
  platform: "web",
  environment: typeof process !== "undefined" && process.env.NODE_ENV === "production" ? "production" : "development",
};

// Helper to build and publish the event
function dispatch<TProps>(
  category: string,
  eventType: string,
  properties: TProps,
  priority: EventPriority,
  version: number,
  context?: Record<string, any>,
  correlationId?: string
) {
  const sessionId = globalTelemetryContext.sessionId || "anonymous";

  const event: any = {
    eventId: uuidv4(),
    correlationId,
    sessionId,
    category,
    eventType,
    version,
    priority,
    properties,
    context,
    metadata: {
      timestamp: Date.now(),
      appVersion: globalTelemetryContext.appVersion,
      platform: globalTelemetryContext.platform,
      environment: globalTelemetryContext.environment,
      sdkVersion: "1.0.0",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language || "en-US",
    },
  };

  eventBus.publish(event as TelemetryEvent);
  return event.eventId;
}

export const telemetry = {
  setSessionId: (id: string) => {
    globalTelemetryContext.sessionId = id;
  },

  product: {
    pageViewed: (props: z.infer<typeof PageViewedProperties>, context?: any) =>
      dispatch("product", "PageViewed", props, "Low", 1, context),
    sessionStarted: (props: z.infer<typeof SessionStartedProperties>, context?: any) =>
      dispatch("product", "SessionStarted", props, "Normal", 1, context),
  },

  analysis: {
    started: (props: z.infer<typeof AnalysisStartedProperties>, context?: any) =>
      dispatch("analysis", "AnalysisStarted", props, "High", 1, context, uuidv4()),
    completed: (props: z.infer<typeof AnalysisCompletedProperties>, context?: any, correlationId?: string) =>
      dispatch("analysis", "AnalysisCompleted", props, "High", 1, context, correlationId),
  },
};
