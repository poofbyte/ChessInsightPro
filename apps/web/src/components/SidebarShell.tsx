"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { db } from "../app/db";

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [estimatedElo, setEstimatedElo] = useState<number | undefined>(undefined);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);

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
    <div className="flex h-screen overflow-hidden">
      <Sidebar estimatedElo={estimatedElo} gamesPlayed={gamesPlayed} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
