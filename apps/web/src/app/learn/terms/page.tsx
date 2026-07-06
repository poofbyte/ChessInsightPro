"use client";

import { useState } from "react";
import { AlignLeft, Search } from "lucide-react";

const TERMS = [
  { term: "Algebraic Notation", category: "Notation", definition: "The standard system for recording chess moves. Files are labeled a-h (left to right) and ranks 1-8 (bottom to top from White's perspective)." },
  { term: "Back Rank Mate", category: "Tactics", definition: "Checkmate delivered on the 1st or 8th rank by a rook or queen when the enemy king is trapped behind its own pawns." },
  { term: "Battery", category: "Strategy", definition: "Two or more pieces aligned on the same rank, file, or diagonal — usually two rooks, or queen and rook together." },
  { term: "Blunder", category: "Move Quality", definition: "A serious mistake that loses material, position, or the game outright. Usually marked with ?? in notation." },
  { term: "Castling", category: "Rules", definition: "A special move moving the king two squares toward a rook, and placing the rook on the other side. Only legal under specific conditions." },
  { term: "Check", category: "Rules", definition: "A direct attack on the king. The player in check must resolve the check immediately." },
  { term: "Checkmate", category: "Rules", definition: "A position where the king is in check and there is no legal move to escape. The game ends immediately." },
  { term: "Closed Position", category: "Strategy", definition: "A position with interlocked pawns that restricts piece mobility. Knights often perform better than bishops in closed positions." },
  { term: "Compensation", category: "Strategy", definition: "When a player sacrifices material in exchange for other advantages like activity, initiative, or king safety." },
  { term: "Counterplay", category: "Strategy", definition: "Active moves or threats that prevent the opponent from smoothly executing their plan." },
  { term: "Development", category: "Openings", definition: "Moving pieces from their starting squares to active positions. Good development means all pieces are active and working together." },
  { term: "Discovered Attack", category: "Tactics", definition: "Moving one piece reveals an attack by another piece behind it. Can be extremely powerful when combined with a check." },
  { term: "Doubled Pawns", category: "Pawn Structure", definition: "Two pawns of the same color on the same file. Generally considered a weakness because they can't protect each other." },
  { term: "En Passant", category: "Rules", definition: "A special pawn capture. If a pawn advances two squares and passes an opposing pawn, the opposing pawn can capture it as if it moved only one square." },
  { term: "Endgame", category: "Phase", definition: "The final phase of the chess game, typically reached when most pieces have been exchanged. King activity becomes crucial." },
  { term: "Fork", category: "Tactics", definition: "A single piece attacks two or more enemy pieces simultaneously. Knights are especially well-suited to executing forks." },
  { term: "Fianchetto", category: "Openings", definition: "Developing a bishop to g2/b2 (or g7/b7) after advancing the adjacent knight pawn one square. Creates a powerful diagonal control." },
  { term: "Gambit", category: "Openings", definition: "An opening where one player sacrifices material (usually a pawn) to gain compensation in the form of rapid development or positional advantage." },
  { term: "Hanging Piece", category: "Tactics", definition: "An undefended piece that can be captured for free. Always check for hanging pieces before making your move." },
  { term: "Isolated Pawn", category: "Pawn Structure", definition: "A pawn with no friendly pawns on adjacent files. Often a long-term weakness but can provide active piece play." },
  { term: "Middlegame", category: "Phase", definition: "The phase following the opening, where both sides have developed pieces. Tactical and strategic battles take place." },
  { term: "Opened File", category: "Strategy", definition: "A file with no pawns of either color. Rooks are most powerful on open files." },
  { term: "Opposition", category: "Endgame", definition: "When two kings face each other with one square between them. The side NOT to move has the opposition, which is usually advantageous." },
  { term: "Outpost", category: "Strategy", definition: "A square that cannot be attacked by enemy pawns where a piece (usually a knight) can be permanently placed." },
  { term: "Passed Pawn", category: "Pawn Structure", definition: "A pawn with no opposing pawns blocking or guarding its promotion path. Passed pawns are often decisive in endgames." },
  { term: "Pin", category: "Tactics", definition: "A piece is pinned when moving it would expose a more valuable piece behind it to attack. Absolute pins are against the king." },
  { term: "Promotion", category: "Rules", definition: "When a pawn reaches the 8th rank (or 1st for Black), it is immediately replaced by a queen, rook, bishop, or knight." },
  { term: "Resign", category: "Rules", definition: "Conceding defeat by tipping over the king or declaring 'I resign.' Acceptable when the position is objectively lost." },
  { term: "Sacrifice", category: "Tactics", definition: "Deliberately giving up material to gain a tactical or strategic advantage. Often the most spectacular plays in chess." },
  { term: "Skewer", category: "Tactics", definition: "Like a reverse pin — a valuable piece is attacked and must move, exposing a less valuable piece behind it to capture." },
  { term: "Stalemate", category: "Rules", definition: "A draw when the player to move has no legal moves and their king is NOT in check. Often a saving resource for losing sides." },
  { term: "Tempo", category: "Strategy", definition: "A single move's worth of time. Gaining a tempo means forcing the opponent to react, losing development time." },
  { term: "Zugzwang", category: "Endgame", definition: "A position where any move a player makes worsens their position. Common in pawn and king endgames." },
];

const CATEGORIES = ["All", ...Array.from(new Set(TERMS.map((t) => t.category)))];

export default function ChessTermsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = TERMS.filter((t) => {
    const matchSearch = t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || t.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-violet-500/15 border border-violet-500/20">
            <AlignLeft className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Chess Terms</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Complete glossary of chess terminology — {TERMS.length} terms.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search terms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border focus:border-violet-500 rounded-2xl text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${category === c ? "bg-violet-500 text-white shadow-md shadow-violet-500/20" : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"}`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Terms grid */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 italic py-12">No terms match your search.</p>
          ) : (
            filtered.map((t) => (
              <div key={t.term} className="p-5 bg-card border border-border rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-foreground">{t.term}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-lg">{t.category}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t.definition}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
