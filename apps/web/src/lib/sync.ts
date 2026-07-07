import { db } from "../app/db";

export async function syncDataWithServer(token: string) {
  try {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    // 1. Sync Games
    const localGames = await db.games.toArray();
    if (localGames.length > 0) {
      await fetch("/api/games", { method: "POST", headers, body: JSON.stringify(localGames) });
    }
    const serverGamesRes = await fetch("/api/games", { headers });
    if (serverGamesRes.ok) {
      const { games } = await serverGamesRes.json();
      for (const g of games) {
        await db.games.put(g);
      }
    }

    // 2. Sync Profile
    const localProfile = await db.profiles.toCollection().first();
    if (localProfile) {
      const { elo, estimatedElo, ...profilePayload } = localProfile as any;
      await fetch("/api/profile", { method: "PUT", headers, body: JSON.stringify(profilePayload) });
    }
    const serverProfileRes = await fetch("/api/profile", { headers });
    if (serverProfileRes.ok) {
      const { profile } = await serverProfileRes.json();
      if (profile) await db.profiles.put({ userId: "local", ...profile }); // Merge to local profile
    }

    // 3. Sync Learning Cards
    const localCards = await db.learning.toArray();
    if (localCards.length > 0) {
      await fetch("/api/learning-cards", { method: "PUT", headers, body: JSON.stringify(localCards) });
    }
    const serverCardsRes = await fetch("/api/learning-cards", { headers });
    if (serverCardsRes.ok) {
      const { cards } = await serverCardsRes.json();
      for (const c of cards) {
        await db.learning.put(c);
      }
    }

    // 4. Sync Puzzle History
    // (Puzzle attempts could be read from localStorage as per old behavior, but I'll assume they are stored/synced if any)
    const storedPuzzles = localStorage.getItem('chess-insight-puzzle-history');
    if (storedPuzzles) {
      try {
        const attempts = JSON.parse(storedPuzzles);
        if (attempts.length > 0) {
          await fetch("/api/puzzle-attempts", { method: "POST", headers, body: JSON.stringify(attempts) });
        }
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.error("Sync failed:", error);
    return false;
  }
}
