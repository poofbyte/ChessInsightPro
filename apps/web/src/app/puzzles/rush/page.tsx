"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound } from "../../store";
import { db } from "../../db";
import { initializeProfile } from "@chessinsight/player-profile";
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

  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [currentMoveHintLevel, setCurrentMoveHintLevel] = useState(0);
  const [hintText, setHintText] = useState("");
  const [customSquareStyles, setCustomSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [customArrows, setCustomArrows] = useState<any[]>([]);
  const [sessionEloChange, setSessionEloChange] = useState(0);
  const [eloLog, setEloLog] = useState<string[]>([]);
  const [profile, setProfile] = useState<any | null>(null);

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
          // map to local puzzle format
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
          return;
        }
      }
    } catch (e) {
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
  }, []);

  const startGame = () => {
    setScore(0);
    setStrikes(0);
    setTimeLeft(DURATION);
    setSolved([]);
    setSessionEloChange(0);
    setEloLog([]);
    setPhase("playing");
    loadPuzzle().then(() => {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { endGame(); return 0; }
          return t - 1;
        });
      }, 1000);
    });
  };

  const endGame = useCallback(() => {
    setPhase("done");
    if (intervalRef.current) clearInterval(intervalRef.current);
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

  useEffect(() => {
    if (strikes >= MAX_STRIKES && phase === "playing") endGame();
  }, [strikes, phase, endGame]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleRequestHint = () => {
    // Gate: per-move level (resets each puzzle load)
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
        setScore((s) => s + 1);
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
        `✓ Puzzle #${score + strikes + 1} Solved (${totalHintsUsed} hints): ${change >= 0 ? "+" : ""}${change} ELO`
      ]);

      setSolved((prev) => [...prev, puzzle.id]);
      setTimeout(() => { setFlash(null); loadPuzzle(); }, 500);
      return true;
    } else {
      setFlash("wrong");
      setStrikes((s) => s + 1);
      
      setSessionEloChange((s) => s - 10);
      setEloLog((prev) => [
        ...prev,
        `✗ Puzzle #${score + strikes + 1} Failed (Strike): -10 ELO`
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

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-orange-500/15 border border-orange-500/20">
            <Zap className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Puzzle Rush</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Solve as many puzzles as you can in 3 minutes. 3 strikes and you're out!</p>
          </div>
        </div>

        {phase === "idle" && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <div className="p-6 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Zap className="w-16 h-16 text-orange-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2">Ready to Rush?</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">3 minutes. 3 strikes. Score as high as you can.</p>
            </div>
            <button onClick={startGame} className="px-10 py-4 bg-orange-500 text-white font-black text-lg rounded-2xl hover:bg-orange-600 transition shadow-lg shadow-orange-500/20">
              Start Rush!
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
              <div className="p-5 bg-card border border-border rounded-2xl text-center">
                <div className={`text-5xl font-black tabular-nums ${timeLeft <= 30 ? "text-rose-400 animate-pulse" : "text-foreground"}`}>
                  {mins}:{secs.toString().padStart(2, "0")}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Timer className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-500 text-xs">Time remaining</span>
                </div>
              </div>
              {/* Score */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-card border border-border rounded-xl text-center">
                  <div className="text-3xl font-black text-emerald-400">{score}</div>
                  <div className="text-xs text-slate-500 mt-1">Solved</div>
                </div>
                <div className="p-4 bg-card border border-border rounded-xl text-center">
                  <div className="flex items-center justify-center gap-1 text-rose-400">
                    {Array.from({ length: MAX_STRIKES }).map((_, i) => (
                      <X key={i} className={`w-6 h-6 ${i < strikes ? "opacity-100" : "opacity-20"}`} />
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Strikes</div>
                </div>
              </div>
              {/* Theme badge */}
              <div className="p-4 bg-card border border-border rounded-xl">
                <span className="text-xs font-black uppercase tracking-widest text-orange-400">Theme</span>
                <p className="font-bold text-foreground mt-1">{puzzle.theme === "fallback" ? "Mixed Tactical Motif" : (puzzle.theme || "Mixed Tactical Motif")}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{puzzle.hint}</p>
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
                      <span>• Strike Penalty:</span>
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
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
            <div>
              <h2 className="text-4xl font-black mb-2">Rush Complete!</h2>
              <p className="text-slate-600 dark:text-slate-400">You solved <span className="text-foreground font-black text-2xl">{score}</span> puzzles</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="p-4 bg-card border border-border rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-400">{score}</div>
                <div className="text-xs text-slate-500">Solved</div>
              </div>
              <div className="p-4 bg-card border border-border rounded-xl text-center">
                <div className="text-2xl font-black text-rose-400">{strikes}</div>
                <div className="text-xs text-slate-500">Strikes</div>
              </div>
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

            <button onClick={startGame} className="px-8 py-3 bg-orange-500 text-black font-black rounded-xl hover:bg-orange-400 transition">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
