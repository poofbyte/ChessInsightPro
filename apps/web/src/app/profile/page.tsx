"use client";

import { useEffect, useState } from "react";
import { PlayerProfile } from "@chessinsight/types";
import { db } from "../db";
import { RecommendationEngine } from "@chessinsight/recommendations";
import { SpacedRepetitionManager } from "@chessinsight/learning";
import { AlertTriangle, Award, BookOpen, Target, TrendingUp } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [leitnerCards, setLeitnerCards] = useState<any[]>([]);

  const load = async () => {
    const [prof, cards] = await Promise.all([
      db.profiles.get("default-user"),
      db.learning.toArray(),
    ]);
    setProfile(prof ?? null);
    setLeitnerCards(cards);
  };

  useEffect(() => { load(); }, []);

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic">
        No profile data yet. Analyze a game to build your player profile.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile header */}
        <div className="p-6 bg-gradient-to-r from-[#11182c] to-[#0a0f1d] border border-border rounded-2xl flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20">
            <Award className="w-10 h-10 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Player Analytics</h1>
            <p className="text-slate-300 text-sm mt-1">Weakness profiling and personalized study plan based on your game history.</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Estimated ELO</p>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              {profile.estimatedElo}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{profile.gamesPlayed} games analyzed</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <MiniStat icon={<TrendingUp className="w-4 h-4 text-teal-400" />} label="Games Played" value={String(profile.gamesPlayed)} />
          <MiniStat icon={<Target className="w-4 h-4 text-rose-400" />} label="Weaknesses" value={String(profile.detectedWeaknesses.length)} />
          <MiniStat icon={<BookOpen className="w-4 h-4 text-blue-400" />} label="Concepts in Leitner" value={String(leitnerCards.length)} />
        </div>

        {/* Recommendations */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-teal-400">Personalized Study Program</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RecommendationEngine.getRecommendations(profile.detectedWeaknesses).map((rec) => (
              <div key={rec.id} className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider px-2 py-0.5 rounded bg-black/10 dark:bg-slate-800">{rec.category}</span>
                    <span className="text-xs text-slate-500">Motif: {rec.motif}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-200 mb-1">{rec.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{rec.description}</p>
                </div>
                <div className="pt-4 border-t border-border text-xs text-slate-700 dark:text-slate-300 font-semibold italic mt-4">
                  🎯 Suggested: {rec.suggestedAction}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weaknesses */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-teal-400">Identified Weaknesses</h2>
          {profile.detectedWeaknesses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-black/5 dark:bg-slate-900 border border-border rounded-2xl italic text-sm">
              No critical weaknesses detected yet. Analyze more games to build your weakness profile.
            </div>
          ) : (
            <div className="space-y-2">
              {profile.detectedWeaknesses.map((w) => (
                <div key={w.motif} className="p-4 bg-black/5 dark:bg-slate-900 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-rose-400">{w.motif} ({w.count} occurrences)</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{w.description}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 ml-4" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Leitner Concept Box */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-teal-400">Leitner Spaced Repetition</h2>
          {leitnerCards.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-black/5 dark:bg-slate-900 border border-border rounded-2xl italic text-sm">
              No concepts in Leitner boxes yet. Weaknesses detected from game analysis will populate here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leitnerCards.map((card) => {
                const diffDays = Math.ceil((new Date(card.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={card.conceptId} className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black uppercase text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">Box {card.box}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">Streak: {card.correctStreak}🔥</span>
                      </div>
                      <h3 className="font-bold text-lg mb-1">{card.conceptId} Concept Review</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Next review: {new Date(card.nextReviewDate).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">
                        {diffDays <= 0 ? "Review Ready! 🎯" : `Due in ${diffDays} days`}
                      </span>
                      <button
                        onClick={() => db.learning.put(SpacedRepetitionManager.updateConceptProgress(card, true)).then(load)}
                        className="px-3 py-1.5 bg-black/10 dark:bg-slate-800 text-teal-400 text-xs font-bold rounded-lg hover:bg-slate-700 transition"
                      >
                        Mark Reviewed
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
        <p className="text-xl font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}
