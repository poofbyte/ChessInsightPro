import { z } from "zod";

export const CONTACT_CATEGORIES = [
  { id: "general_question", label: "General Question" },
  { id: "bug_report", label: "Bug Report" },
  { id: "feature_request", label: "Feature Request" },
  { id: "billing", label: "Billing" },
  { id: "account", label: "Account" },
  { id: "other", label: "Other" },
] as const;

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  email: z.string().email("Invalid email format"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be 200 characters or less"),
  category: z.enum(["general_question", "bug_report", "feature_request", "billing", "account", "other"]),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000, "Message must be 5000 characters or less"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
