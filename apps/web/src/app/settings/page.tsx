"use client";

import { useEffect, useState } from "react";

import { useChessStore, BOARD_THEMES, BoardThemeId } from "../store";
import { Settings, Cpu, Palette, CheckCircle, MessageSquare, ExternalLink, Globe, Github, Bug, Brain } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { BoardView } from "../../components/BoardView";

const PREVIEW_FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

export default function SettingsPage() {
  const store = useChessStore();
  const [content, setContent] = useState({
    subtitle: "Configure engine, board appearance, and coach preferences.",
    engineDesc: "Choose which Stockfish engine version to use for position analysis. Stockfish 18 is stronger and recommended.",
    legalDesc: "Legal agreements and policies.",
    contactDesc: "Have a question, bug report, or feature request? Send us a message.",
    aboutDesc: "ChessInsight Pro is an all-in-one chess improvement platform designed to help players analyze games, study openings, solve puzzles, train tactical vision, and improve consistently. Powered by Stockfish 18 and built with an offline-first architecture, it delivers fast, private, and professional chess analysis directly in your browser.",
  });

  useEffect(() => {
    fetch("/api/settings/content")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setContent(prev => ({ ...prev, ...data }));
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-black/10 dark:bg-slate-800 border border-slate-700">
            <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{content.subtitle}</p>
          </div>
        </div>

        {/* Engine Settings */}
        <section className="p-6 bg-card border border-border rounded-2xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold text-sm text-teal-400 uppercase tracking-wider">Analysis Engine</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            {content.engineDesc}
          </p>
          <div className="flex gap-2">
            {(["17", "18"] as const).map((v) => (
              <button
                key={v}
                onClick={() => store.setEngineVersion(v)}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                  store.engineVersion === v
                    ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20"
                    : "bg-black/10 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700"
                }`}
              >
                Stockfish {v}
                {v === "18" && <span className="ml-2 text-[10px] font-black uppercase tracking-wider opacity-70">Latest</span>}
              </button>
            ))}
          </div>
          <div className="p-3 bg-black/5 dark:bg-slate-900/60 rounded-xl border border-border text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">Current engine:</strong> Stockfish {store.engineVersion} — Lite Single-threaded WebAssembly build. All analysis runs locally.
          </div>
        </section>

        {/* Board Theme */}
        <section className="p-6 bg-card border border-border rounded-2xl space-y-5">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-sm text-purple-400 uppercase tracking-wider">Board Theme</h2>
          </div>

          {/* Live preview */}
          <div className="rounded-2xl overflow-hidden border border-border max-w-[240px] mx-auto shadow-xl">
            <BoardView
              fen={PREVIEW_FEN}
              arePiecesDraggable={false}
              boardWidth={240}
            />
          </div>

          {/* Theme grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(BOARD_THEMES) as [BoardThemeId, typeof BOARD_THEMES[BoardThemeId]][]).map(([id, theme]) => {
              const isSelected = store.boardTheme === id;
              return (
                <button
                  key={id}
                  onClick={() => store.setBoardTheme(id)}
                  className={`group flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-background ${
                    isSelected
                      ? "border-purple-500 bg-purple-500/10 shadow-sm shadow-purple-500/10"
                      : "border-border bg-black/5 dark:bg-slate-900/40 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-black/10 dark:hover:bg-slate-800/60"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`${theme.label} board theme${isSelected ? " (active)" : ""}`}
                >
                  <div className="flex rounded-lg overflow-hidden w-10 h-10 shrink-0 shadow-sm ring-1 ring-black/5">
                    <div className="w-1/2 h-full" style={{ backgroundColor: theme.dark }} />
                    <div className="w-1/2 h-full" style={{ backgroundColor: theme.light }} />
                  </div>
                  <span className={`text-sm flex-1 text-left ${
                    isSelected ? "font-bold text-foreground" : "font-semibold text-slate-700 dark:text-slate-300"
                  }`}>
                    {theme.label}
                  </span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-purple-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Contact Us */}
        <section className="p-6 bg-card border border-border rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold text-sm text-teal-400 uppercase tracking-wider">Contact Us</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            {content.contactDesc}
          </p>
          <ContactForm />
        </section>

        {/* Legal */}
        <section className="p-6 bg-card border border-border rounded-2xl space-y-4">
          <h2 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Legal</h2>
          <div className="flex gap-4">
            <a href="/privacy" className="flex-1 p-4 bg-black/5 dark:bg-slate-900 rounded-xl text-center hover:bg-teal-500/10 hover:border-teal-500/30 border border-transparent transition">
              <p className="font-bold text-sm text-foreground">Privacy Policy</p>
              <p className="text-[10px] text-slate-500 mt-1">How we handle your data</p>
            </a>
            <a href="/terms" className="flex-1 p-4 bg-black/5 dark:bg-slate-900 rounded-xl text-center hover:bg-teal-500/10 hover:border-teal-500/30 border border-transparent transition">
              <p className="font-bold text-sm text-foreground">Terms of Service</p>
              <p className="text-[10px] text-slate-500 mt-1">Rules &amp; guidelines</p>
            </a>
          </div>
        </section>

        {/* About */}
        <section className="p-6 bg-card border border-border rounded-2xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-teal-400 uppercase tracking-wider">About ChessInsight Pro</h2>
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {content.aboutDesc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-black/5 dark:bg-slate-900/60 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Version</p>
              <p className="text-sm font-bold text-foreground">2.0.0</p>
            </div>
            <div className="p-3.5 bg-black/5 dark:bg-slate-900/60 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Engine</p>
              <p className="text-sm font-bold text-foreground">Stockfish {store.engineVersion} (WASM)</p>
            </div>
            <div className="p-3.5 bg-black/5 dark:bg-slate-900/60 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Storage</p>
              <p className="text-sm font-bold text-foreground">IndexedDB (offline-first)</p>
            </div>
            <div className="p-3.5 bg-black/5 dark:bg-slate-900/60 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Platforms</p>
              <p className="text-sm font-bold text-foreground">Web · Mobile · Tablet</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href="https://chessinsight.pro" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-black/5 dark:bg-slate-900/60 hover:bg-teal-500/10 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-500 rounded-xl border border-border transition">
              <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://github.com/anomalyco/ChessInsightPro" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-black/5 dark:bg-slate-900/60 hover:bg-teal-500/10 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-500 rounded-xl border border-border transition">
              <Github className="w-3.5 h-3.5" /> GitHub <ExternalLink className="w-3 h-3" />
            </a>
            <a href="/contact-to-upgrade" className="inline-flex items-center gap-1.5 px-3 py-2 bg-black/5 dark:bg-slate-900/60 hover:bg-teal-500/10 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-500 rounded-xl border border-border transition">
              <Bug className="w-3.5 h-3.5" /> Report a Bug
            </a>
          </div>

          <p className="text-[10px] text-slate-500">&copy; {new Date().getFullYear()} ChessInsight Pro. All rights reserved.</p>
        </section>
      </div>
    </div>
  );
}
