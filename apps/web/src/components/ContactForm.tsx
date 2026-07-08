"use client";

import { useState } from "react";
import { CONTACT_CATEGORIES, contactFormSchema } from "@/app/api/contact/schema";
import { Loader2, CheckCircle, XCircle, MessageSquare } from "lucide-react";

type FormState = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setSubject("");
    setCategory("");
    setMessage("");
    setScreenshotUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const parsed = contactFormSchema.safeParse({ name, email, subject, category, message });
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const flattened: Record<string, string> = {};
      for (const [key, vals] of Object.entries(errors)) {
        if (vals && vals.length > 0) flattened[key] = vals[0];
      }
      setFieldErrors(flattened);
      return;
    }

    setFormState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          ...(screenshotUrl.trim() ? { screenshot_url: screenshotUrl.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setFormState("success");
      resetForm();
      setTimeout(() => setFormState("idle"), 5000);
    } catch (err: any) {
      setFormState("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  if (formState === "success") {
    return (
      <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-3">
        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
        <p className="font-bold text-emerald-600 dark:text-emerald-400">We&apos;ve received your message</p>
        <p className="text-xs text-slate-500">Our team will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formState === "error" && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2" role="alert">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
            Name <span className="text-rose-400">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={formState === "loading"}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
            placeholder="Your name"
          />
          {fieldErrors.name && <p id="contact-name-error" className="text-[10px] text-rose-400 mt-1 font-medium" role="alert">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="contact-email" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
            Email <span className="text-rose-400">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={formState === "loading"}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
            placeholder="you@example.com"
          />
          {fieldErrors.email && <p id="contact-email-error" className="text-[10px] text-rose-400 mt-1 font-medium" role="alert">{fieldErrors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
          Subject <span className="text-rose-400">*</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={formState === "loading"}
          aria-invalid={!!fieldErrors.subject}
          aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
          placeholder="Brief summary of your message"
        />
        {fieldErrors.subject && <p id="contact-subject-error" className="text-[10px] text-rose-400 mt-1 font-medium" role="alert">{fieldErrors.subject}</p>}
      </div>

      <div>
        <label htmlFor="contact-category" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
          Category <span className="text-rose-400">*</span>
        </label>
        <select
          id="contact-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={formState === "loading"}
          aria-invalid={!!fieldErrors.category}
          aria-describedby={fieldErrors.category ? "contact-category-error" : undefined}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
        >
          <option value="">Select a category</option>
          {CONTACT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        {fieldErrors.category && <p id="contact-category-error" className="text-[10px] text-rose-400 mt-1 font-medium" role="alert">{fieldErrors.category}</p>}
      </div>

      <div>
        <label htmlFor="contact-message" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
          Message <span className="text-rose-400">*</span>
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={formState === "loading"}
          rows={5}
          aria-invalid={!!fieldErrors.message}
          aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 resize-y min-h-[100px]"
          placeholder="Describe your question, bug, or feature request in detail"
        />
        {fieldErrors.message && <p id="contact-message-error" className="text-[10px] text-rose-400 mt-1 font-medium" role="alert">{fieldErrors.message}</p>}
      </div>

      <div>
        <label htmlFor="contact-screenshot" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
          Screenshot URL <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          id="contact-screenshot"
          type="url"
          value={screenshotUrl}
          onChange={(e) => setScreenshotUrl(e.target.value)}
          disabled={formState === "loading"}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
          placeholder="https://example.com/screenshot.png"
        />
      </div>

      <button
        type="submit"
        disabled={formState === "loading"}
        className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
      >
        {formState === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
