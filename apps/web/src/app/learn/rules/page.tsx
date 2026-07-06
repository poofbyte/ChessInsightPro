"use client";

import { useState } from "react";
import { BoardView } from "../../../components/BoardView";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";

const RULES = [
  {
    id: "objective",
    title: "The Objective",
    icon: "♚",
    content: "Chess is a two-player strategy game. Each player starts with 16 pieces: 1 King, 1 Queen, 2 Rooks, 2 Bishops, 2 Knights, and 8 Pawns. The goal is to checkmate your opponent's king — place it in check with no escape.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    tip: "Remember: the king is never captured — the game ends when checkmate is achieved.",
  },
  {
    id: "movement",
    title: "How Pieces Move",
    icon: "♞",
    content: "♟ Pawn: Forward 1 or 2 squares (from start), captures diagonally.\n♜ Rook: Any distance horizontally or vertically.\n♝ Bishop: Any distance diagonally (stays on same color).\n♛ Queen: Combines rook + bishop — any direction, any distance.\n♞ Knight: L-shape — 2 squares then 1 at 90°. Can jump over pieces.\n♚ King: One square in any direction.",
    fen: "4k3/8/8/8/3RBQ2/8/8/4K3 w - - 0 1",
    tip: "The knight is the only piece that can jump over other pieces.",
  },
  {
    id: "special-moves",
    title: "Special Moves",
    icon: "🏰",
    content: "CASTLING: The king moves two squares toward a rook, then the rook jumps to the other side. Requirements: neither piece has moved, no pieces between them, king not in check, king doesn't pass through check.\n\nEN PASSANT: If a pawn advances two squares and passes an enemy pawn on an adjacent file, the enemy pawn can capture it as if it moved one square.\n\nPROMOTION: When a pawn reaches the opposite end of the board, it must be replaced by a queen, rook, bishop, or knight.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",
    tip: "Promotion is almost always to a queen (the strongest piece), but underpromotion to a knight can sometimes win by forking.",
  },
  {
    id: "check",
    title: "Check and Checkmate",
    icon: "⚠",
    content: "CHECK: Your king is attacked by an opponent's piece. You MUST resolve the check in one of three ways:\n1. Move the king\n2. Block the attack\n3. Capture the attacking piece\n\nCHECKMATE: The king is in check and none of the three escape options work. The game ends and the attacking player wins.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    tip: "You can never make a move that leaves your own king in check.",
  },
  {
    id: "draws",
    title: "Draws & Stalemate",
    icon: "🤝",
    content: "The game is a draw in several scenarios:\n\nSTALEMATE: The player to move has no legal move and is NOT in check.\n\nINSUFFICIENT MATERIAL: Neither player has enough pieces to force checkmate.\n\nTHREEFOLD REPETITION: The same position occurs three times.\n\n50-MOVE RULE: 50 moves pass with no pawn move or capture.\n\nAGREEMENT: Both players agree to a draw.",
    fen: "8/8/8/8/8/8/6P1/6K1 w - - 0 1",
    tip: "Stalemate is a common defensive resource for the losing side. Watch out for it!",
  },
  {
    id: "time",
    title: "Time Controls",
    icon: "⏱",
    content: "In competitive chess, each player has a clock. Common time controls:\n\nBULLET: Under 3 minutes total\nBLITZ: 3-10 minutes total\nRAPID: 10-60 minutes total\nCLASSICAL: Over 60 minutes total\n\nIf you run out of time, you lose — unless your opponent has insufficient material to checkmate you.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    tip: "Increment (extra seconds added per move) helps prevent time pressure in longer games.",
  },
];

export default function RulesPage() {
  const [idx, setIdx] = useState(0);
  const rule = RULES[idx];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/20">
            <ScrollText className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Rules of Chess</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Everything you need to know to play — from movement to special rules.</p>
          </div>
        </div>

        {/* Chapter tabs */}
        <div className="flex gap-1 mb-8 bg-card border border-border p-1 rounded-2xl overflow-x-auto">
          {RULES.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setIdx(i)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${i === idx ? "bg-amber-500 text-black" : "text-slate-600 dark:text-slate-400 hover:text-foreground"}`}
            >
              {r.icon} {r.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-6">
            <div className="aspect-square rounded-2xl overflow-hidden border border-border">
              <BoardView fen={rule.fen} arePiecesDraggable={false} />
            </div>
          </div>
          <div className="col-span-6 flex flex-col gap-5 justify-center">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{rule.icon}</span>
                <h2 className="text-2xl font-black">{rule.title}</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                {rule.content.split("\n").map((line, i) => {
                  if (!line) return <br key={i} />;
                  const isBold = line === line.toUpperCase() && line.length > 3 && !line.includes(".");
                  return <p key={i} className={`text-sm leading-relaxed mb-2 ${isBold ? "font-black text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>{line}</p>;
                })}
              </div>
            </div>
            {/* Tip */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest">💡 Pro Tip</span>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{rule.tip}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button disabled={idx === 0} onClick={() => setIdx(i => i - 1)} className="flex items-center gap-2 px-4 py-2 bg-black/10 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-sm font-bold transition">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-slate-500">{idx + 1} / {RULES.length}</span>
          <button disabled={idx === RULES.length - 1} onClick={() => setIdx(i => i + 1)} className="flex items-center gap-2 px-4 py-2 bg-black/10 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-sm font-bold transition">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
