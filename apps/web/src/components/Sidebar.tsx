"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  History,
  Award,
  BookOpen,
  Settings,
  Compass,
} from "lucide-react";

const NAV_ITEMS = [
  {
    section: null,
    items: [
      { href: "/analysis", icon: History, label: "Game Reviewer" },
      { href: "/profile", icon: Award, label: "Player Analytics" },
    ],
  },
  {
    section: "Learn",
    items: [
      { href: "/learn/openings", icon: Compass, label: "Openings" },
      { href: "/learn/lessons", icon: BookOpen, label: "Lessons" },
    ],
  },
];

export function Sidebar({ estimatedElo, gamesPlayed }: { estimatedElo?: number; gamesPlayed?: number }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/analysis"
      ? pathname === "/analysis" || pathname.startsWith("/analysis/")
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-[#0d1326] flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
        <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
          <Brain className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-lg">ChessInsight</h1>
          <span className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Pro v2.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
        {NAV_ITEMS.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 mb-2">
                {group.section}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(href)
                      ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-300 border-l-4 border-teal-500 font-medium"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ELO Badge */}
      {estimatedElo !== undefined && (
        <div className="p-4 m-4 rounded-2xl bg-slate-900/60 border border-teal-500/20 text-center">
          <span className="text-xs text-teal-400 font-bold uppercase tracking-widest">Estimated ELO</span>
          <div className="text-3xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            {estimatedElo}
          </div>
          <div className="text-xs text-slate-400 mt-1">Games analyzed: {gamesPlayed ?? 0}</div>
        </div>
      )}

      {/* Settings link */}
      <div className="px-4 pb-4">
        <Link
          href="/settings"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            pathname === "/settings"
              ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-300 border-l-4 border-teal-500 font-medium"
              : "text-slate-500 hover:bg-slate-800/40 hover:text-white"
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="text-sm">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
