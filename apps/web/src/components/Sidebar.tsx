"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain, History, Award, BookOpen, Settings,
  Puzzle, Zap, Swords, Grid3X3,
  GraduationCap, Bot, Map, AlignLeft, ScrollText, Target,
  BarChart2, Trophy, Dumbbell, Sun, Moon
} from "lucide-react";
import { useChessStore } from "../app/store";

const NAV_SECTIONS = [
  {
    section: null,
    items: [
      { href: "/", icon: History, label: "Game Reviewer" },
      { href: "/profile",  icon: Award,   label: "Player Analytics" },
    ],
  },
  {
    section: "Puzzles",
    items: [
      { href: "/puzzles/daily",   icon: Puzzle,   label: "Daily Puzzle" },
      { href: "/puzzles/rush",    icon: Zap,      label: "Puzzle Rush" },
      { href: "/puzzles/battle",  icon: Swords,   label: "Puzzle Battle" },
      { href: "/puzzles/custom",  icon: Grid3X3,  label: "Custom Puzzles" },
    ],
  },
  {
    section: "Learn",
    items: [
      { href: "/learn/lessons",     icon: GraduationCap, label: "Lessons" },
      { href: "/learn/play-coach",  icon: Bot,           label: "Play Coach" },
      { href: "/learn/openings",    icon: Map,           label: "Openings" },
      { href: "/learn/terms",       icon: AlignLeft,     label: "Chess Terms" },
      { href: "/learn/rules",       icon: ScrollText,    label: "Rules" },
      { href: "/learn/coordinates", icon: Target,        label: "Coordinates" },
    ],
  },
  {
    section: "Train",
    items: [
      { href: "/train/sandbox",   icon: BarChart2, label: "Analysis" },
      { href: "/train/endgames",  icon: Trophy,    label: "Endgames" },
      { href: "/train/practice",  icon: Dumbbell,  label: "Practice" },
    ],
  },
];

export function Sidebar({ estimatedElo, gamesPlayed }: { estimatedElo?: number; gamesPlayed?: number }) {
  const pathname = usePathname();
  const { theme, setTheme } = useChessStore();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-background flex flex-col h-full">
      {/* Logo */}
      <Link href="/" className="p-5 flex items-center gap-3 border-b border-border hover:bg-black/5 dark:hover:bg-black/10 dark:bg-slate-800/20 transition">
        <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
          <Brain className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-base leading-tight">ChessInsight</h1>
          <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">Pro v2.0</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV_SECTIONS.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 mb-1.5">
                {group.section}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                    isActive(href)
                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-l-[3px] border-teal-500 pl-[9px] font-semibold"
                      : "text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-black/10 dark:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-900 dark:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ELO Badge */}
      {estimatedElo !== undefined && (
        <div className="mx-3 mb-2 p-3 rounded-2xl bg-black/5 dark:bg-black/5 dark:bg-slate-900/60 border border-teal-500/20 text-center">
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest">Est. ELO</span>
          <div className="text-2xl font-black mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
            {estimatedElo}
          </div>
          <div className="text-[10px] text-slate-500">{gamesPlayed ?? 0} games</div>
        </div>
      )}

      <div className="px-3 pb-4 flex items-center gap-2">
        <Link
          href="/pricing"
          className={`flex items-center justify-center p-2.5 rounded-xl transition-all ${
            pathname === "/pricing"
              ? "bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/50"
              : "text-slate-500 hover:bg-black/5 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
          title="Upgrade to Pro"
        >
          <Zap className="w-4 h-4" />
        </Link>
        <Link
          href="/settings"
          className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm ${
            pathname === "/settings"
              ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-l-[3px] border-teal-500 pl-[9px] font-semibold"
              : "text-slate-500 hover:bg-black/5 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-black/5 dark:hover:bg-black/10 dark:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-900 dark:text-slate-200 transition-all"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
