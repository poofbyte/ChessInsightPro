"use client";

import { useState, useEffect } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound } from "../../store";
import { db } from "../../db";
import { initializeProfile } from "@chessinsight/player-profile";
import { PUZZLE_DB, PUZZLE_THEMES, LocalPuzzle, getPuzzlesByTheme } from "../../../lib/puzzle-db";
import { Grid3X3, Filter, ChevronRight, CheckCircle, RotateCcw } from "lucide-react";

export default function CustomPuzzlesPage() {
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

  const launchPuzzle = (p: LocalPuzzle) => {
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
    setChess(new Chess(activePuzzle.fen));
    setStatus("idle");
    setTotalHintsUsed(0);
    setCurrentMoveHintLevel(0);
    setHintText("");
    setCustomSquareStyles({});
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
    if (!activePuzzle || !chess || totalHintsUsed >= 3) return;

    const solution = activePuzzle.solution;
    const expected = solution[0];
    if (!expected) return;

    const from = expected.slice(0, 2);
    const to = expected.slice(2, 4);
    const piece = chess.get(from as any);
    
    const PIECE_NAMES: Record<string, string> = {
      p: "Pawn",
      n: "Knight",
      b: "Bishop",
      r: "Rook",
      q: "Queen",
      k: "King",
    };

    const nextLevel = currentMoveHintLevel + 1;
    setCurrentMoveHintLevel(nextLevel);
    setTotalHintsUsed((prev) => prev + 1);

    if (nextLevel === 1) {
      const typeKey = piece?.type;
      const pieceName = typeKey ? PIECE_NAMES[typeKey] : "piece";
      setHintText(`Try moving your ${pieceName}.`);
    } else if (nextLevel === 2) {
      setHintText(`The piece is located on the ${from} square.`);
      setCustomSquareStyles({
        [from]: { background: "rgba(251, 191, 36, 0.5)", borderRadius: "40%" },
      });
    } else {
      setHintText(`Play the move from ${from} to ${to}.`);
      setCustomSquareStyles({
        [from]: { background: "rgba(251, 191, 36, 0.3)", borderRadius: "40%" },
        [to]: { background: "rgba(16, 185, 129, 0.4)", borderRadius: "40%" },
      });
      setCustomArrows([[from, to, "rgb(251, 191, 36)"]]);
    }
  };

  const handleMove = (from: string, to: string) => {
    if (!activePuzzle || !chess || status === "done") return false;
    const expected = activePuzzle.solution[0];
    const move = `${from}${to}`;
    if (move === expected || move + "q" === expected) {
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return false;
      playMoveSound(result.san);
      setStatus("done");
      updateEloForPuzzle(totalHintsUsed, mistakesCount, true);
      return true;
    } else {
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
    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0f1d]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/20">
            <Grid3X3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Custom Puzzles</h1>
            <p className="text-slate-400 text-sm">Filter by theme and rating. Build your tactical repertoire.</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Filters + list */}
          <div className="col-span-5 flex flex-col gap-4">
            {/* Theme filter */}
            <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-purple-400 tracking-widest">
                <Filter className="w-4 h-4" /> Theme
              </div>
              <div className="flex flex-wrap gap-2">
                {PUZZLE_THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTheme(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedTheme === t ? "bg-purple-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating filter */}
            <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-3">
              <div className="text-xs font-black uppercase text-purple-400 tracking-widest">Difficulty</div>
              <div className="grid grid-cols-4 gap-1">
                {(["all", "easy", "medium", "hard"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatingFilter(r)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition ${ratingFilter === r ? "bg-purple-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Puzzle list */}
            <div className="flex-1 space-y-2 max-h-[400px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-slate-500 italic text-sm py-8">No puzzles match your filter.</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => launchPuzzle(p)}
                    className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${activePuzzle?.id === p.id ? "border-purple-500 bg-purple-500/10" : "border-slate-800 bg-[#0d1326] hover:border-slate-600"}`}
                  >
                    <div>
                      <span className="text-sm font-bold text-white">{p.theme}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">{p.hint}</span>
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
          <div className="col-span-7 flex flex-col gap-4">
            {activePuzzle && chess ? (
              <>
                <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-colors ${status === "correct" || status === "done" ? "border-emerald-500" : status === "wrong" ? "border-rose-500" : "border-slate-800"}`}>
                  <BoardView
                    fen={chess.fen()}
                    onPieceDrop={handleMove}
                    arePiecesDraggable={status !== "done"}
                    customSquareStyles={customSquareStyles}
                    customArrows={customArrows}
                  />
                </div>
                
                {/* Info panel */}
                <div className="p-5 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-3">
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
                        <pre className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-left text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                          {eloUpdateText}
                        </pre>
                      )}
                      <p className="text-xs text-slate-400 leading-relaxed text-center">{activePuzzle.explanation}</p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-1 mt-2 border-t border-slate-900">
                    <button onClick={resetPuzzle} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
                      <RotateCcw className="w-3 h-3" /> Reset puzzle
                    </button>
                  </div>
                </div>

                {/* Hint Card */}
                <div className="p-5 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-teal-400">Hints</span>
                    <span className="text-xs text-slate-500 font-bold">Used: {totalHintsUsed} / 3</span>
                  </div>
                  
                  {hintText && (
                    <p className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed font-semibold">
                      {hintText}
                    </p>
                  )}

                  {status !== "done" && (
                    <div className="space-y-3">
                      <button
                        onClick={handleRequestHint}
                        disabled={totalHintsUsed >= 3}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-bold rounded-xl transition text-slate-200 border border-slate-700"
                      >
                        {totalHintsUsed >= 3 ? "No hints remaining" : `Request Hint (${3 - totalHintsUsed} left)`}
                      </button>
                      
                      <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-[11px] text-slate-400 space-y-1.5">
                        <span className="font-bold text-slate-300 block mb-1">💡 Rating Rules:</span>
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
                        <div className="flex justify-between border-t border-slate-900 pt-1 mt-1 text-[10px] text-slate-500">
                          <span>• Mistake Penalty:</span>
                          <span className="text-rose-500 font-semibold">-2 ELO each</span>
                        </div>
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
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const color = rating < 900 ? "bg-emerald-500/20 text-emerald-400" : rating < 1300 ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400";
  return <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${color}`}>{rating}</span>;
}
