"use client";

import { useChessStore } from "../store";
import { Settings, Cpu, Palette } from "lucide-react";

const BOARD_THEMES = [
  { id: "slate", label: "Classic Slate", dark: "#2d3748", light: "#4a5568" },
  { id: "teal", label: "Ocean Teal", dark: "#2b3447", light: "#3f4b66" },
  { id: "green", label: "Tournament Green", dark: "#769656", light: "#eeeed2" },
  { id: "marble", label: "Dark Marble", dark: "#1a1a2e", light: "#16213e" },
];

export default function SettingsPage() {
  const store = useChessStore();

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0f1d]">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700">
            <Settings className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Settings</h1>
            <p className="text-slate-400 text-sm">Configure engine, board appearance, and coach preferences.</p>
          </div>
        </div>

        {/* Engine Settings */}
        <section className="p-6 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold text-sm text-teal-400 uppercase tracking-wider">Analysis Engine</h2>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Choose which Stockfish engine version to use for position analysis. Stockfish 18 is stronger and recommended for most users.
          </p>
          <div className="flex gap-2">
            {(["17", "18"] as const).map((v) => (
              <button
                key={v}
                onClick={() => store.setEngineVersion(v)}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                  store.engineVersion === v
                    ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Stockfish {v}
                {v === "18" && (
                  <span className="ml-2 text-[10px] font-black uppercase tracking-wider opacity-70">Latest</span>
                )}
              </button>
            ))}
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Current engine:</strong> Stockfish {store.engineVersion} — Lite Single-threaded WebAssembly build.
            Both versions run entirely in your browser with no data sent to external servers.
          </div>
        </section>

        {/* Board Theme */}
        <section className="p-6 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-sm text-purple-400 uppercase tracking-wider">Board Theme</h2>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Board theme selection coming soon. More customization options will be available in future updates.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {BOARD_THEMES.map((theme) => (
              <div
                key={theme.id}
                className="p-3 border border-slate-800 rounded-xl flex items-center gap-3 opacity-60 cursor-not-allowed"
              >
                <div className="flex rounded overflow-hidden w-8 h-8 shrink-0">
                  <div className="w-1/2 h-full" style={{ backgroundColor: theme.dark }} />
                  <div className="w-1/2 h-full" style={{ backgroundColor: theme.light }} />
                </div>
                <span className="text-xs font-semibold text-slate-300">{theme.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="p-6 bg-[#0d1326] border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-1">
          <p className="font-black text-slate-300 text-sm mb-3">About ChessInsight Pro</p>
          <p>Version: 2.0.0</p>
          <p>Engine: Stockfish {store.engineVersion} (WebAssembly)</p>
          <p>Storage: IndexedDB (offline-first)</p>
          <p className="pt-2 text-slate-500">All analysis runs locally in your browser. No account or internet required for core features.</p>
        </section>
      </div>
    </div>
  );
}
