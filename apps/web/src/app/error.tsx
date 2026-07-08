"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-background p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-black">Something went wrong</h2>
        <p className="text-sm text-slate-500 font-mono bg-black/5 dark:bg-slate-900 p-4 rounded-xl break-all">
          {error.message || error.digest || "Unknown error"}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
