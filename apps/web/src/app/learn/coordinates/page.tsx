"use client";

import { useState, useCallback, useEffect } from "react";
import { logActivity } from "@/lib/activity-log";
import { Target, Trophy, Timer, RotateCcw } from "lucide-react";
import { useChessStore, BOARD_THEMES, useAuthStore } from "../../store";
import { BoardView } from "../../../components/BoardView";
import SignUpPrompt from "@/components/SignUpPrompt";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const getRandomSquare = () => `${FILES[Math.floor(Math.random() * 8)]}${RANKS[Math.floor(Math.random() * 8)]}`;

type Mode = "find-square" | "name-square";
type Phase = "idle" | "playing" | "done";

export default function CoordinatesPage() {
  const { accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  useEffect(() => { logActivity("page_view", "Learn - Coordinates"); }, []);
  useEffect(() => { if (!accessToken) setShowSignUp(true); }, [accessToken]);
  const { boardTheme, boardOrientation } = useChessStore();
  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.classicLight;

  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<Mode>("find-square");
  const [target, setTarget] = useState("");
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [showCoords, setShowCoords] = useState(false);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setPhase("done"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const startGame = () => {
    setScore(0);
    setErrors(0);
    setTimeLeft(30);
    setTarget(getRandomSquare());
    setPhase("playing");
  };

  const handleSquareClick = useCallback((square: string) => {
    if (phase !== "playing" || mode !== "find-square") return;
    if (square === target) {
      setFlash("correct");
      setScore((s) => s + 1);
      setTarget(getRandomSquare());
      setTimeout(() => setFlash(null), 300);
      const audio = new Audio("/sounds/move.webm");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } else {
      setFlash("wrong");
      setErrors((e) => e + 1);
      setTimeout(() => setFlash(null), 300);
    }
  }, [phase, mode, target]);

  const accuracy = score + errors > 0 ? Math.round((score / (score + errors)) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/20">
            <Target className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Coordinate Trainer</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Click the correct square as fast as possible. 30 seconds per round.</p>
          </div>
        </div>

        {phase === "idle" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-8">
            <div className="space-y-3 w-full max-w-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-rose-400">Game Mode</h2>
              {(["find-square", "name-square"] as Mode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`w-full p-4 rounded-2xl border text-left transition ${mode === m ? "border-rose-500 bg-rose-500/10" : "border-border bg-card hover:border-slate-600"}`}>
                  <span className="font-bold text-foreground">{m === "find-square" ? "Find the Square" : "Name the Square"}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{m === "find-square" ? "A square name is shown — click it on the board." : "A highlighted square appears — type its name."}</p>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-600 dark:text-slate-400 font-bold">Show Coordinates</label>
              <button onClick={() => setShowCoords((c) => !c)} className={`w-10 h-6 rounded-full transition-colors ${showCoords ? "bg-teal-500" : "bg-slate-700"}`}>
                <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${showCoords ? "translate-x-4" : ""}`} />
              </button>
            </div>
            <button onClick={startGame} className="px-10 py-4 bg-teal-500 text-white font-black text-lg rounded-2xl hover:bg-teal-600 transition shadow-lg shadow-teal-500/20">
              Start Training!
            </button>
          </div>
        )}

        {phase === "playing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-colors ${flash === "correct" ? "border-emerald-500" : flash === "wrong" ? "border-rose-500" : "border-border"}`}>
                <BoardView
                  fen="start"
                  arePiecesDraggable={false}
                  onSquareClick={handleSquareClick}
                  orientation={boardOrientation}
                  showBoardNotation={showCoords}
                  customSquareStyles={{
                    [target]: { background: "rgba(20,180,120,0.4)", borderRadius: "4px" },
                  }}
                />
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Target */}
              <div className="p-6 bg-card border border-border rounded-2xl text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Click this square</p>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400 font-mono">{target}</div>
              </div>
              {/* Timer */}
              <div className={`p-5 bg-card border border-border rounded-2xl text-center ${timeLeft <= 10 ? "border-rose-500/50" : ""}`}>
                <div className={`text-4xl font-black tabular-nums ${timeLeft <= 10 ? "text-rose-400 animate-pulse" : "text-foreground"}`}>{timeLeft}s</div>
                <div className="h-1.5 bg-black/10 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all" style={{ width: `${(timeLeft / 30) * 100}%` }} />
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-card border border-border rounded-xl text-center">
                  <div className="text-3xl font-black text-emerald-400">{score}</div>
                  <div className="text-xs text-slate-500">Correct</div>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl text-center">
                  <div className="text-3xl font-black text-rose-400">{errors}</div>
                  <div className="text-xs text-slate-500">Errors</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <Trophy className="w-16 h-16 text-yellow-400" />
            <div>
              <h2 className="text-4xl font-black mb-2">Round Complete!</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">{score} correct in 30 seconds</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-sm">
              <div className="p-4 bg-card border border-border rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-400">{score}</div>
                <div className="text-xs text-slate-500">Correct</div>
              </div>
              <div className="p-4 bg-card border border-border rounded-xl text-center">
                <div className="text-2xl font-black text-rose-400">{errors}</div>
                <div className="text-xs text-slate-500">Errors</div>
              </div>
              <div className="p-4 bg-card border border-border rounded-xl text-center">
                <div className="text-2xl font-black text-foreground">{accuracy}%</div>
                <div className="text-xs text-slate-500">Accuracy</div>
              </div>
            </div>
            <button onClick={startGame} className="flex items-center gap-2 px-8 py-3 bg-rose-500 text-foreground font-black rounded-xl hover:bg-rose-400 transition">
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        )}
      </div>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="coordinate trainer" />
    </div>
  );
}
