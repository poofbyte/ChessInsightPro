"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Puzzle, Settings, FileText, ArrowLeft } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { href: "/admin/upgrade-requests", label: "Billing Queue", icon: <CreditCard className="w-5 h-5" /> },
    { href: "/admin/puzzles", label: "Puzzles", icon: <Puzzle className="w-5 h-5" /> },
    { href: "/admin/config", label: "System Config", icon: <Settings className="w-5 h-5" /> },
    { href: "/admin/audit-log", label: "Audit Log", icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-black text-teal-500">Admin Panel</h2>
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
