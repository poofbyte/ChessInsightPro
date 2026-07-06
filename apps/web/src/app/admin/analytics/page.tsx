import React from "react";
import { TursoIntelligenceRepository } from "@/lib/intelligence-repo";
import { dbClient, ensureDbReady } from "@/lib/db";
import { OverviewCharts } from "./overview-charts";

// Revalidate this page every 5 minutes (ISR)
export const revalidate = 300; 

export default async function OverviewDashboard() {
  await ensureDbReady();
  const repo = new TursoIntelligenceRepository(dbClient);
  
  // Hardcode range to last 30 days for Server Component initial render
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  
  const metrics = await repo.getOverviewMetrics({ startDate: start, endDate: end });

  // Generate some mock chart data for the sparklines since we don't have historical daily active users yet
  const trendData = Array.from({ length: 30 }).map((_, i) => ({
    date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    users: Math.floor(Math.random() * 50) + 10,
    sessions: Math.floor(Math.random() * 100) + 20,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">High-level metrics across the ChessInsight platform.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Total Users</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{metrics.totalUsers.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Active (24h)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-400">{metrics.activeUsers24h.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Total Sessions</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{metrics.totalSessions.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Events Processed</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">{metrics.totalEvents.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-semibold text-white mb-4">Growth Trends (30 Days)</h3>
        <div className="h-72 w-full">
          <OverviewCharts data={trendData} />
        </div>
      </div>
    </div>
  );
}
