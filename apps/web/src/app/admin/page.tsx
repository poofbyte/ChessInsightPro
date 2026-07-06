"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { Users, CreditCard, Gamepad2, Puzzle, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data.stats);
        setLoading(false);
      });
  }, [accessToken]);

  if (loading || !stats) {
    return <div className="p-8 text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Overview of ChessInsight Pro metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="p-6 bg-gradient-to-br from-teal-500/20 to-emerald-500/5 border border-teal-500/30 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-500/20 rounded-lg"><TrendingUp className="w-5 h-5 text-teal-500" /></div>
            <p className="font-bold text-sm text-teal-600 dark:text-teal-400 uppercase tracking-widest">Est. MRR</p>
          </div>
          <p className="text-3xl font-black text-foreground">{stats.estimatedMrr} <span className="text-sm text-slate-500">BDT</span></p>
        </div>

        {/* Users */}
        <div className="p-6 bg-card border border-border rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-5 h-5 text-blue-500" /></div>
            <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">Total Users</p>
          </div>
          <p className="text-3xl font-black text-foreground">{stats.totalUsers}</p>
        </div>

        {/* Games Analyzed */}
        <div className="p-6 bg-card border border-border rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg"><Gamepad2 className="w-5 h-5 text-purple-500" /></div>
            <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">Games Analyzed</p>
          </div>
          <p className="text-3xl font-black text-foreground">{stats.totalGames}</p>
        </div>

        {/* Puzzles */}
        <div className="p-6 bg-card border border-border rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg"><Puzzle className="w-5 h-5 text-orange-500" /></div>
            <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">Total Puzzles</p>
          </div>
          <p className="text-3xl font-black text-foreground">{stats.totalPuzzles}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Paid Subscriptions</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">Pro (Tier 1)</span>
              <span className="text-xl font-black text-teal-500">{stats.tier1}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">Elite (Tier 2)</span>
              <span className="text-xl font-black text-teal-500">{stats.tier2}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Puzzle Pool Health</h2>
          <div className="space-y-4">
            <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Total Generated Puzzles</p>
              <p className="text-2xl font-black">{stats.totalPuzzles}</p>
            </div>
            <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Avg. Times Served</p>
              <p className="text-2xl font-black">{stats.avgPuzzleServed}</p>
              <p className="text-xs text-slate-500 mt-1">
                {Number(stats.avgPuzzleServed) < 5 ? "Pool is fresh" : "Consider running mining soon"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
