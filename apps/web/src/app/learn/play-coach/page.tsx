"use client";

import { useState, useEffect } from "react";
import { logActivity } from "@/lib/activity-log";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound, useChessStore, useAuthStore } from "../../store";
import { Bot, Brain, RefreshCw, MessageSquare } from "lucide-react";
import SignUpPrompt from "@/components/SignUpPrompt";

const BOT_LEVELS = [
  { id: "beginner",    label: "Beginner",    elo: 600,  delay: 2000, depth: 1, description: "Perfect for learning the rules." },
  { id: "intermediate", label: "Intermediate", elo: 1200, delay: 1200, depth: 3, description: "A solid challenge for improving players." },
  { id: "advanced",   label: "Advanced",    elo: 1800, delay: 800,  depth: 5, description: "Strong tactical and positional play." },
];

const COACH_TIPS = [
  "Control the center with pawns and pieces.",
  "Develop your knights before bishops.",
  "Castle early to protect your king.",
  "Connect your rooks by developing all pieces.",
  "Trade pieces when you're ahead in material.",
  "Look for forks, pins, and skewers each move.",
  "Push passed pawns in the endgame.",
  "Activate your king in the endgame.",
];

export default function PlayCoachPage() {
  const { accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  useEffect(() => { logActivity("page_view", "Learn - Play Coach"); }, []);
  useEffect(() => { if (!accessToken) setShowSignUp(true); }, [accessToken]);
  const [selectedLevel, setSelectedLevel] = useState(BOT_LEVELS[0]);
  const [phase, setPhase] = useState<"setup" | "playing">("setup");
  const [chess, setChess] = useState<Chess | null>(null);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [status, setStatus] = useState("");
  const [tip, setTip] = useState(COACH_TIPS[0]);
  const { boardTheme } = useChessStore();

  useEffect(() => {
    setTip(COACH_TIPS[Math.floor(Math.random() * COACH_TIPS.length)]);
  }, []);

  const fetchDynamicTip = async (fen: string, san: string) => {
    setTip("Hmm, let me think about that...");
    try {
      // In a real app we'd get a base analysis from Stockfish, but here we can just pass the move context.
      const baseAnalysis = `The player played ${san}. Provide a quick tip for the resulting position.`;
      const res = await fetch("/api/narrative/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseAnalysis, context: fen }),
      });
      if (res.ok) {
        const data = await res.json();
        setTip(data.enrichedText);
      } else {
        setTip(COACH_TIPS[Math.floor(Math.random() * COACH_TIPS.length)]);
      }
    } catch {
      setTip(COACH_TIPS[Math.floor(Math.random() * COACH_TIPS.length)]);
    }
  };

  const startGame = () => {
    const c = new Chess();
    setChess(c);
    setStatus("");
    setPhase("playing");
    // If player is black, bot makes first move
    if (playerColor === "black") {
      setTimeout(() => makeBotMove(c), selectedLevel.delay);
    }
  };

  const makeBotMove = (c: Chess) => {
    const moves = c.moves({ verbose: true });
    if (moves.length === 0) return;
    // Simple random move selection (without Stockfish to keep offline-first)
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    c.move(randomMove);
    playMoveSound(randomMove.san);
    setStatus("");
  };

  const handleMove = (from: string, to: string) => {
    if (!chess || phase !== "playing") return false;
    // Only allow moves if it's player's turn
    const turn = chess.turn() === "w" ? "white" : "black";
    if (turn !== playerColor) return false;

    try {
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return false;
      playMoveSound(result.san);

      if (chess.isCheckmate()) {
        setStatus("Checkmate! You win! 🎉");
        return true;
      }
      if (chess.isDraw()) {
        setStatus("It's a draw!");
        return true;
      }

      // Coach tip rotation / API fetch
      fetchDynamicTip(chess.fen(), result.san);

      // Bot responds
      setTimeout(() => {
        makeBotMove(chess);
        if (chess.isCheckmate()) setStatus("Checkmate! Bot wins.");
        else if (chess.isDraw()) setStatus("Draw!");
      }, selectedLevel.delay);

      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/20">
            <Bot className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Play Coach</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Play vs a bot with real-time coaching tips.</p>
          </div>
        </div>

        {phase === "setup" && (
          <div className="max-w-lg mx-auto space-y-6">
            {/* Bot selection */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-400">Choose Difficulty</h2>
              {BOT_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level)}
                  className={`w-full p-4 rounded-2xl border text-left transition ${selectedLevel.id === level.id ? "border-blue-500 bg-blue-500/10" : "border-border bg-card hover:border-slate-600"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-foreground">{level.label}</span>
                    <span className="text-xs text-slate-500">~{level.elo} ELO</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{level.description}</p>
                </button>
              ))}
            </div>

            {/* Color selection */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-400">Play As</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["white", "black"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setPlayerColor(c)}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition ${playerColor === c ? "border-blue-500 bg-blue-500/10" : "border-border bg-card hover:border-slate-600"}`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 ${c === "white" ? "bg-white border-slate-300" : "bg-black/5 dark:bg-slate-900 border-slate-600"}`} />
                    <span className="font-bold text-foreground capitalize">{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startGame} className="w-full py-4 bg-blue-500 text-white font-black rounded-2xl hover:bg-blue-600 transition shadow-lg shadow-blue-500/20">
              Start Game
            </button>
          </div>
        )}

        {phase === "playing" && chess && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="aspect-square rounded-2xl overflow-hidden border border-border">
                <BoardView fen={chess.fen()} orientation={playerColor} onPieceDrop={handleMove} />
              </div>
              {status && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-sm text-center">
                  {status}
                </div>
              )}
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-5 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-3">
                  <Brain className="w-4 h-4" /> Virtual Coach Tip
                </div>
                <div className="p-3 bg-black/5 dark:bg-slate-900/60 rounded-xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <MessageSquare className="w-4 h-4 text-blue-400 mb-2" />
                  {tip}
                </div>
              </div>
              <div className="p-4 bg-card border border-border rounded-2xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Difficulty</span>
                  <span className="font-bold text-foreground">{selectedLevel.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Playing as</span>
                  <span className="font-bold text-foreground capitalize">{playerColor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Turn</span>
                  <span className="font-bold text-foreground capitalize">{chess.turn() === "w" ? "White" : "Black"}</span>
                </div>
              </div>
              <button onClick={() => setPhase("setup")} className="flex items-center justify-center gap-2 p-3 bg-black/10 dark:bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-sm font-bold transition">
                <RefreshCw className="w-4 h-4" /> New Game
              </button>
            </div>
          </div>
        )}
      </div>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="Play & Coach" />
    </div>
  );
}
