import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { getConfig } from "@core/config";

export async function GET() {
  try {
    await ensureDbReady();
    const settingsContent = await getConfig(dbClient, "settings_content", {
      subtitle: "Configure engine, board appearance, and coach preferences.",
      engineDesc: "Choose which Stockfish engine version to use for position analysis. Stockfish 18 is stronger and recommended.",
      legalDesc: "Legal agreements and policies.",
      contactDesc: "Have a question, bug report, or feature request? Send us a message.",
      aboutDesc: "ChessInsight Pro is an all-in-one chess improvement platform designed to help players analyze games, study openings, solve puzzles, train tactical vision, and improve consistently. Powered by Stockfish 18 and built with an offline-first architecture, it delivers fast, private, and professional chess analysis directly in your browser.",
    });
    
    return NextResponse.json(settingsContent);
  } catch (error) {
    console.error("Settings content fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
