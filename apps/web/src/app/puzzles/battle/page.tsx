"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound } from "../../store";
import { getRandomPuzzle, LocalPuzzle } from "../../../lib/puzzle-db";
import { Swords, Shield, Trophy, Zap } from "lucide-react";

const BATTLE_DURATION = 180;

export default function PuzzleBattlePage() {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [puzzle, setPuzzle] = useState<LocalPuzzle | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [botRating, setBotRating] = useState(1200);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPuzzle = useCallback(() => {
    const p = getRandomPuzzle();
    setPuzzle(p);
    setChess(new Chess(p.fen));
  }, []);

  // Bot solve speed based on rating (ms per puzzle)
  const botSolveMs = Math.max(4000, 12000 - (botRating - 800) * 3);

  const startGame = () => {
    setUserScore(0);
    setBotScore(0);
    setTimeLeft(BATTLE_DURATION);
    setPhase("playing");
    loadPuzzle();

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);

    // Bot solving loop
    botIntervalRef.current = setInterval(() => {
      setBotScore((s) => s + 1);
    }, botSolveMs);
  };

  const endGame = useCallback(() => {
    setPhase("done");
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
  }, []);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
  }, []);

  const handleMove = (from: string, to: string) => {
    if (!puzzle || !chess || phase !== "playing") return false;
    const expected = puzzle.solution[0];
    const move = `${from}${to}`;

    if (move === expected || move + "q" === expected) {
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return false;
      playMoveSound(result.san);
      setFlash("correct");
      setUserScore((s) => s + 1);
      setTimeout(() => { setFlash(null); loadPuzzle(); }, 500);
      return true;
    } else {
      setFlash("wrong");
      const audio = new Audio("/sounds/illegal-move.webm");
      audio.volume = 0.6;
      audio.play().catch(() => {});
      setTimeout(() => setFlash(null), 600);
      return false;
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const userWins = userScore > botScore;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0f1d]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/20">
            <Swords className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Puzzle Battle</h1>
            <p className="text-slate-400 text-sm">Race against a bot to solve the most puzzles in 3 minutes.</p>
          </div>
        </div>

        {phase === "idle" && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
            <div className="flex items-center gap-8">
              <div className="text-center space-y-2">
                <Shield className="w-12 h-12 text-teal-400 mx-auto" />
                <span className="text-sm text-slate-300 font-bold">You</span>
              </div>
              <Swords className="w-8 h-8 text-slate-500" />
              <div className="text-center space-y-2">
                <Shield className="w-12 h-12 text-rose-400 mx-auto" />
                <span className="text-sm text-slate-300 font-bold">Bot</span>
              </div>
            </div>
            <div className="space-y-3 w-full max-w-sm">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bot Rating: {botRating}</label>
              <input
                type="range" min={800} max={2500} step={100}
                value={botRating}
                onChange={(e) => setBotRating(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Beginner (800)</span>
                <span>Magnus (2500)</span>
              </div>
            </div>
            <button onClick={startGame} className="px-10 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-lg rounded-2xl hover:from-red-400 transition shadow-lg shadow-red-500/20">
              Start Battle!
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
              <div className="text-center p-4 bg-[#0d1326] border border-slate-800 rounded-2xl">
                <div className={`text-4xl font-black tabular-nums ${timeLeft <= 30 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                  {mins}:{secs.toString().padStart(2, "0")}
                </div>
              </div>
              {/* Score race */}
              <div className="p-5 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-4">
                <ScoreBar label="You" score={userScore} color="teal" />
                <div className="text-center text-xs text-slate-500 font-bold">vs</div>
                <ScoreBar label={`Bot (${botRating})`} score={botScore} color="rose" />
              </div>
              <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-xl">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Puzzle</p>
                <p className="font-bold text-white mt-1">{puzzle.theme}</p>
                <p className="text-xs text-slate-500 mt-0.5">{puzzle.hint}</p>
              </div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <Trophy className={`w-16 h-16 ${userWins ? "text-yellow-400" : "text-slate-500"}`} />
            <div>
              <h2 className="text-4xl font-black mb-2">{userWins ? "You Win! 🏆" : userScore === botScore ? "It's a Draw!" : "Bot Wins!"}</h2>
              <p className="text-slate-400">Final score: <strong className="text-teal-400">{userScore}</strong> vs <strong className="text-rose-400">{botScore}</strong></p>
            </div>
            <button onClick={() => setPhase("idle")} className="px-8 py-3 bg-red-500 text-white font-black rounded-xl hover:bg-red-400 transition">
              Battle Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: "teal" | "rose" }) {
  const colorClass = color === "teal" ? "text-teal-400" : "text-rose-400";
  const barClass = color === "teal" ? "bg-teal-500" : "bg-rose-500";
  const maxWidth = Math.min(score * 5, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-sm font-bold ${colorClass}`}>{label}</span>
        <span className={`text-2xl font-black ${colorClass}`}>{score}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barClass} transition-all duration-500`} style={{ width: `${maxWidth}%` }} />
      </div>
    </div>
  );
}
