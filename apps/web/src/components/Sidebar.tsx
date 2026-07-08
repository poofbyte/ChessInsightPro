"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain, History, Award, BookOpen, Settings,
  Puzzle, Zap, Swords, Grid3X3,
  GraduationCap, Bot, Map, AlignLeft, ScrollText, Target,
  BarChart2, Trophy, Dumbbell, Sun, Moon,
  User, LogIn, UserPlus, CreditCard, Flame,
  LayoutDashboard, Users, FileText, ReceiptText, BookOpenText, ClipboardList, MessageSquare, ArrowLeft
} from "lucide-react";
import { useChessStore } from "../app/store";
import { useAuthStore } from "../app/store";

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
  {
    section: "Account",
    items: [
      { href: "/profile", icon: User, label: "Profile" },
      { href: "/pricing", icon: CreditCard, label: "Pricing & Upgrade" },
      { href: "/login", icon: LogIn, label: "Sign In" },
      { href: "/signup", icon: UserPlus, label: "Sign Up" },
    ],
  },
];

const ADMIN_SECTIONS = [
  {
    section: "Admin Panel",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/upgrade-requests", label: "Billing Queue", icon: CreditCard },
      { href: "/admin/puzzles", label: "Puzzles", icon: Puzzle },
      { href: "/admin/billing", label: "Billing", icon: ReceiptText },
      { href: "/admin/contact-messages", label: "Contact Messages", icon: MessageSquare },
      { href: "/admin/activity-logs", label: "Activity Logs", icon: ClipboardList },
      { href: "/admin/content", label: "Content", icon: BookOpenText },
      { href: "/admin/audit-log", label: "Audit Log", icon: FileText },
    ],
  },
];

export function Sidebar({ estimatedElo, gamesPlayed, isOpen, onClose }: { estimatedElo?: number; gamesPlayed?: number; isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { theme, setTheme } = useChessStore();
  const { accessToken, user } = useAuthStore();
  const [quotas, setQuotas] = useState<any>(null);

  useEffect(() => {
    if (accessToken) {
      fetch("/api/user/quotas", {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setQuotas(data);
      })
      .catch(() => {});
    } else {
      setQuotas(null);
    }
  }, [accessToken]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-60 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shrink-0 border-r border-border bg-background flex flex-col h-full ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
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
        {(pathname.startsWith("/admin") ? ADMIN_SECTIONS : NAV_SECTIONS).map((group, gi) => {
          const visibleItems = group.items.filter(item => {
            if (pathname.startsWith("/admin")) return true;
            if (accessToken) {
              return item.href !== "/login" && item.href !== "/signup";
            } else {
              return item.href !== "/profile"; // Hide profile when logged out
            }
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={gi}>
              {group.section && (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 mb-1.5">
                  {group.section}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map(({ href, icon: Icon, label }) => (
                  <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                    isActive(href)
                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-l-[3px] border-teal-500 pl-[9px] font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </Link>
                ))}
              </div>
            </div>
          );
        })}
        
        
        {!pathname.startsWith("/admin") && user?.role === "ADMIN" && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 mb-1.5">
              Administration
            </p>
            <div className="space-y-0.5">
              <Link
                href="/admin"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                  isActive("/admin")
                    ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-l-[3px] border-teal-500 pl-[9px] font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Admin Panel</span>
              </Link>
            </div>
          </div>
        )}

        {pathname.startsWith("/admin") && (
          <div>
            <div className="space-y-0.5 mt-4 border-t border-border pt-4">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>Back to App</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Profile & Quota Recap */}
      {!pathname.startsWith("/admin") && (estimatedElo !== undefined || quotas) && (
        <div className="mx-3 mb-2 p-3 rounded-2xl bg-black/5 dark:bg-slate-900/60 border border-teal-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest">Est. ELO</span>
              <div className="text-xl font-black mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
                {estimatedElo !== undefined ? estimatedElo : '---'}
              </div>
              <div className="text-[9px] text-slate-500">{gamesPlayed ?? 0} games</div>
            </div>
            
            {quotas && (
              <div className="text-right">
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest flex items-center justify-end gap-1">
                  {quotas.plan === 'FREE' ? 'Free' : quotas.plan} <Flame className="w-3 h-3 text-teal-500" />
                </span>
                <div className="text-xl font-black mt-0.5 text-slate-800 dark:text-white">
                  {quotas.limits.reviews.remaining === 'unlimited' ? '∞' : quotas.limits.reviews.remaining}
                </div>
                <div className="text-[9px] text-slate-500">reviews left</div>
              </div>
            )}
          </div>
          
          {quotas && (
            <>
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex justify-between text-[9px] text-slate-600 dark:text-slate-400 mb-1">
                    <span>Puzzles</span>
                    <span className="font-bold text-foreground">
                      {quotas.limits.puzzles.remaining === 'unlimited' ? '∞' : quotas.limits.puzzles.remaining} left
                    </span>
                  </div>
                  <div className="w-full bg-black/10 dark:bg-slate-800 rounded-full h-1">
                    <div 
                      className="bg-teal-500 h-1 rounded-full" 
                      style={{ width: quotas.limits.puzzles.total === undefined ? '100%' : ((quotas.limits.puzzles.used / quotas.limits.puzzles.total) * 100) + '%' }}
                    ></div>
                  </div>
                </div>
              </div>
              <Link 
                href="/pricing"
                className="block w-full py-1.5 text-center bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-[10px] font-bold rounded-lg transition-colors border border-teal-500/20"
              >
                Upgrade Plan
              </Link>
            </>
          )}
        </div>
      )}

      <div className="px-3 pb-4 flex items-center gap-2">
        {user ? (
          <Link
            href="/profile"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 dark:bg-[#2a2a2a] text-white font-bold text-lg hover:ring-2 hover:ring-teal-500 transition-all shrink-0"
            title="View Profile"
          >
            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </Link>
        ) : (
          <Link
            href="/login"
            className={`flex items-center justify-center p-2.5 rounded-xl transition-all ${
              pathname === "/login"
                ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/50"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title="Sign In"
          >
            <User className="w-4 h-4" />
          </Link>
        )}
        <Link
          href="/settings"
          className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm ${
            pathname === "/settings"
              ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-l-[3px] border-teal-500 pl-[9px] font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </aside>
    </>
  );
}
