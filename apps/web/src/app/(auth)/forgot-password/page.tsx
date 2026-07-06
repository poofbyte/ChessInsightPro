"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to request reset link.");
        return;
      }

      setStatus("success");
      setMessage("If an account exists, a reset link has been sent (check server logs for the stub link!).");
    } catch (err: any) {
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">Reset Password</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Enter your email to receive a reset link.</p>
        </div>

        {status === "success" && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm font-bold flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm font-bold flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {status !== "success" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/5 dark:bg-slate-900 border border-border rounded-xl py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-4 mt-4 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Send Reset Link"} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500 font-medium">
          Remember your password?{" "}
          <Link href="/login" className="text-teal-500 hover:text-teal-400 transition-colors">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
