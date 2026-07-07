"use client";

import Link from "next/link";
import { X, Brain, LogIn, UserPlus } from "lucide-react";

export default function SignUpPrompt({ open, onClose, feature }: { open: boolean; onClose: () => void; feature?: string }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center space-y-4">
          <button onClick={onClose} className="float-right p-1.5 bg-black/5 dark:bg-slate-800 rounded-full hover:bg-black/10 dark:hover:bg-slate-700 transition">
            <X className="w-4 h-4" />
          </button>

          <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
            <Brain className="w-7 h-7 text-teal-500" />
          </div>

          <div>
            <h2 className="text-xl font-black">Create an Account</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {feature
                ? `Sign up to access ${feature} and track your progress.`
                : "Sign up to unlock all features and track your chess improvement."}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/signup"
              onClick={onClose}
              className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-black font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Create Free Account
            </Link>
            <Link
              href="/login"
              onClick={onClose}
              className="w-full py-3 bg-black/5 dark:bg-slate-800 hover:bg-black/10 dark:hover:bg-slate-700 text-foreground font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          </div>

          <p className="text-[10px] text-slate-500">
            Free tier includes 5 game reviews and 10 training sessions per month.
          </p>
        </div>
      </div>
    </div>
  );
}
