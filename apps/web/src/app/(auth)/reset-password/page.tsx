"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Lock, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!token) {
    return (
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-3xl shadow-2xl text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">Invalid Link</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">This password reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="px-6 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition inline-block">
          Request New Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to reset password.");
        return;
      }

      setStatus("success");
      setMessage("Password successfully reset! You can now log in.");
    } catch (err: any) {
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-card border border-border rounded-3xl shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">New Password</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Enter a new secure password for your account.</p>
      </div>

      {status === "success" ? (
        <div className="text-center">
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>{message}</p>
          </div>
          <Link href="/login" className="px-8 py-3 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 transition inline-flex items-center gap-2">
            Go to Log In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {status === "error" && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm font-bold flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/5 dark:bg-slate-900 border border-border rounded-xl py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirm Password</label>
              <div className="relative">
                <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/5 dark:bg-slate-900 border border-border rounded-xl py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-4 mt-4 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === "loading" ? "Resetting..." : "Reset Password"} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background">
      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
