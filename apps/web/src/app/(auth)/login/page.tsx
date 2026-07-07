"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/app/store";
import { Mail, Lock, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const urlMessage = searchParams.get("message");
  const [message, setMessage] = useState(() => urlMessage || (typeof window !== "undefined" ? sessionStorage.getItem("loginMessage") : null));

  useEffect(() => {
    if (!urlMessage) {
      const stored = sessionStorage.getItem("loginMessage");
      if (stored) {
        setMessage(stored);
        sessionStorage.removeItem("loginMessage");
      }
    }
  }, [urlMessage]);

  const rawCallbackUrl = searchParams.get("callbackUrl") || "/";
  const callbackUrl = rawCallbackUrl.startsWith("/") ? rawCallbackUrl : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      setAuth(data.accessToken, data.user);
      router.push(callbackUrl);
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-4 md:p-8 bg-card border border-border rounded-3xl shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">Welcome Back</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Log in to continue your training.</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm font-bold flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm font-bold flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

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

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
            <Link href="/forgot-password" className="text-xs text-teal-500 hover:text-teal-400 font-bold transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/5 dark:bg-slate-900 border border-border rounded-xl py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-4 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Logging In..." : "Log In"} <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500 font-medium">
        Don't have an account?{" "}
        <Link href="/signup" className="text-teal-500 hover:text-teal-400 transition-colors">
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-background">
      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
