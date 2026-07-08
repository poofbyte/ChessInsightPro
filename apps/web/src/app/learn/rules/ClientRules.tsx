"use client";

import { useState, useEffect } from "react";
import { logActivity } from "@/lib/activity-log";
import { BoardView } from "@/components/BoardView";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { Rule } from "@core/content";
import { useAuthStore } from "@/app/store";
import SignUpPrompt from "@/components/SignUpPrompt";
import { PageContainer } from "@/components/layout/PageContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { ChessboardContainer } from "@/components/layout/ChessboardContainer";
import { PanelStack } from "@/components/layout/PanelStack";
import { Panel } from "@/components/layout/Panel";

export function ClientRules({ rules }: { rules: Rule[] }) {
  const { accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { logActivity("page_view", "Learn - Rules"); }, []);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  useEffect(() => { if (hydrated && !accessToken) setShowSignUp(true); }, [hydrated, accessToken]);
  const [idx, setIdx] = useState(0);
  
  if (!rules || rules.length === 0) return <div className="p-8 text-slate-500">No rules configured.</div>;
  
  const rule = rules[idx];

  return (
    <PageContainer>
      <ContentContainer maxWidth="max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/20">
            <ScrollText className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Rules of Chess</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Everything you need to know to play — from movement to special rules.</p>
          </div>
        </div>

        {/* Chapter tabs */}
        <div className="flex gap-1 mb-8 bg-card border border-border p-1 rounded-2xl overflow-x-auto">
          {rules.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setIdx(i)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${i === idx ? "bg-amber-500 text-black" : "text-slate-600 dark:text-slate-400 hover:text-foreground"}`}
            >
              {r.icon} {r.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
          <div className="w-full xl:w-[55%]">
            <ChessboardContainer className="rounded-3xl overflow-hidden border-2 border-border">
              <BoardView fen={rule.fen} arePiecesDraggable={false} />
            </ChessboardContainer>
          </div>
          <PanelStack className="w-full xl:w-[45%]">
            <Panel className="flex flex-col gap-5 justify-center">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{rule.icon}</span>
                <h2 className="text-2xl font-black">{rule.title}</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                {rule.content.split("\\n").map((line, i) => {
                  if (!line) return <br key={i} />;
                  const isBold = line === line.toUpperCase() && line.length > 3 && !line.includes(".");
                  return <p key={i} className={`text-sm leading-relaxed mb-2 ${isBold ? "font-black text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>{line}</p>;
                })}
              </div>
            </div>
            {/* Tip */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest">💡 Pro Tip</span>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{rule.tip}</p>
            </div>
            </Panel>
          </PanelStack>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button disabled={idx === 0} onClick={() => setIdx(i => i - 1)} className="flex items-center gap-2 px-4 py-2 bg-black/10 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-sm font-bold transition">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-slate-500">{idx + 1} / {rules.length}</span>
          <button disabled={idx === rules.length - 1} onClick={() => setIdx(i => i + 1)} className="flex items-center gap-2 px-4 py-2 bg-black/10 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-sm font-bold transition">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </ContentContainer>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="rules" />
    </PageContainer>
  );
}
