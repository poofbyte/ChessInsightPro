"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { db } from "../app/db";
import { Menu } from "lucide-react";

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [estimatedElo, setEstimatedElo] = useState<number | undefined>(undefined);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await db.profiles.get("default-user");
        if (profile) {
          setEstimatedElo(profile.estimatedElo);
          setGamesPlayed(profile.gamesPlayed);
        }
      } catch {
        // DB may not be ready on first render — silently skip
      }
    };
    loadProfile();

    if (typeof window !== "undefined") {
      window.addEventListener("profile-updated", loadProfile);
      return () => window.removeEventListener("profile-updated", loadProfile);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        estimatedElo={estimatedElo} 
        gamesPlayed={gamesPlayed} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-teal-500">ChessInsight</span> Pro
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-3 -mr-2 text-slate-600 dark:text-slate-400 hover:text-foreground transition-colors"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto relative outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
