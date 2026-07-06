"use client";

import { useState, useEffect } from "react";
import { logActivity } from "@/lib/activity-log";
import { BoardView } from "../../../components/BoardView";
import { Map, ChevronRight, TrendingUp } from "lucide-react";

const OPENINGS = [
  {
    id: "ruy-lopez",
    name: "Ruy Lopez",
    eco: "C60",
    moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5",
    category: "King's Pawn",
    fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    description: "One of the oldest and most popular openings. White immediately attacks the defender of the e5 pawn, aiming for long-term pressure.",
    keyIdeas: ["Attack the e5 pawn's defender", "Long-term positional pressure", "Castle kingside early", "Reroute the b5 bishop to c2 (Giuoco Piano-like plan)"],
    winRate: { white: 54, black: 29, draw: 17 },
  },
  {
    id: "sicilian",
    name: "Sicilian Defense",
    eco: "B20",
    moves: "1. e4 c5",
    category: "King's Pawn",
    fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
    description: "The most popular response to 1.e4. Black fights for the center asymmetrically, creating imbalances that lead to sharp, dynamic play.",
    keyIdeas: ["Create counterplay on the c-file", "Asymmetrical pawn structure", "Counter-attack rather than symmetry", "Dragon, Najdorf, Scheveningen variations"],
    winRate: { white: 47, black: 37, draw: 16 },
  },
  {
    id: "queens-gambit",
    name: "Queen's Gambit",
    eco: "D06",
    moves: "1. d4 d5 2. c4",
    category: "Queen's Pawn",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2",
    description: "A solid classical opening offering a pawn to gain central control. Not truly a gambit — the c4 pawn can usually be recovered.",
    keyIdeas: ["Offer pawn for rapid development", "Control d5 square", "Free the c1 bishop", "Accepted or declined — both solid for White"],
    winRate: { white: 52, black: 27, draw: 21 },
  },
  {
    id: "kings-indian",
    name: "King's Indian Defense",
    eco: "E60",
    moves: "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7",
    category: "Queen's Pawn",
    fen: "rnbqk2r/ppppppbp/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    description: "Black allows White to build a big center, then attacks it with piece pressure. A dynamic, fighting defense favored by Fischer and Kasparov.",
    keyIdeas: ["Fianchetto the king's bishop", "Let White take the center", "Attack with ...e5 or ...c5 later", "Dynamic counterplay against center"],
    winRate: { white: 46, black: 38, draw: 16 },
  },
  {
    id: "french",
    name: "French Defense",
    eco: "C00",
    moves: "1. e4 e6 2. d4 d5",
    category: "King's Pawn",
    fen: "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
    description: "A solid counter to 1.e4. Black closes the center and creates a solid pawn structure, often leading to queenside counterplay.",
    keyIdeas: ["Solid pawn structure", "Create queenside counterplay", "Attack the d4 pawn with ...c5", "The c8 bishop can be problematic"],
    winRate: { white: 49, black: 34, draw: 17 },
  },
  {
    id: "caro-kann",
    name: "Caro-Kann Defense",
    eco: "B10",
    moves: "1. e4 c6 2. d4 d5",
    category: "King's Pawn",
    fen: "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
    description: "A solid and reliable defense to 1.e4. Unlike the French, Black's c8 bishop has freedom. Favored by many World Champions.",
    keyIdeas: ["Solid pawn structure without blocked bishop", "Recapture on d5 with c6 pawn", "Strong endgame prospects", "Less dynamic than Sicilian but more solid"],
    winRate: { white: 48, black: 32, draw: 20 },
  },
];

export default function OpeningsPage() {
  useEffect(() => { logActivity("page_view", "Learn - Openings"); }, []);
  const [selected, setSelected] = useState<typeof OPENINGS[0] | null>(null);
  const [filter, setFilter] = useState("All");

  const categories = ["All", "King's Pawn", "Queen's Pawn"];
  const filtered = filter === "All" ? OPENINGS : OPENINGS.filter((o) => o.category === filter);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
            <Map className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Openings</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Study the most important opening systems with statistics and key ideas.</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* List */}
          <div className="col-span-5 flex flex-col gap-4">
            <div className="flex gap-2">
              {categories.map((c) => (
                <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filter === c ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"}`}>{c}</button>
              ))}
            </div>
            <div className="space-y-2">
              {filtered.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${selected?.id === o.id ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-card hover:border-slate-600"}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-500 font-mono">{o.eco}</span>
                      <span className="font-bold text-foreground">{o.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{o.moves}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className="col-span-7">
            {selected ? (
              <div className="space-y-5">
                <div className="aspect-square rounded-2xl overflow-hidden border border-border max-w-[400px]">
                  <BoardView fen={selected.fen} arePiecesDraggable={false} />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black">{selected.name}</h2>
                      <span className="text-xs font-black text-slate-500 font-mono bg-black/10 dark:bg-slate-800 px-2 py-1 rounded-lg">{selected.eco}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{selected.description}</p>
                  </div>

                  {/* Win rate */}
                  <div className="p-4 bg-card border border-border rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                      <TrendingUp className="w-4 h-4" /> Master Win Rate
                    </div>
                    <div className="h-3 rounded-full overflow-hidden flex">
                      <div className="bg-white transition-all" style={{ width: `${selected.winRate.white}%` }} />
                      <div className="bg-slate-500 transition-all" style={{ width: `${selected.winRate.draw}%` }} />
                      <div className="bg-black/10 dark:bg-slate-800 transition-all flex-1" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>White: {selected.winRate.white}%</span>
                      <span>Draw: {selected.winRate.draw}%</span>
                      <span>Black: {selected.winRate.black}%</span>
                    </div>
                  </div>

                  {/* Key ideas */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest">Key Ideas</h3>
                    {selected.keyIdeas.map((idea, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        {idea}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-black/5 dark:bg-slate-900/60 rounded-xl border border-border">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Moves</span>
                    <p className="font-mono text-teal-300 mt-1 text-sm">{selected.moves}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border border-dashed border-slate-700 rounded-2xl">
                <p className="text-slate-500 text-sm">Select an opening to study</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
