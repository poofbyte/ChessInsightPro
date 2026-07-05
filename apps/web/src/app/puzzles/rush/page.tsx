"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound } from "../../store";
import { getRandomPuzzle, LocalPuzzle } from "../../../lib/puzzle-db";
import { Zap, Timer, X, CheckCircle, Trophy } from "lucide-react";

const DURATION = 180; // 3 minutes
const MAX_STRIKES = 3;

export default function PuzzleRushPage() {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [puzzle, setPuzzle] = useState<LocalPuzzle | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPuzzle = useCallback(() => {
    const p = getRandomPuzzle();
    setPuzzle(p);
    setChess(new Chess(p.fen));
  }, []);

  const startGame = () => {
    setScore(0);
    setStrikes(0);
    setTimeLeft(DURATION);
    setSolved([]);
    setPhase("playing");
    loadPuzzle();
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const endGame = useCallback(() => {
    setPhase("done");
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (strikes >= MAX_STRIKES && phase === "playing") endGame();
  }, [strikes, phase, endGame]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleMove = (from: string, to: string) => {
    if (!puzzle || !chess || phase !== "playing") return false;
    const expected = puzzle.solution[0];
    const move = `${from}${to}`;

    if (move === expected || move + "q" === expected) {
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return false;
      playMoveSound(result.san);
      setFlash("correct");
      setScore((s) => s + 1);
      setSolved((prev) => [...prev, puzzle.id]);
      setTimeout(() => { setFlash(null); loadPuzzle(); }, 500);
      return true;
    } else {
      setFlash("wrong");
      setStrikes((s) => s + 1);
      const audio = new Audio("/sounds/illegal-move.webm");
      audio.volume = 0.6;
      audio.play().catch(() => {});
      setTimeout(() => setFlash(null), 600);
      return false;
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0f1d]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-orange-500/15 border border-orange-500/20">
            <Zap className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Puzzle Rush</h1>
            <p className="text-slate-400 text-sm">Solve as many puzzles as you can in 3 minutes. 3 strikes and you're out!</p>
          </div>
        </div>

        {phase === "idle" && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <div className="p-6 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Zap className="w-16 h-16 text-orange-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2">Ready to Rush?</h2>
              <p className="text-slate-400 max-w-sm mx-auto">3 minutes. 3 strikes. Score as high as you can.</p>
            </div>
            <button onClick={startGame} className="px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-lg rounded-2xl hover:from-orange-400 hover:to-amber-400 transition shadow-lg shadow-orange-500/20">
              Start Rush!
            </button>
          </div>
        )}

        {phase === "playing" && puzzle && chess && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-7">
              <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-colors ${flash === "correct" ? "border-emerald-500" : flash === "wrong" ? "border-rose-500" : "border-slate-800"}`}>
                <BoardView fen={chess.fen()} onPieceDrop={handleMove} />
              </div>
            </div>
            <div className="col-span-5 flex flex-col gap-4">
              {/* Timer */}
              <div className="p-5 bg-[#0d1326] border border-slate-800 rounded-2xl text-center">
                <div className={`text-5xl font-black tabular-nums ${timeLeft <= 30 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                  {mins}:{secs.toString().padStart(2, "0")}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Timer className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-500 text-xs">Time remaining</span>
                </div>
              </div>
              {/* Score */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-xl text-center">
                  <div className="text-3xl font-black text-emerald-400">{score}</div>
                  <div className="text-xs text-slate-500 mt-1">Solved</div>
                </div>
                <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-1 text-rose-400">
                    {Array.from({ length: MAX_STRIKES }).map((_, i) => (
                      <X key={i} className={`w-6 h-6 ${i < strikes ? "opacity-100" : "opacity-20"}`} />
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Strikes</div>
                </div>
              </div>
              {/* Theme badge */}
              <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-xl">
                <span className="text-xs font-black uppercase tracking-widest text-orange-400">Theme</span>
                <p className="font-bold text-white mt-1">{puzzle.theme}</p>
                <p className="text-xs text-slate-400 mt-1">{puzzle.hint}</p>
              </div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <Trophy className="w-16 h-16 text-yellow-400" />
            <div>
              <h2 className="text-4xl font-black mb-2">Rush Complete!</h2>
              <p className="text-slate-400">You solved <span className="text-white font-black text-2xl">{score}</span> puzzles</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-400">{score}</div>
                <div className="text-xs text-slate-500">Solved</div>
              </div>
              <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-xl text-center">
                <div className="text-2xl font-black text-rose-400">{strikes}</div>
                <div className="text-xs text-slate-500">Strikes</div>
              </div>
            </div>
            <button onClick={startGame} className="px-8 py-3 bg-orange-500 text-black font-black rounded-xl hover:bg-orange-400 transition">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
