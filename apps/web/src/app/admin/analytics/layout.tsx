"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, BarChart3, BookOpen, BrainCircuit, 
  Calendar, Download, ActivitySquare, Brain, Target, Users
} from "lucide-react";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Using simple state here; in a real app this might be in the URL params for SSR
  const [dateRange, setDateRange] = useState("30d");

  const navItems = [
    { name: "Overview", href: "/admin/analytics", icon: BarChart3, exact: true },
    { name: "Product", href: "/admin/analytics/product", icon: Activity },
    { name: "Chess Engine", href: "/admin/analytics/engine", icon: BrainCircuit },
    { name: "Player Intel", href: "/admin/analytics/player", icon: Brain },
    { name: "Learning", href: "/admin/analytics/learning", icon: BookOpen },
    { name: "Puzzles", href: "/admin/analytics/puzzles", icon: ActivitySquare },
    { name: "Training", href: "/admin/analytics/training", icon: Target },
    { name: "Retention", href: "/admin/analytics/retention", icon: Users },
    { name: "Live Monitor", href: "/admin/analytics/live", icon: Activity },
  ];

  const exportData = (format: "csv" | "json") => {
    // Basic export stub. Real implementation would fetch from API and trigger download
    alert(`Exporting current dashboard data as ${format.toUpperCase()}...`);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        {/* Top bar for Date Filtering and Export */}
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-slate-300">
            <Calendar className="h-4 w-4" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-sm rounded-md px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => exportData("csv")}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportData("json")}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>JSON</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Container */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* We pass dateRange down to children using React Context or cloneElement in a real app,
              but for Server Components, date ranges are best passed via URL searchParams.
              Since we are stubbing state for speed, children will rely on their own data fetching. */}
          {children}
        </main>
      </div>
    </div>
  );
}
