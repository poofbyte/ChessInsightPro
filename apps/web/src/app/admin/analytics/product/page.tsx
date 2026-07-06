import React from "react";
import { TursoIntelligenceRepository } from "@/lib/intelligence-repo";
import { dbClient, ensureDbReady } from "@/lib/db";
import { ProductCharts } from "./product-charts";

export const revalidate = 300; 

export default async function ProductDashboard() {
  await ensureDbReady();
  const repo = new TursoIntelligenceRepository(dbClient);
  
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  
  const metrics = await repo.getProductMetrics({ startDate: start, endDate: end });

  // Stub data in case db is completely empty
  const hasData = metrics.pageViews.length > 0;
  
  const pageViews = hasData ? metrics.pageViews : Array.from({ length: 30 }).map((_, i) => ({
    date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 200) + 50,
  }));

  const features = metrics.featureUsage.length > 0 ? metrics.featureUsage : [
    { feature: "pgn-analyzer", count: 1205 },
    { feature: "stockfish-eval", count: 854 },
    { feature: "blunder-trainer", count: 642 },
    { feature: "opening-explorer", count: 430 },
    { feature: "profile-import", count: 210 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Product Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Page views and feature adoption metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page Views Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-white mb-4">Page Views (30 Days)</h3>
          <div className="h-80 w-full">
            <ProductCharts.PageViews data={pageViews} />
          </div>
        </div>

        {/* Feature Usage Bar Chart (1 column) */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-white mb-4">Top Features</h3>
          <div className="h-80 w-full">
            <ProductCharts.FeatureUsage data={features} />
          </div>
        </div>
      </div>
    </div>
  );
}
