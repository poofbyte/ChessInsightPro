import { z } from "zod";
import { BaseEventSchema } from "./base";

export const PageViewedProperties = z.object({
  path: z.string(),
  search: z.string().optional(),
});

export const PageViewedEvent = BaseEventSchema.extend({
  category: z.literal("product"),
  eventType: z.literal("PageViewed"),
  properties: PageViewedProperties,
});

export const SessionStartedProperties = z.object({
  referrer: z.string().optional(),
});

export const SessionStartedEvent = BaseEventSchema.extend({
  category: z.literal("product"),
  eventType: z.literal("SessionStarted"),
  properties: SessionStartedProperties,
});

export type PageViewedEvent = z.infer<typeof PageViewedEvent>;
export type SessionStartedEvent = z.infer<typeof SessionStartedEvent>;
