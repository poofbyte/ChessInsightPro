"use client";

import { useState } from "react";
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { BoardView } from "../../../components/BoardView";

const LESSONS = [
  {
    id: "basics-movement",
    title: "How Pieces Move",
    category: "Fundamentals",
    duration: "5 min",
    icon: "♟",
    slides: [
      { title: "The Pawn", body: "Pawns move forward one square at a time (or two from the starting square). They capture diagonally. Pawns can be promoted to any piece when reaching the 8th rank.", fen: "8/PPPPPPPP/8/8/8/8/pppppppp/8 w - - 0 1" },
      { title: "The Rook", body: "The Rook moves any number of squares horizontally or vertically. It is worth about 5 pawns and excels on open files and the 7th rank.", fen: "8/8/8/8/8/8/8/R7 w - - 0 1" },
      { title: "The Bishop", body: "The Bishop moves diagonally and always stays on the same color. It's worth about 3 pawns. A pair of bishops is very powerful.", fen: "8/8/8/8/8/8/8/2B5 w - - 0 1" },
      { title: "The Knight", body: "The Knight moves in an L-shape: two squares in one direction, then one at 90°. It can jump over pieces. Worth about 3 pawns.", fen: "8/8/8/8/8/8/8/1N6 w - - 0 1" },
      { title: "The Queen", body: "The Queen combines rook and bishop movement — any direction, any distance. The most powerful piece worth about 9 pawns.", fen: "8/8/8/8/8/8/8/3Q4 w - - 0 1" },
      { title: "The King", body: "The King moves one square in any direction. The goal of chess is to checkmate the opponent's king. Protect your king!", fen: "8/8/8/8/8/8/8/4K3 w - - 0 1" },
    ],
  },
  {
    id: "openings-principles",
    title: "Opening Principles",
    category: "Strategy",
    duration: "8 min",
    icon: "🏗",
    slides: [
      { title: "Control the Center", body: "The four central squares (e4, d4, e5, d5) are the most important. Controlling them gives your pieces more mobility and influence.", fen: "rnbqkbnr/pppppppp/8/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2" },
      { title: "Develop Your Pieces", body: "Bring your knights and bishops out early. Every move should activate a piece. Aim to have all minor pieces developed before move 10.", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4" },
      { title: "Castle Early", body: "King safety is crucial. Castling connects your rooks and moves the king to safety. Try to castle within the first 10 moves.", fen: "r1bq1rk1/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQ - 6 5" },
      { title: "Don't Move Pieces Twice", body: "Each piece should be developed to its best square and left there. Moving the same piece twice in the opening wastes tempo.", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2" },
    ],
  },
  {
    id: "tactics-intro",
    title: "Basic Tactics",
    category: "Tactics",
    duration: "10 min",
    icon: "⚔",
    slides: [
      { title: "The Fork", body: "A fork is when one piece attacks two or more enemy pieces simultaneously. Knights are the most common forking piece due to their unique movement.", fen: "8/8/8/3n4/8/3K4/8/8 b - - 0 1" },
      { title: "The Pin", body: "A pin restricts an opponent's piece movement because moving it would expose a more valuable piece behind it. Pins on the king are absolute.", fen: "8/8/8/1b6/8/1N6/8/1K6 b - - 0 1" },
      { title: "The Skewer", body: "Like a pin in reverse — a valuable piece is attacked and must move, exposing a less valuable piece behind it.", fen: "8/8/8/1r6/8/8/8/1R4K1 b - - 0 1" },
      { title: "Discovered Attack", body: "Moving one piece reveals an attack from another piece behind it. This can create threats that are impossible to defend simultaneously.", fen: "r3k3/8/8/8/8/8/8/4B1RK w - - 0 1" },
    ],
  },
  {
    id: "endgame-basics",
    title: "Endgame Essentials",
    category: "Endgame",
    duration: "12 min",
    icon: "👑",
    slides: [
      { title: "King Activation", body: "In the endgame, the king becomes a powerful piece. Bring it to the center! The king can fight for key squares and support pawns.", fen: "8/8/8/3k4/8/8/8/3K4 w - - 0 1" },
      { title: "The Opposition", body: "Two kings in opposition (directly facing each other with one square between them) — the side NOT to move has the opposition and the advantage.", fen: "8/8/8/8/8/3k4/8/3K4 w - - 0 1" },
      { title: "Pawn Promotion", body: "Advancing a passed pawn to the 8th rank promotes it. This is often the winning factor in endgames. The king must escort the pawn safely.", fen: "8/4P3/8/8/8/3k4/8/3K4 w - - 0 1" },
      { title: "Rook Endgame Principles", body: "Rooks should be active, placed on open files and behind passed pawns. Cut off the enemy king and activate your rook.", fen: "8/8/3k4/8/8/3K4/3R4/8 w - - 0 1" },
    ],
  },
];

export default function LessonsPage() {
  const [selectedLesson, setSelectedLesson] = useState<typeof LESSONS[0] | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);

  if (selectedLesson) {
    const slide = selectedLesson.slides[slideIdx];
    const isLast = slideIdx === selectedLesson.slides.length - 1;
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-background">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-foreground transition mb-6 text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to Lessons
          </button>
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-6">
              <div className="aspect-square rounded-2xl overflow-hidden border border-border">
                <BoardView fen={slide.fen} arePiecesDraggable={false} />
              </div>
              {/* Progress */}
              <div className="mt-4 flex gap-2">
                {selectedLesson.slides.map((_, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition ${i <= slideIdx ? "bg-teal-500" : "bg-slate-700"}`} />
                ))}
              </div>
            </div>
            <div className="col-span-6 flex flex-col gap-4">
              <span className="text-xs font-black text-teal-400 uppercase tracking-widest">{selectedLesson.category}</span>
              <h2 className="text-3xl font-black leading-tight">{slide.title}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{slide.body}</p>
              <div className="flex items-center justify-between mt-auto">
                <button disabled={slideIdx === 0} onClick={() => setSlideIdx(s => s - 1)} className="px-4 py-2 bg-black/10 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 disabled:opacity-40 transition">
                  Previous
                </button>
                <span className="text-xs text-slate-500">{slideIdx + 1} / {selectedLesson.slides.length}</span>
                {isLast ? (
                  <button
                    onClick={() => {
                      setCompleted((c) => c.includes(selectedLesson.id) ? c : [...c, selectedLesson.id]);
                      setSelectedLesson(null);
                    }}
                    className="px-4 py-2 bg-teal-500 text-black font-black rounded-xl text-sm hover:bg-teal-400 transition"
                  >
                    Complete Lesson ✓
                  </button>
                ) : (
                  <button onClick={() => setSlideIdx(s => s + 1)} className="flex items-center gap-1 px-4 py-2 bg-teal-500 text-black font-black rounded-xl text-sm hover:bg-teal-400 transition">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/20">
            <GraduationCap className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Lessons</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Structured learning with interactive board demonstrations.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {LESSONS.map((lesson) => {
            const done = completed.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                onClick={() => { setSelectedLesson(lesson); setSlideIdx(0); }}
                className="p-6 bg-card border border-border hover:border-teal-500/40 rounded-2xl text-left transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{lesson.icon}</span>
                  {done ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-black text-slate-500 uppercase bg-black/10 dark:bg-slate-800 px-2 py-1 rounded-lg">{lesson.duration}</span>
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">{lesson.category}</span>
                <h3 className="font-black text-lg text-foreground mt-1 mb-2">{lesson.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{lesson.slides.length} slides</p>
                <div className="flex items-center gap-1 text-teal-400 text-xs font-bold mt-4 opacity-0 group-hover:opacity-100 transition">
                  Start Lesson <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
