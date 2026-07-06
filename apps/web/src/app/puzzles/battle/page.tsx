"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound } from "../../store";
import { db } from "../../db";
import { initializeProfile } from "@chessinsight/player-profile";
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

  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [currentMoveHintLevel, setCurrentMoveHintLevel] = useState(0);
  const [hintText, setHintText] = useState("");
  const [customSquareStyles, setCustomSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [customArrows, setCustomArrows] = useState<any[]>([]);
  const [sessionEloChange, setSessionEloChange] = useState(0);
  const [eloLog, setEloLog] = useState<string[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [mistakesCount, setMistakesCount] = useState(0);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      let prof = await db.profiles.get("default-user");
      if (!prof) {
        prof = initializeProfile("default-user");
        await db.profiles.put(prof);
      }
      setProfile(prof);
    };
    loadProfile();
  }, []);

  const loadPuzzle = useCallback(async () => {
    try {
      const res = await fetch('/api/puzzles/next');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.puzzle) {
          const p = data.puzzle;
          const mapped = {
            id: p.id,
            fen: p.initialFen,
            solution: p.solution,
            rating: p.rating,
            theme: Array.isArray(p.themes) ? p.themes[0] : (p.themes || ""),
            hint: "",
            explanation: ""
          };
          setPuzzle(mapped);
          setChess(new Chess(mapped.fen));
          setTotalHintsUsed(0);
          setCurrentMoveHintLevel(0);
          setHintText("");
          setCustomSquareStyles({});
          setCustomArrows([]);
          setMistakesCount(0);
          return;
        }
      }
    } catch(e) {
      console.error("Failed to fetch puzzle from API, using fallback", e);
    }
    
    // Fallback
    const p = getRandomPuzzle();
    setPuzzle(p);
    setChess(new Chess(p.fen));
    setTotalHintsUsed(0);
    setCurrentMoveHintLevel(0);
    setHintText("");
    setCustomSquareStyles({});
    setCustomArrows([]);
    setMistakesCount(0);
  }, []);

  // Bot solve speed based on rating (ms per puzzle)
  const botSolveMs = Math.max(4000, 12000 - (botRating - 800) * 3);

  const startGame = () => {
    setUserScore(0);
    setBotScore(0);
    setTimeLeft(BATTLE_DURATION);
    setSessionEloChange(0);
    setEloLog([]);
    setPhase("playing");
    setPhase("playing");
    loadPuzzle().then(() => {
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
    });
  };

  const endGame = useCallback(() => {
    setPhase("done");
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
  }, []);

  useEffect(() => {
    if (phase === "done" && sessionEloChange !== 0) {
      const saveProfileElo = async () => {
        let prof = await db.profiles.get("default-user");
        if (!prof) {
          prof = initializeProfile("default-user");
        }
        const currentElo = prof.estimatedElo || 1200;
        const newElo = Math.max(100, currentElo + sessionEloChange);
        const updatedProfile = { ...prof, estimatedElo: newElo };
        await db.profiles.put(updatedProfile);
        setProfile(updatedProfile);
        
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("profile-updated"));
        }
      };
      saveProfileElo();
    }
  }, [phase]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
  }, []);

  const handleRequestHint = () => {
    // Gate by per-puzzle hint level, not cumulative
    if (!puzzle || !chess || currentMoveHintLevel >= 3 || phase !== "playing") return;

    const solution = puzzle.solution;
    const expected = solution[0];
    if (!expected) return;

    const from = expected.slice(0, 2);
    const to = expected.slice(2, 4);
    const piece = chess.get(from as any);
    
    const PIECE_NAMES: Record<string, string> = {
      p: "Pawn", n: "Knight", b: "Bishop",
      r: "Rook", q: "Queen", k: "King",
    };

    const nextLevel = currentMoveHintLevel + 1;
    setCurrentMoveHintLevel(nextLevel);
    setTotalHintsUsed((prev) => prev + 1);

    if (nextLevel === 1) {
      const pieceName = piece?.type ? PIECE_NAMES[piece.type] : "piece";
      setHintText(`💡 Hint 1/3: Try moving your ${pieceName}.`);
      setCustomSquareStyles({});
      setCustomArrows([]);
    } else if (nextLevel === 2) {
      setHintText(`💡 Hint 2/3: The piece is on square ${from.toUpperCase()}.`);
      setCustomSquareStyles({
        [from]: { background: "rgba(251,191,36,0.55)", borderRadius: "4px", boxShadow: "inset 0 0 0 3px rgba(251,191,36,0.9)" },
      });
      setCustomArrows([]);
    } else {
      setHintText(`💡 Hint 3/3: Move from ${from.toUpperCase()} → ${to.toUpperCase()}.`);
      setCustomSquareStyles({
        [from]: { background: "rgba(251,191,36,0.35)", borderRadius: "4px", boxShadow: "inset 0 0 0 3px rgba(251,191,36,0.9)" },
        [to]: { background: "rgba(16,185,129,0.45)", borderRadius: "4px", boxShadow: "inset 0 0 0 3px rgba(16,185,129,0.9)" },
      });
      setCustomArrows([[from, to, "#fbbf24"]]);
    }
  };

  const handleMove = (from: string, to: string) => {
    if (!puzzle || !chess || phase !== "playing") return false;
    const expected = puzzle.solution[0];
    const move = `${from}${to}`;

    if (move === expected || move + "q" === expected) {
      try {
        const result = chess.move({ from, to, promotion: "q" });
        if (!result) return false;
        playMoveSound(result.san);
        setFlash("correct");
        setUserScore((s) => s + 1);
      } catch (e) {
        return false;
      }

      let change = 0;
      if (totalHintsUsed === 0) change = 10;
      else if (totalHintsUsed === 1) change = 2;
      else if (totalHintsUsed === 2) change = 0;
      else change = -5;
      
      setSessionEloChange((s) => s + change);
      setEloLog((prev) => [
        ...prev,
        `✓ Puzzle #${userScore + mistakesCount + 1} Solved (${totalHintsUsed} hints): ${change >= 0 ? "+" : ""}${change} ELO`
      ]);

      setTimeout(() => { setFlash(null); loadPuzzle(); }, 500);
      return true;
    } else {
      setFlash("wrong");
      setMistakesCount((prev) => prev + 1);
      
      setSessionEloChange((s) => s - 10);
      setEloLog((prev) => [
        ...prev,
        `✗ Puzzle #${userScore + mistakesCount + 1} Failed (Mistake): -10 ELO`
      ]);

      const audio = new Audio("/sounds/illegal-move.webm");
      audio.volume = 0.6;
      audio.play().catch(() => {});
      setTimeout(() => { setFlash(null); loadPuzzle(); }, 600);
      return false;
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const userWins = userScore > botScore;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/20">
            <Swords className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Puzzle Battle</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Race against a bot to solve the most puzzles in 3 minutes.</p>
          </div>
        </div>

        {phase === "idle" && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
            <div className="flex items-center gap-8">
              <div className="text-center space-y-2">
                <Shield className="w-12 h-12 text-teal-400 mx-auto" />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">You</span>
              </div>
              <Swords className="w-8 h-8 text-slate-500" />
              <div className="text-center space-y-2">
                <Shield className="w-12 h-12 text-rose-400 mx-auto" />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">Bot</span>
              </div>
            </div>
            <div className="space-y-3 w-full max-w-sm">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Bot Rating: {botRating}</label>
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
            <button onClick={startGame} className="px-10 py-4 bg-blue-500 text-white font-black text-lg rounded-2xl hover:bg-blue-600 transition shadow-lg shadow-blue-500/20">
              Start Battle!
            </button>
          </div>
        )}

        {phase === "playing" && puzzle && chess && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-7">
              <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-colors ${flash === "correct" ? "border-emerald-500" : flash === "wrong" ? "border-rose-500" : "border-border"}`}>
                <BoardView
                  fen={chess.fen()}
                  onPieceDrop={handleMove}
                  customSquareStyles={customSquareStyles}
                  customArrows={customArrows}
                />
              </div>
            </div>
            <div className="col-span-5 flex flex-col gap-4">
              {/* Timer */}
              <div className="text-center p-4 bg-card border border-border rounded-2xl">
                <div className={`text-4xl font-black tabular-nums ${timeLeft <= 30 ? "text-rose-400 animate-pulse" : "text-foreground"}`}>
                  {mins}:{secs.toString().padStart(2, "0")}
                </div>
              </div>
              {/* Score race */}
              <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
                <ScoreBar label="You" score={userScore} color="teal" />
                <div className="text-center text-xs text-slate-500 font-bold">vs</div>
                <ScoreBar label={`Bot (${botRating})`} score={botScore} color="rose" />
              </div>
              <div className="p-4 bg-card border border-border rounded-xl">
                <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Current Puzzle</p>
                <p className="font-bold text-foreground mt-1">{puzzle.theme === "fallback" ? "Mixed Tactical Motif" : (puzzle.theme || "Mixed Tactical Motif")}</p>
                <p className="text-xs text-slate-500 mt-0.5">{puzzle.hint}</p>
              </div>

              {/* Hint Card */}
              <div className="p-5 bg-card border border-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-teal-400">Hints</span>
                  <div className="flex gap-1.5">
                    {[1,2,3].map((i) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-all ${currentMoveHintLevel >= i ? "bg-amber-400" : "bg-slate-700"}`} />
                    ))}
                  </div>
                </div>
                
                {hintText && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    {hintText}
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleRequestHint}
                    disabled={currentMoveHintLevel >= 3}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:shadow-none"
                  >
                    {currentMoveHintLevel >= 3 ? "✓ All hints shown" : `💡 Show Hint ${currentMoveHintLevel + 1} of 3`}
                  </button>
                  
                  <div className="p-3 bg-black/10 dark:bg-slate-950/40 border border-border rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 text-left">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">💡 Rating Rules:</span>
                    <div className="flex justify-between">
                      <span>• Perfect solve (0 hints):</span>
                      <span className="text-emerald-400 font-bold">+10 ELO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 1 Hint used:</span>
                      <span className="text-emerald-500 font-bold">+2 ELO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 2 Hints used:</span>
                      <span className="text-amber-500 font-bold">+0 ELO</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 3 Hints used:</span>
                      <span className="text-rose-400 font-bold">-5 ELO</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1 mt-1 text-[10px] text-slate-500">
                      <span>• Mistake Penalty:</span>
                      <span className="text-rose-500 font-semibold">-10 ELO each</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <Trophy className={`w-16 h-16 ${userWins ? "text-yellow-400 animate-bounce" : "text-slate-500"}`} />
            <div>
              <h2 className="text-4xl font-black mb-2">{userWins ? "You Win! 🏆" : userScore === botScore ? "It's a Draw!" : "Bot Wins!"}</h2>
              <p className="text-slate-600 dark:text-slate-400">Final score: <strong className="text-teal-400">{userScore}</strong> vs <strong className="text-rose-400">{botScore}</strong></p>
            </div>
            
            {/* ELO Summary Log */}
            <div className="w-full max-w-sm p-5 bg-card border border-border rounded-2xl text-left space-y-3">
              <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest text-center">Session ELO Impact</h3>
              <div className="text-center py-2">
                <span className="text-slate-500 text-xs block">Net Rating Change</span>
                <span className={`text-3xl font-black ${sessionEloChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {sessionEloChange >= 0 ? "+" : ""}{sessionEloChange} ELO
                </span>
                {profile && (
                  <span className="text-xs text-slate-500 block mt-1">Current Rating: {profile.estimatedElo || 1200} ELO</span>
                )}
              </div>
              
              {eloLog.length > 0 && (
                <div className="border-t border-border pt-3 mt-1 space-y-1.5 max-h-[160px] overflow-y-auto font-mono text-[11px] text-slate-455">
                  {eloLog.map((log, idx) => (
                    <div key={idx} className="truncate">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setPhase("idle")} className="px-8 py-3 bg-red-500 text-foreground font-black rounded-xl hover:bg-red-400 transition">
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
      <div className="h-2 bg-black/10 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barClass} transition-all duration-500`} style={{ width: `${maxWidth}%` }} />
      </div>
    </div>
  );
}
