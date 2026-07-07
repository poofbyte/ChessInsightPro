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
      aboutDesc: "All analysis runs locally in your browser. No account or internet required for core features."
    });
    
    return NextResponse.json(settingsContent);
  } catch (error) {
    console.error("Settings content fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
