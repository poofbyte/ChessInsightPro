"use client";

import { useState, useEffect } from "react";
import { logActivity } from "@/lib/activity-log";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound, useAuthStore } from "../../store";
import { db } from "../../db";
import { initializeProfile } from "@chessinsight/player-profile";
import { PUZZLE_DB, PUZZLE_THEMES, LocalPuzzle, getPuzzlesByTheme } from "../../../lib/puzzle-db";
import { Grid3X3, Filter, ChevronRight, CheckCircle, RotateCcw } from "lucide-react";
import SignUpPrompt from "@/components/SignUpPrompt";
import NavigationGuard from "@/components/NavigationGuard";

export default function CustomPuzzlesPage() {
  const { accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("All");
  const [ratingFilter, setRatingFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [activePuzzle, setActivePuzzle] = useState<LocalPuzzle | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong" | "done">("idle");

  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [currentMoveHintLevel, setCurrentMoveHintLevel] = useState(0);
  const [hintText, setHintText] = useState("");
  const [customSquareStyles, setCustomSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [customArrows, setCustomArrows] = useState<any[]>([]);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [profile, setProfile] = useState<any | null>(null);
  const [eloUpdateText, setEloUpdateText] = useState("");

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

  const getFilteredPuzzles = () => {
    let pool = getPuzzlesByTheme(selectedTheme);
    if (ratingFilter === "easy")  pool = pool.filter((p) => p.rating < 900);
    if (ratingFilter === "medium") pool = pool.filter((p) => p.rating >= 900 && p.rating < 1300);
    if (ratingFilter === "hard")   pool = pool.filter((p) => p.rating >= 1300);
    return pool;
  };

  const launchPuzzle = async (p?: LocalPuzzle) => {
    if (!p) {
      try {
        const res = await fetch(`/api/puzzles/next?theme=${encodeURIComponent(selectedTheme)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.puzzle) {
            const pzl = data.puzzle;
            p = {
              id: pzl.id,
              fen: pzl.initialFen,
              solution: pzl.solution,
              rating: pzl.rating,
              theme: Array.isArray(pzl.themes) ? pzl.themes[0] : (pzl.themes || ""),
              hint: "",
              explanation: ""
            };
          }
        }
      } catch(e) {
        console.error("API puzzle fetch failed", e);
      }
      
      if (!p) {
        const pool = getFilteredPuzzles();
        if (pool.length > 0) {
          p = pool[Math.floor(Math.random() * pool.length)];
        } else {
          return; // No puzzles
        }
      }
    }

    logActivity("puzzle_start", "Custom Puzzle", { theme: p.theme, rating: p.rating });
    setActivePuzzle(p);
    setChess(new Chess(p.fen));
    setStatus("idle");
    setTotalHintsUsed(0);
    setCurrentMoveHintLevel(0);
    setHintText("");
    setCustomSquareStyles({});
    setCustomArrows([]);
    setMistakesCount(0);
    setEloUpdateText("");
  };

  const resetPuzzle = () => {
    if (!activePuzzle) return;
    setCustomArrows([]);
    setMistakesCount(0);
    setEloUpdateText("");
  };

  const updateEloForPuzzle = async (hintsUsed: number, mistakes: number, isSolved: boolean) => {
    if (!profile) return;
    
    let eloChange = 0;
    let baseReward = 0;
    let hintPenalty = 0;
    const mistakePenalty = mistakes * 2;

    if (isSolved) {
      baseReward = 10;
      if (hintsUsed === 0) hintPenalty = 0;
      else if (hintsUsed === 1) hintPenalty = 8;
      else if (hintsUsed === 2) hintPenalty = 10;
      else hintPenalty = 15;
      
      eloChange = baseReward - hintPenalty - mistakePenalty;
    } else {
      eloChange = -10;
    }

    const currentElo = profile.estimatedElo || 1200;
    const newElo = Math.max(100, currentElo + eloChange);
    const updatedProfile = { ...profile, estimatedElo: newElo };
    await db.profiles.put(updatedProfile);
    setProfile(updatedProfile);

    if (isSolved) {
      setEloUpdateText(
        `Elo Calculation breakdown:\n` +
        `• Base Solve Reward: +${baseReward} ELO\n` +
        `• Hint Penalty (${hintsUsed} used): -${hintPenalty} ELO\n` +
        `• Mistakes Penalty (${mistakes} mistakes): -${mistakePenalty} ELO\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• Net ELO Change: ${eloChange >= 0 ? "+" : ""}${eloChange} (New: ${newElo} ELO)`
      );
    } else {
      setEloUpdateText(
        `Elo Calculation breakdown:\n` +
        `• Failed Puzzle Penalty: -10 ELO\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• Net ELO Change: -10 (New: ${newElo} ELO)`
      );
    }
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("profile-updated"));
    }
  };

  const handleRequestHint = () => {
    if (!activePuzzle || !chess || currentMoveHintLevel >= 3) return;

    const solution = activePuzzle.solution;
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

  const handleAutoSolve = () => {
    if (!activePuzzle || !chess || status === "done") return;

    setStatus("done");
    updateEloForPuzzle(totalHintsUsed, mistakesCount, false);

    const solution = activePuzzle.solution;
    const expected = solution[0];
    if (!expected) return;

    const from = expected.slice(0, 2);
    const to = expected.slice(2, 4);
    const promo = expected.length > 4 ? expected[4] : undefined;

    const result = chess.move({ from, to, promotion: promo });
    if (result) {
      playMoveSound(result.san);
      setChess(new Chess(chess.fen()));
    }
  };

  const loadNextPuzzle = () => {
    launchPuzzle();
  };

  const handleMove = (from: string, to: string) => {
    if (!activePuzzle || !chess || status === "done") return false;
    const expected = activePuzzle.solution[0];
    const move = `${from}${to}`;
    if (move === expected || move + "q" === expected) {
      logActivity("puzzle_complete", "Custom Puzzle", { hintsUsed: totalHintsUsed, mistakes: mistakesCount, theme: activePuzzle.theme });
      try {
        const result = chess.move({ from, to, promotion: "q" });
        if (!result) return false;
        playMoveSound(result.san);
        setStatus("done");
        updateEloForPuzzle(totalHintsUsed, mistakesCount, true);
      } catch (e) {
        return false;
      }
      // Save to localStorage history
      const STORAGE_KEY = "chess_insight_solved_puzzles";
      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const record = {
          id: activePuzzle.id,
          solvedAt: new Date().toISOString(),
          hintsUsed: totalHintsUsed,
          mistakes: mistakesCount,
          themes: [activePuzzle.theme],
        };
        const filtered2 = existing.filter((h: any) => h.id !== record.id);
        filtered2.unshift(record);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered2.slice(0, 50)));
      } catch (e) {
        return false;
      }
      return true;
    } else {
      logActivity("puzzle_attempt", "Custom Puzzle", { result: "wrong" });
      setStatus("wrong");
      setMistakesCount((prev) => prev + 1);
      const audio = new Audio("/sounds/illegal-move.webm");
      audio.volume = 0.6;
      audio.play().catch(() => {});
      setTimeout(() => setStatus("idle"), 1000);
      return false;
    }
  };

  const filtered = getFilteredPuzzles();

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <NavigationGuard when={status !== "idle" && !!activePuzzle} title="Puzzle in Progress" message="Your puzzle progress will be lost if you leave.">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/20">
            <Grid3X3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Custom Puzzles</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Filter by theme and rating. Build your tactical repertoire.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Filters + list */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Theme filter */}
            <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-purple-400 tracking-widest">
                <Filter className="w-4 h-4" /> Theme
              </div>
              <div className="flex flex-wrap gap-2">
                {PUZZLE_THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTheme(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedTheme === t ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating filter */}
            <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
              <div className="text-xs font-black uppercase text-purple-400 tracking-widest">Difficulty</div>
              <div className="grid grid-cols-4 gap-1">
                {(["all", "easy", "medium", "hard"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatingFilter(r)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition ${ratingFilter === r ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button 
                  onClick={() => { if (!accessToken) { setShowSignUp(true); return; } launchPuzzle(); }}
                  className="w-full mt-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Start Random Puzzle from Filter
                </button>
            </div>

            {/* Puzzle list */}
            <div className="flex-1 space-y-2 max-h-[400px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-slate-500 italic text-sm py-8">No puzzles match your filter.</p>
              ) : (
                filtered.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { if (!accessToken) { setShowSignUp(true); return; } launchPuzzle(p); }}
                      className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${activePuzzle?.id === p.id ? "border-purple-500 bg-purple-500/10" : "border-border bg-card hover:border-slate-600"}`}
                  >
                    <div>
                      <span className="text-sm font-bold text-foreground">{p.theme}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">{p.hint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RatingBadge rating={p.rating} />
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Board */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {activePuzzle && chess ? (
              <>
                <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-colors ${status === "correct" || status === "done" ? "border-emerald-500" : status === "wrong" ? "border-rose-500" : "border-border"}`}>
                  <BoardView
                    fen={chess.fen()}
                    onPieceDrop={handleMove}
                    arePiecesDraggable={status !== "done"}
                    customSquareStyles={customSquareStyles}
                    customArrows={customArrows}
                  />
                </div>
                
                {/* Info panel */}
                <div className="p-5 bg-card border border-border rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-400 uppercase tracking-widest">{activePuzzle.theme}</span>
                    <RatingBadge rating={activePuzzle.rating} />
                  </div>
                  <p className="text-sm text-slate-350">{activePuzzle.hint}</p>
                  
                  {status === "done" && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm justify-center">
                        <CheckCircle className="w-4 h-4" /> Solved! 
                      </div>
                      {eloUpdateText && (
                        <pre className="p-3 bg-black/10 dark:bg-slate-950 border border-border rounded-xl text-left text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                          {eloUpdateText}
                        </pre>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-center">{activePuzzle.explanation}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-1 mt-2 border-t border-border">
                    {status === "done" && (
                      <button
                        onClick={loadNextPuzzle}
                        className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                      >
                        Next Puzzle →
                      </button>
                    )}
                    <button onClick={resetPuzzle} className="flex items-center gap-1 text-xs text-slate-500 hover:text-foreground transition py-2 px-3">
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
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

                  {status !== "done" && (
                    <div className="space-y-2">
                      <button
                        onClick={handleRequestHint}
                        disabled={currentMoveHintLevel >= 3}
                        className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:shadow-none"
                      >
                        {currentMoveHintLevel >= 3 ? "✓ All hints shown" : `💡 Show Hint ${currentMoveHintLevel + 1} of 3`}
                      </button>

                      <button
                        onClick={handleAutoSolve}
                        className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition"
                      >
                        ⚡ Auto-Solve (−10 ELO)
                      </button>
                      
                      <div className="p-3 bg-black/10 dark:bg-slate-950/40 border border-border rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">💡 ELO Rules:</span>
                        {[
                          ["Perfect solve (0 hints)", "+10", "text-emerald-400"],
                          ["1 hint used", "+2", "text-emerald-500"],
                          ["2 hints used", "+0", "text-amber-500"],
                          ["3 hints used", "−5", "text-rose-400"],
                          ["Each mistake", "−2", "text-rose-500"],
                        ].map(([label, val, color]) => (
                          <div key={label} className="flex justify-between">
                            <span>• {label}</span>
                            <span className={`font-bold ${color}`}>{val} ELO</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="aspect-square rounded-2xl border border-dashed border-slate-700 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Grid3X3 className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-slate-500 text-sm">Select a puzzle from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </NavigationGuard>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="custom puzzles" />
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const color = rating < 900 ? "bg-emerald-500/20 text-emerald-400" : rating < 1300 ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400";
  return <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${color}`}>{rating}</span>;
}
