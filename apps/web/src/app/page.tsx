"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "./db";
import { Game, PlayerProfile } from "@chessinsight/types";
import { Brain, History, Award, Upload, TrendingUp, Target, Zap, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [recentGames, setRecentGames] = useState<Game[]>([]);

  useEffect(() => {
    const load = async () => {
      const [games, prof] = await Promise.all([
        db.games.reverse().limit(3).toArray(),
        db.profiles.get("default-user"),
      ]);
      setRecentGames(games);
      setProfile(prof ?? null);
    };
    load();
  }, []);

  const hasData = recentGames.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0f1d]">
      {/* Hero */}
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/20">
            <Brain className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {hasData
                ? `${recentGames.length} recent games analyzed. Keep improving.`
                : "Start by importing your first game to unlock insights."}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-teal-400" />}
            label="Estimated ELO"
            value={profile?.estimatedElo?.toString() ?? "—"}
            sub="Based on move quality"
          />
          <StatCard
            icon={<History className="w-5 h-5 text-blue-400" />}
            label="Games Analyzed"
            value={profile?.gamesPlayed?.toString() ?? "0"}
            sub="Total lifetime games"
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-rose-400" />}
            label="Weaknesses Found"
            value={profile?.detectedWeaknesses?.length?.toString() ?? "0"}
            sub="Active motif patterns"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction
              href="/analysis"
              icon={<Upload className="w-5 h-5" />}
              title="Import & Analyze Game"
              description="Paste PGN or a Chess.com / Lichess URL"
              accent="teal"
            />
            <QuickAction
              href="/profile"
              icon={<Award className="w-5 h-5" />}
              title="View Player Profile"
              description="Weakness detection and study program"
              accent="blue"
            />
          </div>
        </div>

        {/* Recent Games */}
        {hasData && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Recent Games</h2>
              <Link href="/analysis" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentGames.map((g) => (
                <Link
                  key={g.id}
                  href="/analysis"
                  className="flex items-center justify-between p-4 bg-[#0d1326] hover:bg-slate-800/60 border border-slate-800 hover:border-teal-500/30 rounded-2xl transition group"
                >
                  <div>
                    <span className="font-bold text-sm block">{g.white.name} vs {g.black.name}</span>
                    <span className="text-xs text-slate-400">{g.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-1 rounded-lg">{g.result}</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasData && (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-slate-800/60 border-dashed rounded-3xl">
            <Zap className="w-12 h-12 text-teal-500/40 mb-4" />
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              No games analyzed yet. Import your first game from Chess.com or Lichess to get started.
            </p>
            <Link
              href="/analysis"
              className="mt-6 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-black font-black text-sm rounded-xl hover:from-teal-400 hover:to-emerald-500 transition"
            >
              Import First Game
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="p-5 bg-[#0d1326] border border-slate-800 rounded-2xl flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-3xl font-black text-white">{value}</span>
      <span className="text-xs text-slate-500">{sub}</span>
    </div>
  );
}

function QuickAction({
  href, icon, title, description, accent,
}: {
  href: string; icon: React.ReactNode; title: string; description: string; accent: "teal" | "blue";
}) {
  const colors = {
    teal: "border-teal-500/20 hover:border-teal-500/50 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400",
    blue: "border-blue-500/20 hover:border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400",
  };
  return (
    <Link
      href={href}
      className={`p-5 border rounded-2xl transition group flex items-start gap-4 ${colors[accent]}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div>
        <h3 className="font-bold text-sm text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
