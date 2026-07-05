"use client";

import { useEffect, useState, useCallback } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { Puzzle, Star, ChevronRight, Loader2, RotateCcw } from "lucide-react";
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

interface SolvedRecord {
  id: string;
  solvedAt: string;
  hintsUsed: number;
  mistakes: number;
  eloChange: number;
  themes: string[];
}

const STORAGE_KEY = "chess_insight_solved_puzzles";

function loadHistory(): SolvedRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(record: SolvedRecord) {
  const history = loadHistory();
  // Avoid duplicates
  const filtered = history.filter((h) => h.id !== record.id);
  filtered.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 50)));
}

export default function DailyPuzzlePage() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [moveIdx, setMoveIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong" | "done">("idle");
  const [solved, setSolved] = useState(false);

  // Hints: per-move level (resets each move) + total used (cumulative for ELO calc)
  const [currentMoveHintLevel, setCurrentMoveHintLevel] = useState(0);
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [hintText, setHintText] = useState("");
  const [customSquareStyles, setCustomSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const [customArrows, setCustomArrows] = useState<[string, string, string][]>([]);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [profile, setProfile] = useState<any | null>(null);
  const [eloUpdateText, setEloUpdateText] = useState("");
  const [history, setHistory] = useState<SolvedRecord[]>([]);

  // Load profile + history on mount
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
    setHistory(loadHistory());
  }, []);

  // Reset per-move hints when move progresses (but keep totalHintsUsed for ELO)
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

    return { eloChange };
  };

  const handleRequestHint = () => {
    if (!puzzle || !chess || currentMoveHintLevel >= 3) return;

    const solution = puzzle.puzzle.solution;
    const expected = solution[moveIdx];
    if (!expected) return;

    const from = expected.slice(0, 2);
    const to = expected.slice(2, 4);
    const piece = chess.get(from as any);

    const PIECE_NAMES: Record<string, string> = {
      p: "Pawn", n: "Knight", b: "Bishop",
      r: "Rook", q: "Queen", k: "King",
    };

    // Always increment both per-move level and total
    const nextLevel = currentMoveHintLevel + 1;
    setCurrentMoveHintLevel(nextLevel);
    setTotalHintsUsed((prev) => prev + 1);

    if (nextLevel === 1) {
      const pieceName = piece?.type ? PIECE_NAMES[piece.type] : "piece";
      setHintText(`💡 Hint 1/3: Try moving your ${pieceName}.`);
      // No square highlight yet
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

  const handleAutoSolve = useCallback(() => {
    if (!puzzle || !chess || status === "done" || solved) return;

    setStatus("done");
    setSolved(true);
    updateEloForPuzzle(totalHintsUsed, mistakesCount, false);

    const solution = puzzle.puzzle.solution;
    // Create a fresh chess instance so mutations are tracked
    const workChess = new Chess(chess.fen());

    const playNextStep = (idx: number) => {
      if (idx >= solution.length) return;
      const uci = solution[idx];
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promo = uci.length > 4 ? uci[4] : undefined;
      const result = workChess.move({ from, to, promotion: promo });
      if (result) {
        playMoveSound(result.san);
        setChess(new Chess(workChess.fen()));
        setTimeout(() => playNextStep(idx + 1), 750);
      }
    };

    playNextStep(moveIdx);
  }, [puzzle, chess, status, solved, totalHintsUsed, mistakesCount, moveIdx]);

  // Fetch daily puzzle
  useEffect(() => {
    fetch("https://lichess.org/api/puzzle/daily")
      .then((r) => r.json())
      .then((data) => {
        setPuzzle(data);
        const c = new Chess(data.puzzle.fen ?? data.fen);
        // Play the first move automatically (opponent's move to set up the puzzle)
        const solution = data.puzzle.solution;
        if (solution && solution.length > 0) {
          const firstMove = solution[0];
          c.move({ from: firstMove.slice(0, 2), to: firstMove.slice(2, 4), promotion: firstMove[4] });
          setMoveIdx(1);
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
        updateEloForPuzzle(totalHintsUsed, mistakesCount, true).then((res) => {
          if (!puzzle) return;
          const record: SolvedRecord = {
            id: puzzle.id,
            solvedAt: new Date().toISOString(),
            hintsUsed: totalHintsUsed,
            mistakes: mistakesCount,
            eloChange: res?.eloChange ?? 0,
            themes: puzzle.puzzle.themes,
          };
          saveToHistory(record);
          setHistory(loadHistory());
        });
      } else {
        setStatus("correct");
        setTimeout(() => {
          const oppMove = solution[next];
          chess.move({ from: oppMove.slice(0, 2), to: oppMove.slice(2, 4), promotion: oppMove[4] });
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

  const resetPuzzle = () => {
    if (!puzzle) return;
    const c = new Chess(puzzle.fen);
    const solution = puzzle.puzzle.solution;
    if (solution && solution.length > 0) {
      const firstMove = solution[0];
      c.move({ from: firstMove.slice(0, 2), to: firstMove.slice(2, 4), promotion: firstMove[4] });
      setMoveIdx(1);
    }
    setChess(c);
    setStatus("idle");
    setSolved(false);
    setMistakesCount(0);
    setTotalHintsUsed(0);
    setCurrentMoveHintLevel(0);
    setHintText("");
    setCustomSquareStyles({});
    setCustomArrows([]);
    setEloUpdateText("");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0f1d]">
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
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
            {/* Board */}
            <div className="lg:col-span-7">
              <div className={`rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                status === "correct" ? "border-emerald-500 shadow-lg shadow-emerald-500/20" :
                status === "wrong" ? "border-rose-500 shadow-lg shadow-rose-500/20" :
                status === "done" ? "border-emerald-600" : "border-slate-800"
              }`}>
                <BoardView
                  fen={chess.fen()}
                  onPieceDrop={handleMove}
                  arePiecesDraggable={!solved && status !== "done"}
                  customSquareStyles={customSquareStyles}
                  customArrows={customArrows}
                />
              </div>
              {/* Mobile: show status under board */}
              <div className="mt-3 lg:hidden">
                <StatusBanner status={status} solved={solved} />
              </div>
            </div>

            {/* Info panel */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Puzzle Info */}
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

              {/* Status - desktop */}
              <div className="hidden lg:block">
                <StatusBanner status={status} solved={solved} />
              </div>

              {/* Hint Card */}
              <div className="p-5 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-teal-400">Hints & Tools</span>
                  <div className="flex gap-1.5">
                    {[1,2,3].map((i) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-all ${currentMoveHintLevel >= i ? "bg-amber-400 scale-125" : "bg-slate-700"}`} />
                    ))}
                  </div>
                </div>

                {hintText && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 leading-relaxed font-semibold animate-pulse-once">
                    {hintText}
                  </div>
                )}

                {!solved && status !== "done" && (
                  <div className="space-y-2">
                    <button
                      onClick={handleRequestHint}
                      disabled={currentMoveHintLevel >= 3}
                      className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {currentMoveHintLevel >= 3
                        ? "✓ All hints revealed for this move"
                        : `💡 Show Hint ${currentMoveHintLevel + 1} of 3`}
                    </button>

                    <button
                      onClick={handleAutoSolve}
                      className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-all"
                    >
                      ⚡ Auto-Solve Puzzle (−10 ELO)
                    </button>

                    <button
                      onClick={resetPuzzle}
                      className="w-full py-2 text-slate-500 hover:text-slate-300 text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset puzzle
                    </button>

                    {/* Rating rules legend */}
                    <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-[11px] text-slate-400 space-y-1 mt-1">
                      <span className="font-bold text-slate-300 block mb-1.5">💡 ELO Rules:</span>
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

              {/* Solved card */}
              {(solved || status === "done") && (
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-4">
                  <p className="text-emerald-400 font-black text-lg text-center">
                    {solved ? "🎉 Puzzle Solved!" : "✓ Puzzle Complete"}
                  </p>
                  {eloUpdateText && (
                    <pre className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-left text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {eloUpdateText}
                    </pre>
                  )}
                  <p className="text-slate-400 text-sm text-center">Come back tomorrow for a new challenge.</p>
                </div>
              )}

              {/* History panel */}
              {history.length > 0 && (
                <div className="p-5 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-3">
                  <span className="text-xs font-black uppercase tracking-widest text-violet-400">Recent History</span>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {history.slice(0, 10).map((h) => (
                      <div key={h.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-900 rounded-xl">
                        <div>
                          <span className="text-slate-300 font-semibold">{h.themes[0] ?? "Puzzle"}</span>
                          <span className="text-slate-600 ml-2">{new Date(h.solvedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {h.hintsUsed > 0 && <span className="text-amber-500">💡{h.hintsUsed}</span>}
                          <span className={`font-bold ${h.eloChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {h.eloChange >= 0 ? "+" : ""}{h.eloChange}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
  const map: Record<string, { text: string; color: string; bg: string }> = {
    idle:    { text: "Find the best move!", color: "text-slate-300", bg: "bg-slate-800/50" },
    correct: { text: "✓ Correct! Find the next move...", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    wrong:   { text: "✗ Not the best move — try again.", color: "text-rose-400", bg: "bg-rose-500/10" },
    done:    { text: "✓ All moves found!", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  };
  const s = map[status] || map.idle;
  return (
    <div className={`p-4 border border-slate-800 rounded-2xl text-sm font-semibold ${s.color} ${s.bg} transition-all`}>
      {s.text}
    </div>
  );
}
