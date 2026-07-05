"use client";

import { useEffect, useState } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound } from "../../store";
import { Puzzle, Star, ChevronRight, Loader2, Share2 } from "lucide-react";

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

  useEffect(() => {
    fetch("https://lichess.org/api/puzzle/daily")
      .then((r) => r.json())
      .then((data) => {
        setPuzzle(data);
        const game = new Chess();
        // Apply all moves before puzzle start from PGN
        const pgn = data.game.pgn;
        game.loadPgn(pgn);
        // Walk back to puzzle position (last move of the PGN leads to puzzle FEN)
        const c = new Chess(data.puzzle.initialPly ? data.puzzle.initialPly : data.puzzle.fen || data.fen);
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
            <p className="text-slate-400 text-sm">One new challenge every day from Lichess.</p>
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

              {solved && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
                  <p className="text-emerald-400 font-black text-lg">🎉 Puzzle Solved!</p>
                  <p className="text-slate-400 text-sm">Come back tomorrow for a new challenge.</p>
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
