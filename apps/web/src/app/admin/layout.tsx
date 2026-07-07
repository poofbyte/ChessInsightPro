"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/app/store";
import { LayoutDashboard, Users, CreditCard, Puzzle, Settings, FileText, DollarSign, ArrowLeft, ReceiptText, BookOpenText, ClipboardList } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, user, clearAuth } = useAuthStore();

  // Guard: wait 200ms for Zustand to rehydrate from localStorage, then redirect if not admin
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!accessToken || !user) {
        sessionStorage.setItem("loginMessage", "Please log in to access the admin panel.");
        router.replace("/login");
        return;
      }
      if (user.role !== "ADMIN") {
        // Stale token - clear auth and redirect to re-login
        clearAuth();
        router.replace("/login?message=Your+session+has+expired.+Please+log+in+again.");
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [accessToken, user, router, clearAuth]);

  const links = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { href: "/admin/upgrade-requests", label: "Billing Queue", icon: <CreditCard className="w-5 h-5" /> },
    { href: "/admin/puzzles", label: "Puzzles", icon: <Puzzle className="w-5 h-5" /> },
    { href: "/admin/billing", label: "Billing", icon: <ReceiptText className="w-5 h-5" /> },
    { href: "/admin/activity-logs", label: "Activity Logs", icon: <ClipboardList className="w-5 h-5" /> },
    { href: "/admin/content", label: "Content", icon: <BookOpenText className="w-5 h-5" /> },
    { href: "/admin/audit-log", label: "Audit Log", icon: <FileText className="w-5 h-5" /> },
  ];

  // Show nothing while checking auth
  if (!accessToken || !user || user.role !== "ADMIN") {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-semibold">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-black text-teal-500">Admin Panel</h2>
          <p className="text-xs text-slate-500 mt-1">Logged in as {user.email}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
                  isActive 
                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/20" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-slate-800 hover:text-foreground"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold rounded-xl hover:bg-black/5 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" /> Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
