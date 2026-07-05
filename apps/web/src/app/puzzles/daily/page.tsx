"use client";

import { useEffect, useState } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { Puzzle, Star, ChevronRight, Loader2, Share2 } from "lucide-react";
import { playMoveSound } from "../../store";
import { db } from "../../db";
import { initializeProfile } from "@chessinsight/player-profile";

interface DailyPuzzle {
  id: string;
  fen: string;
  plays: number;
  rating: { rating: number };
  puzzle: { solution: string[]; themes: string[] };
  game: { pgn: string };
}

export default function DailyPuzzlePage() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [moveIdx, setMoveIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong" | "done">("idle");
  const [solved, setSolved] = useState(false);
  
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [currentMoveHintLevel, setCurrentMoveHintLevel] = useState(0);
  const [hintText, setHintText] = useState("");
  const [customSquareStyles, setCustomSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [customArrows, setCustomArrows] = useState<any[]>([]);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [profile, setProfile] = useState<any | null>(null);
  const [eloUpdateText, setEloUpdateText] = useState("");

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

  useEffect(() => {
    setCurrentMoveHintLevel(0);
    setHintText("");
    setCustomSquareStyles({});
    setCustomArrows([]);
  }, [moveIdx]);

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

    // Prepare explanation text
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
    
    // Dispatch custom event to notify sidebar shell
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("profile-updated"));
    }
  };

  const handleRequestHint = () => {
    if (!puzzle || !chess || totalHintsUsed >= 3) return;

    const solution = puzzle.puzzle.solution;
    const expected = solution[moveIdx];
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

  useEffect(() => {
    fetch("https://lichess.org/api/puzzle/daily")
      .then((r) => r.json())
      .then((data) => {
        setPuzzle(data);
        const initialFen = data.puzzle.fen;
        const c = new Chess(initialFen);
        
        // Play the opponent's first move (solution[0]) automatically
        const solution = data.puzzle.solution;
        if (solution && solution.length > 0) {
          const firstMove = solution[0];
          const from = firstMove.slice(0, 2);
          const to = firstMove.slice(2, 4);
          const promotion = firstMove.length > 4 ? firstMove[4] : undefined;
          c.move({ from, to, promotion });
          setMoveIdx(1);
        } else {
          setMoveIdx(0);
        }
        
        setChess(c);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load today's puzzle. Check your connection.");
        setLoading(false);
      });
  }, []);

  const handleMove = (from: string, to: string) => {
    if (!puzzle || !chess || status === "done") return false;
    const solution = puzzle.puzzle.solution;
    const expected = solution[moveIdx];
    const move = `${from}${to}`;

    if (move === expected || move + "q" === expected) {
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return false;
      playMoveSound(result.san);
      const next = moveIdx + 1;
      setMoveIdx(next);
      if (next >= solution.length) {
        setStatus("done");
        setSolved(true);
        updateEloForPuzzle(totalHintsUsed, mistakesCount, true);
      } else {
        setStatus("correct");
        // Make opponent's reply after short delay
        setTimeout(() => {
          const oppMove = solution[next];
          const oppFrom = oppMove.slice(0, 2);
          const oppTo = oppMove.slice(2, 4);
          const oppPromo = oppMove.length > 4 ? oppMove[4] : undefined;
          chess.move({ from: oppFrom, to: oppTo, promotion: oppPromo });
          setMoveIdx(next + 1);
          setStatus("idle");
        }, 600);
      }
      return true;
    } else {
      setStatus("wrong");
      setMistakesCount((prev) => prev + 1);
      setTimeout(() => setStatus("idle"), 1000);
      const audio = new Audio("/sounds/illegal-move.webm");
      audio.volume = 0.6;
      audio.play().catch(() => {});
      return false;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0f1d]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-yellow-500/15 border border-yellow-500/20">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Daily Puzzle</h1>
            <p className="text-slate-400 text-sm">One new challenge every day.</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm">{error}</div>
        )}

        {puzzle && chess && (
          <div className="grid grid-cols-12 gap-8">
            {/* Board */}
            <div className="col-span-7">
              <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800">
                <BoardView
                  fen={chess.fen()}
                  onPieceDrop={handleMove}
                  arePiecesDraggable={status !== "done"}
                  customSquareStyles={customSquareStyles}
                  customArrows={customArrows}
                />
              </div>
            </div>

            {/* Info panel */}
            <div className="col-span-5 flex flex-col gap-4">
              <div className="p-5 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Today's Puzzle</span>
                  <span className="text-xs text-slate-500">Rating: {puzzle.rating?.rating ?? "—"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {puzzle.puzzle.themes.slice(0, 4).map((t) => (
                    <span key={t} className="text-[11px] px-2 py-1 bg-slate-800 rounded-lg text-slate-300 font-semibold capitalize">
                      {t.replace(/([A-Z])/g, " $1")}
                    </span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Find the best move sequence for the side to play.
                </p>
              </div>

              {/* Status */}
              <StatusBanner status={status} solved={solved} />

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

                {!solved && status !== "done" && (
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

              {solved && (
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-4">
                  <p className="text-emerald-400 font-black text-lg text-center">🎉 Puzzle Solved!</p>
                  {eloUpdateText && (
                    <pre className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-left text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {eloUpdateText}
                    </pre>
                  )}
                  <p className="text-slate-400 text-sm text-center">Come back tomorrow for a new challenge.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBanner({ status, solved }: { status: string; solved: boolean }) {
  if (solved) return null;
  const map: Record<string, { text: string; color: string }> = {
    idle:    { text: "Find the best move!", color: "text-slate-400" },
    correct: { text: "✓ Correct! Now find the next move...", color: "text-emerald-400" },
    wrong:   { text: "✗ Not the best move. Try again.", color: "text-rose-400" },
    done:    { text: "✓ All moves found!", color: "text-emerald-400" },
  };
  const s = map[status] || map.idle;
  return (
    <div className={`p-4 bg-[#0d1326] border border-slate-800 rounded-2xl text-sm font-semibold ${s.color}`}>
      {s.text}
    </div>
  );
}
