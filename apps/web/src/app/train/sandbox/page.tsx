"use client";

import { useState } from "react";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound } from "../../store";
import { BarChart2, RefreshCw, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function SandboxPage() {
  // Store FEN as the single source of truth — reconstruct Chess from it each time
  const [fen, setFen] = useState(INITIAL_FEN);
  const [history, setHistory] = useState<string[]>([INITIAL_FEN]);
  const [histIdx, setHistIdx] = useState(0);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [moveLog, setMoveLog] = useState<string[]>([]);
  const [customFen, setCustomFen] = useState("");
  const [fenError, setFenError] = useState("");

  const handleMove = (from: string, to: string) => {
    try {
      // Always reconstruct from current FEN so state is always clean
      const chess = new Chess(fen);
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return false;
      playMoveSound(result.san);
      const newFen = chess.fen();
      const newHistory = [...history.slice(0, histIdx + 1), newFen];
      setHistory(newHistory);
      setHistIdx(newHistory.length - 1);
      setFen(newFen);
      setMoveLog((prev) => [...prev, result.san]);
      return true;
    } catch {
      // Invalid move — just ignore it silently
      return false;
    }
  };

  const goBack = () => {
    if (histIdx <= 0) return;
    const newIdx = histIdx - 1;
    setHistIdx(newIdx);
    setFen(history[newIdx]);
    setMoveLog((prev) => prev.slice(0, -1));
  };

  const goForward = () => {
    if (histIdx >= history.length - 1) return;
    const newIdx = histIdx + 1;
    setHistIdx(newIdx);
    setFen(history[newIdx]);
  };

  const reset = () => {
    setFen(INITIAL_FEN);
    setHistory([INITIAL_FEN]);
    setHistIdx(0);
    setMoveLog([]);
    setFenError("");
  };

  const loadFen = () => {
    try {
      const trimmed = customFen.trim();
      const c = new Chess(trimmed); // validate
      const newFen = c.fen();
      setFen(newFen);
      setHistory([newFen]);
      setHistIdx(0);
      setMoveLog([]);
      setFenError("");
    } catch {
      setFenError("Invalid FEN string. Please check the format.");
    }
  };

  const gameStatus = () => {
    try {
      const chess = new Chess(fen);
      if (chess.isCheckmate()) return { text: "Checkmate!", color: "text-rose-400" };
      if (chess.isDraw()) return { text: "Draw", color: "text-amber-400" };
      if (chess.isCheck()) return { text: `${chess.turn() === "w" ? "White" : "Black"} is in Check!`, color: "text-orange-400" };
      return { text: `${chess.turn() === "w" ? "White" : "Black"} to move`, color: "text-slate-400" };
    } catch {
      return { text: "Ready", color: "text-slate-400" };
    }
  };
  const status = gameStatus();

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0a0f1d]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/20">
            <BarChart2 className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Analysis Board</h1>
            <p className="text-slate-400 text-sm">Free-play sandbox. Explore positions, test ideas, and analyze.</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7 flex flex-col gap-4">
            <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800">
              <BoardView fen={fen} orientation={orientation} onPieceDrop={handleMove} />
            </div>
            {/* Controls */}
            <div className="flex items-center justify-between bg-[#0d1326] border border-slate-800 p-3 rounded-2xl">
              <div className="flex gap-2">
                <button onClick={goBack} disabled={histIdx <= 0} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={goForward} disabled={histIdx >= history.length - 1} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <span className={`text-sm font-bold ${status.color}`}>{status.text}</span>
              <div className="flex gap-2">
                <button onClick={() => setOrientation(o => o === "white" ? "black" : "white")} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={reset} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-5 flex flex-col gap-4">
            {/* Move log */}
            <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-2xl flex-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Move Log</h3>
              {moveLog.length === 0 ? (
                <p className="text-slate-500 text-xs italic">No moves yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {moveLog.reduce((acc: string[][], san, i) => {
                    if (i % 2 === 0) acc.push([san]);
                    else acc[acc.length - 1].push(san);
                    return acc;
                  }, []).map((pair, i) => (
                    <div key={i} className="contents">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-600 w-5">{i + 1}.</span>
                        <span className="text-white font-semibold">{pair[0]}</span>
                      </div>
                      <div className="text-xs text-white font-semibold">{pair[1] || ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FEN loader */}
            <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Load FEN Position</h3>
              <input
                value={customFen}
                onChange={(e) => setCustomFen(e.target.value)}
                placeholder="Paste FEN string here..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-xl text-xs font-mono text-slate-300 focus:outline-none"
              />
              {fenError && <p className="text-rose-400 text-xs">{fenError}</p>}
              <button onClick={loadFen} className="w-full py-2 bg-teal-500 text-black font-black text-sm rounded-xl hover:bg-teal-400 transition">
                Load Position
              </button>
            </div>

            {/* Board info */}
            <div className="p-4 bg-[#0d1326] border border-slate-800 rounded-xl space-y-1 text-xs">
              <p className="text-slate-500 font-mono break-all">{fen}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
