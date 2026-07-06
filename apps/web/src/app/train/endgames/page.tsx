"use client";

import { useState } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound } from "../../store";
import { Trophy, ChevronRight, RotateCcw, CheckCircle, BookOpen } from "lucide-react";

const ENDGAMES = [
  {
    id: "kk-basic",
    title: "King & Queen vs King",
    category: "Basic Mates",
    difficulty: "Beginner",
    fen: "8/8/8/8/8/3k4/8/3QK3 w - - 0 1",
    goal: "Deliver checkmate",
    description: "The most fundamental endgame. Push the enemy king to the edge of the board and deliver checkmate with your queen and king.",
    tip: "Use your queen to cut off the enemy king, then escort your king to help deliver checkmate.",
  },
  {
    id: "kr-basic",
    title: "King & Rook vs King",
    category: "Basic Mates",
    difficulty: "Beginner",
    fen: "8/8/8/8/8/3k4/8/3RK3 w - - 0 1",
    goal: "Deliver checkmate",
    description: "Checkmate with a rook requires the enemy king to be on the edge. Use your king to help confine the enemy king.",
    tip: "The rook should control a rank or file to restrict the enemy king, while your king helps corner it.",
  },
  {
    id: "pawn-promotion",
    title: "Pawn Endgame — Promotion",
    category: "Pawn Endgames",
    difficulty: "Beginner",
    fen: "8/8/8/8/8/3k4/3P4/3K4 w - - 0 1",
    goal: "Promote the pawn",
    description: "A king and pawn vs king endgame. The key is to use the opposition and escort the pawn to promotion safely.",
    tip: "Use the concept of 'opposition' (kings facing each other one square apart) to help your pawn advance.",
  },
  {
    id: "lucena",
    title: "Lucena Position",
    category: "Rook Endgames",
    difficulty: "Intermediate",
    fen: "1K1k4/1P6/8/8/8/8/8/R7 w - - 0 1",
    goal: "Win with the 'bridge' technique",
    description: "The Lucena position is one of the most important rook endgame positions. Learn the 'building a bridge' technique to win.",
    tip: "Use the rook to 'build a bridge' — cut off the enemy king then bring your king out.",
  },
  {
    id: "philidor",
    title: "Philidor Position",
    category: "Rook Endgames",
    difficulty: "Intermediate",
    fen: "8/8/8/8/8/3k4/3p4/3RK3 w - - 0 1",
    goal: "Draw as the weaker side",
    description: "The Philidor position is a drawing technique in rook endgames. Keep your rook on the 6th rank until the pawn advances, then switch to checking.",
    tip: "With the Philidor: rook on the 6th rank, then behind the pawn when it advances to the 6th.",
  },
  {
    id: "bishop-knight",
    title: "Bishop & Knight Mate",
    category: "Piece Mates",
    difficulty: "Advanced",
    fen: "8/8/8/8/8/3k4/8/3BNK2 w - - 0 1",
    goal: "Force checkmate",
    description: "The most difficult basic endgame. You must force the enemy king into the corner that matches your bishop's color. Requires 30+ moves.",
    tip: "Use the 'W maneuver' with knight and bishop to drive the king into the correct corner.",
  },
  {
    id: "opposition-pawns",
    title: "Key Squares & Opposition",
    category: "Pawn Endgames",
    difficulty: "Intermediate",
    fen: "8/8/8/8/4P3/8/8/4K1k1 w - - 0 1",
    goal: "Promote the pawn",
    description: "Understanding key squares is essential for pawn endgames. The king must reach a 'key square' to guarantee promotion.",
    tip: "For a center pawn, the key squares are two ranks ahead of the pawn on the same and adjacent files.",
  },
  {
    id: "rook-pawns",
    title: "Rook Pawn Defense",
    category: "Pawn Endgames",
    difficulty: "Intermediate",
    fen: "8/P7/8/8/8/8/8/k1K5 w - - 0 1",
    goal: "Win or recognize draw",
    description: "Rook pawns are special — they can be drawn even with an extra piece. If the defending king reaches the promotion corner, it's a draw.",
    tip: "If the defending king gets to the a1/h1 corner, the stronger side cannot force checkmate with only a rook pawn.",
  },
];

export default function EndgamesPage() {
  const [selected, setSelected] = useState<typeof ENDGAMES[0] | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [category, setCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(ENDGAMES.map((e) => e.category)))];
  const filtered = category === "All" ? ENDGAMES : ENDGAMES.filter((e) => e.category === category);

  const launch = (eg: typeof ENDGAMES[0]) => {
    setSelected(eg);
    setChess(new Chess(eg.fen));
  };

  const handleMove = (from: string, to: string) => {
    if (!chess) return false;
    try {
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return false;
      playMoveSound(result.san);
      return true;
    } catch (e) {
      return false;
    }
  };

  const diffColor = (d: string) =>
    d === "Beginner" ? "text-emerald-400 bg-emerald-500/10" :
    d === "Intermediate" ? "text-amber-400 bg-amber-500/10" : "text-rose-400 bg-rose-500/10";

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-yellow-500/15 border border-yellow-500/20">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Endgame Trainer</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Master essential endgame positions that decide games at every level.</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* List */}
          <div className="col-span-5 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${category === c ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20" : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"}`}>{c}</button>
              ))}
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filtered.map((eg) => (
                <button key={eg.id} onClick={() => launch(eg)} className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${selected?.id === eg.id ? "border-yellow-500 bg-yellow-500/10" : "border-border bg-card hover:border-slate-600"}`}>
                  <div>
                    <div className="font-bold text-foreground text-sm">{eg.title}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{eg.category}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${diffColor(eg.difficulty)}`}>{eg.difficulty}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Board + Info */}
          <div className="col-span-7 flex flex-col gap-4">
            {selected && chess ? (
              <>
                <div className="aspect-square rounded-2xl overflow-hidden border border-border">
                  <BoardView fen={chess.fen()} onPieceDrop={handleMove} />
                </div>
                <div className="p-5 bg-card border border-border rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-foreground">{selected.title}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${diffColor(selected.difficulty)}`}>{selected.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                    <Trophy className="w-3 h-3" /> Goal: {selected.goal}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selected.description}</p>
                  <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                    <p className="text-xs font-black text-yellow-400 mb-1">💡 Key Concept</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{selected.tip}</p>
                  </div>
                  <button onClick={() => { setChess(new Chess(selected.fen)); }} className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-foreground transition">
                    <RotateCcw className="w-3 h-3" /> Reset Position
                  </button>
                </div>
              </>
            ) : (
              <div className="aspect-square rounded-2xl border border-dashed border-slate-700 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-slate-500 text-sm">Select an endgame to study</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
