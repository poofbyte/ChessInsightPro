"use client";

import { useState, useEffect } from "react";
import { logActivity } from "@/lib/activity-log";
import { BoardView } from "@/components/BoardView";
import { Map, ChevronRight, TrendingUp } from "lucide-react";
import { Opening } from "@core/content";
import { useAuthStore } from "@/app/store";
import SignUpPrompt from "@/components/SignUpPrompt";
import { PageContainer } from "@/components/layout/PageContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { ChessboardContainer } from "@/components/layout/ChessboardContainer";
import { PanelStack } from "@/components/layout/PanelStack";
import { Panel } from "@/components/layout/Panel";

export function ClientOpenings({ openings }: { openings: Opening[] }) {
  const { accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { logActivity("page_view", "Learn - Openings"); }, []);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  useEffect(() => { if (hydrated && !accessToken) setShowSignUp(true); }, [hydrated, accessToken]);
  const [selected, setSelected] = useState<Opening | null>(null);
  const [filter, setFilter] = useState("All");

  const categories = ["All", ...Array.from(new Set(openings.map((o) => o.category)))];
  const filtered = filter === "All" ? openings : openings.filter((o) => o.category === filter);

  return (
    <PageContainer>
      <ContentContainer maxWidth="max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
            <Map className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Openings</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Study the most important opening systems with statistics and key ideas.</p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
          <PanelStack className="w-full xl:w-[45%] order-2 xl:order-1">
            <Panel className="!p-4">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {categories.map((c) => (
                  <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${filter === c ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"}`}>{c}</button>
                ))}
              </div>
            </Panel>
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="p-8 text-center bg-card border border-border rounded-2xl text-slate-500">
                  No openings found in this category.
                </div>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${selected?.id === o.id ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-card hover:border-slate-400 dark:hover:border-slate-600"}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-500 font-mono">{o.eco}</span>
                        <span className="font-bold text-foreground">{o.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{o.moves}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </PanelStack>

          <PanelStack className="w-full xl:w-[55%] order-1 xl:order-2">
            {selected ? (
              <>
                <ChessboardContainer className="rounded-3xl overflow-hidden border-2 border-border max-w-[400px] xl:max-w-[500px]">
                  <BoardView fen={selected.fen} arePiecesDraggable={false} />
                </ChessboardContainer>
                <Panel className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black">{selected.name}</h2>
                      <span className="text-xs font-black text-slate-500 font-mono bg-black/10 dark:bg-slate-800 px-2 py-1 rounded-lg">{selected.eco}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{selected.description}</p>
                  </div>

                  <div className="p-4 bg-card border border-border rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                      <TrendingUp className="w-4 h-4" /> Master Win Rate
                    </div>
                    <div className="h-3 rounded-full overflow-hidden flex">
                      <div className="bg-white transition-all" style={{ width: `${selected.winRate.white}%` }} />
                      <div className="bg-slate-500 transition-all" style={{ width: `${selected.winRate.draw}%` }} />
                      <div className="bg-black/10 dark:bg-slate-800 transition-all flex-1" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>White: {selected.winRate.white}%</span>
                      <span>Draw: {selected.winRate.draw}%</span>
                      <span>Black: {selected.winRate.black}%</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest">Key Ideas</h3>
                    {selected.keyIdeas.map((idea, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        {idea}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-black/5 dark:bg-slate-900/60 rounded-xl border border-border mt-2">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Moves</span>
                    <p className="font-mono text-teal-600 dark:text-teal-300 mt-1 text-sm">{selected.moves}</p>
                  </div>
                </Panel>
              </>
            ) : (
              <Panel className="flex items-center justify-center h-64 border-dashed">
                <p className="text-slate-500 text-sm">Select an opening to study</p>
              </Panel>
            )}
          </PanelStack>
        </div>
      </ContentContainer>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="openings" />
    </PageContainer>
  );
}
