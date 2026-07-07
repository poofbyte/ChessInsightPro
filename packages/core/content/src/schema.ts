import { z } from "zod";

export const LessonSlideSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  fen: z.string().min(1),
});

export const LessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  duration: z.string().min(1),
  icon: z.string().min(1),
  slides: z.array(LessonSlideSchema),
});

export const RuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().min(1),
  content: z.string().min(1),
  fen: z.string().min(1),
  tip: z.string().min(1),
});

export const TermSchema = z.object({
  term: z.string().min(1),
  category: z.string().min(1),
  definition: z.string().min(1),
});

export const OpeningSchema = z.object({
  name: z.string().min(1),
  eco: z.string().min(1),
  moves: z.string().min(1),
});

export const SiteSettingsSchema = z.object({
  siteName: z.string().min(1),
  description: z.string(),
  primaryColor: z.string().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  maintenanceMode: z.boolean().default(false),
});

// Main types
export type Lesson = z.infer<typeof LessonSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Term = z.infer<typeof TermSchema>;
export type Opening = z.infer<typeof OpeningSchema>;
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
