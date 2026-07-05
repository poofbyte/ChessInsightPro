"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Game, Move, CoachStyle, PlayerProfile,
} from "@chessinsight/types";
import { parsePgn, Chess } from "@chessinsight/chess-core";
import { useChessStore, playMoveSound } from "../store";
import { analyzeGame } from "../pipeline";
import { db } from "../db";
import {
  estimateElo, calculateGameAccuracy, initializeProfile, updateProfileWithGame,
} from "@chessinsight/player-profile";
import { WeaknessDetector } from "@chessinsight/weakness-detector";
import { BlunderPuzzleGenerator } from "@chessinsight/puzzles";
import { SpacedRepetitionManager } from "@chessinsight/learning";
import { VisualizationFormatter } from "@chessinsight/charts";
import { getLineWinPercentage } from "@chessinsight/evaluator";
import { resolvePgnFromUrl } from "../../lib/pgn-resolver";
import {
  Upload, RefreshCw, ChevronLeft, ChevronRight, Compass,
  History, Brain, AlertTriangle, Sparkles, BookOpen,
} from "lucide-react";

// SSR-safe dynamic imports
const Chessboard = dynamic(() => import("react-chessboard").then((m) => m.Chessboard), { ssr: false });
const GameLineChart = dynamic(() => import("../../components/GameLineChart"), { ssr: false });

export default function AnalysisPage() {
  const store = useChessStore();
  const [pgnInput, setPgnInput] = useState("");
  const [historicalGames, setHistoricalGames] = useState<Game[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Puzzle state
  const [activePuzzle, setActivePuzzle] = useState<any | null>(null);
  const [puzzleGame, setPuzzleGame] = useState<Chess | null>(null);
  const [puzzleMoveIdx, setPuzzleMoveIdx] = useState(0);
  const [puzzleSuccess, setPuzzleSuccess] = useState<boolean | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (store.game && !showUploader && !activePuzzle) {
        if (e.key === "ArrowRight") store.setCurrentMoveIndex(Math.min(store.currentMoveIndex + 1, store.game.moves.length));
        else if (e.key === "ArrowLeft") store.setCurrentMoveIndex(Math.max(0, store.currentMoveIndex - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store.game, store.currentMoveIndex, showUploader, activePuzzle]);

  const loadDatabaseData = useCallback(async () => {
    const games = await db.games.reverse().toArray();
    setHistoricalGames(games);
    let prof = await db.profiles.get("default-user");
    if (!prof) {
      prof = initializeProfile("default-user");
      await db.profiles.put(prof);
    }
    if (games.length > 0) prof.detectedWeaknesses = WeaknessDetector.detectWeaknesses(games);
    setProfile(prof);
  }, []);

  useEffect(() => { loadDatabaseData(); }, [loadDatabaseData]);

  const handlePgnAnalyze = async () => {
    if (!pgnInput.trim()) return;
    setErrorMsg("");
    store.setIsAnalyzing(true);
    store.setAnalysisProgress(0);
    try {
      const pgnText = await resolvePgnFromUrl(pgnInput);
      const parsed = parsePgn(pgnText);
      const gameMoves: Move[] = parsed.history.map((m, index) => ({
        moveIndex: index + 1,
        san: m.san,
        uci: m.from + m.to + (m.promotion || ""),
        fenAfter: m.fenAfter,
      }));
      const newGame: Game = {
        id: `game-${Date.now()}`,
        pgn: pgnText,
        initialFen: parsed.initialFen,
        white: { name: parsed.headers.White || "White Player" },
        black: { name: parsed.headers.Black || "Black Player" },
        date: parsed.headers.Date || new Date().toLocaleDateString(),
        result: parsed.headers.Result || "*",
        moves: gameMoves,
      };
      const analysisResult = await analyzeGame(newGame, store.engineVersion, (progress) => {
        store.setAnalysisProgress(progress);
      });
      newGame.moves = newGame.moves.map((move, index) => ({
        ...move,
        evaluation: analysisResult.positions[index + 1],
      }));
      newGame.eval = analysisResult;
      await db.games.put(newGame);
      if (profile) {
        const winChances = analysisResult.positions.map((pos) => {
          const firstLine = pos.lines[0];
          if (!firstLine) return 50;
          if (firstLine.mate !== undefined) return firstLine.mate > 0 ? 100 : 0;
          return getLineWinPercentage(firstLine);
        });
        const accuracies = calculateGameAccuracy(winChances);
        const updatedProf = updateProfileWithGame(profile, accuracies.white, 35, parsed.headers.ECO, accuracies.white);
        const weaknesses = WeaknessDetector.detectWeaknesses([newGame]);
        for (const w of weaknesses) {
          let card = await db.learning.get(w.motif);
          if (!card) card = SpacedRepetitionManager.createInitialProgress(w.motif);
          else card = SpacedRepetitionManager.updateConceptProgress(card, false);
          await db.learning.put(card);
        }
        await db.profiles.put(updatedProf);
      }
      await loadDatabaseData();
      store.setGame(newGame);
      setShowUploader(false);
      setPgnInput("");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to parse and analyze PGN. Make sure it has a valid format.");
    } finally {
      store.setIsAnalyzing(false);
    }
  };

  const launchPuzzle = (game: Game, moveIndex: number) => {
    const puzzle = BlunderPuzzleGenerator.generatePuzzleFromBlunder(game, moveIndex);
    if (puzzle) {
      setActivePuzzle(puzzle);
      setPuzzleGame(new Chess(puzzle.initialFen));
      setPuzzleMoveIdx(0);
      setPuzzleSuccess(null);
    }
  };

  const handlePuzzleMove = (from: string, to: string, promotion?: string) => {
    if (!activePuzzle || !puzzleGame || puzzleSuccess !== null) return false;
    try {
      const uciMove = from + to + (promotion || "");
      const solutionMove = activePuzzle.solutionMoves[puzzleMoveIdx];
      if (uciMove === solutionMove) {
        const resultMove = puzzleGame.move({ from, to, promotion });
        setPuzzleSuccess(true);
        playMoveSound(resultMove.san);
        const motif = activePuzzle.hint.includes("Fork") ? "Fork" : activePuzzle.hint.includes("Pin") ? "Pin" : "HangingPiece";
        db.learning.get(motif).then((card) => {
          if (card) {
            const updated = SpacedRepetitionManager.updateConceptProgress(card, true);
            db.learning.put(updated).then(loadDatabaseData);
          }
        });
        return true;
      } else {
        setPuzzleSuccess(false);
        const audio = new Audio("/sounds/illegal-move.webm");
        audio.volume = 0.6;
        audio.play().catch(() => {});
        return false;
      }
    } catch { return false; }
  };

  const getEvalState = () => {
    if (!store.game) return { score: "0.0", percent: 50, isWhiteAhead: true };
    const currentMove = store.game.moves[store.currentMoveIndex - 1];
    const posEval = currentMove?.evaluation || store.game.eval?.positions[0];
    if (!posEval?.lines?.[0]) return { score: "0.0", percent: 50, isWhiteAhead: true };
    const line = posEval.lines[0];
    if (line.mate !== undefined) return { score: `M${Math.abs(line.mate)}`, percent: line.mate > 0 ? 100 : 0, isWhiteAhead: line.mate > 0 };
    if (line.cp !== undefined) {
      const scoreNum = line.cp / 100;
      const rounded = scoreNum.toFixed(1);
      const val = scoreNum > 0 ? `+${rounded}` : rounded;
      return { score: val, percent: Math.min(Math.max(50 + scoreNum * 10, 5), 95), isWhiteAhead: scoreNum >= 0 };
    }
    return { score: "0.0", percent: 50, isWhiteAhead: true };
  };

  const evalState = getEvalState();
  const chartsData = store.game?.eval ? VisualizationFormatter.formatTimeline(store.game, store.game.eval) : [];
  const currentMetrics = store.game?.moves[store.currentMoveIndex - 1]?.evaluation?.metrics
    || store.game?.eval?.positions[0]?.metrics || null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0a0f1d]">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/80 bg-[#0d1326]/60 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-300">Interactive Board & AI Analysis</h2>
        </div>
        <button
          onClick={() => setShowUploader(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-black font-semibold rounded-xl shadow-lg shadow-teal-500/20 transition-all duration-200"
        >
          <Upload className="w-4 h-4" />
          <span>Import PGN</span>
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-8">
        {store.game ? (
          <div className="grid grid-cols-12 gap-8 max-w-[1600px] mx-auto">
            {/* Left: board + controls */}
            <div className="col-span-7 flex flex-col gap-6">
              {/* Player headers */}
              <div className="flex flex-col gap-2">
                <PlayerBar name={store.game.black.name} side="black" />
                <div className="flex gap-4">
                  {/* Eval Bar */}
                  <div className="w-8 bg-slate-800 rounded-full overflow-hidden flex flex-col border border-slate-700/50">
                    <div className="bg-white transition-all duration-500 ease-out" style={{ height: `${evalState.percent}%` }} />
                    <div className="bg-[#1a1a1a] flex-1" />
                  </div>
                  {/* Board */}
                  <div className="flex-1 aspect-square max-w-[640px] rounded-2xl overflow-hidden border border-slate-800/80">
                    {activePuzzle ? (
                      <Chessboard
                        position={puzzleGame?.fen() || activePuzzle.initialFen}
                        onPieceDrop={handlePuzzleMove}
                        boardOrientation={store.boardOrientation}
                        customDarkSquareStyle={{ backgroundColor: "#2b3447" }}
                        customLightSquareStyle={{ backgroundColor: "#3f4b66" }}
                      />
                    ) : (
                      <Chessboard
                        position={store.boardFen}
                        boardOrientation={store.boardOrientation}
                        arePiecesDraggable={false}
                        customDarkSquareStyle={{ backgroundColor: "#2d3748" }}
                        customLightSquareStyle={{ backgroundColor: "#4a5568" }}
                      />
                    )}
                  </div>
                </div>
                <PlayerBar name={store.game.white.name} side="white" />
              </div>

              {/* Board controls */}
              <div className="flex justify-between items-center bg-[#0d1326]/60 border border-slate-800 p-4 rounded-2xl">
                <button
                  onClick={store.toggleBoardOrientation}
                  className="px-4 py-2 hover:bg-slate-800/80 rounded-xl transition text-slate-300 text-sm font-semibold flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Flip Board
                </button>
                <div className="flex gap-2">
                  <NavButton
                    disabled={store.currentMoveIndex === 0}
                    onClick={() => store.setCurrentMoveIndex(Math.max(0, store.currentMoveIndex - 1))}
                    aria-label="Previous move"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </NavButton>
                  <NavButton
                    disabled={store.currentMoveIndex === (store.game?.moves?.length || 0)}
                    onClick={() => store.setCurrentMoveIndex(Math.min(store.currentMoveIndex + 1, store.game?.moves?.length || 0))}
                    aria-label="Next move"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </NavButton>
                </div>
              </div>

              {/* Blunder puzzle panel */}
              {activePuzzle && (
                <BlunderDrillPanel
                  puzzle={activePuzzle}
                  success={puzzleSuccess}
                  onExit={() => setActivePuzzle(null)}
                />
              )}
            </div>

            {/* Right: analysis panel */}
            <div className="col-span-5 flex flex-col gap-4">
              {/* Eval score */}
              <div className="p-4 bg-[#0d1326]/60 border border-slate-800 rounded-2xl text-center">
                <span className={`text-4xl font-black ${evalState.isWhiteAhead ? "text-white" : "text-slate-400"}`}>
                  {evalState.score}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                  {evalState.isWhiteAhead ? "White advantage" : "Black advantage"}
                </p>
              </div>

              {/* Coach panel */}
              <div className="p-4 bg-[#0d1326]/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <Brain className="w-4 h-4" />
                    <span>Virtual Coach</span>
                  </div>
                  <select
                    value={store.coachStyle}
                    onChange={(e) => store.setCoachStyle(e.target.value as CoachStyle)}
                    className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-teal-500"
                  >
                    {Object.values(CoachStyle).map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)} Coach</option>
                    ))}
                  </select>
                </div>
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl min-h-[96px] text-sm text-slate-300 leading-relaxed">
                  {store.currentMoveIndex === 0
                    ? <p className="italic text-slate-400">Starting position. Navigate moves to get coach feedback.</p>
                    : store.game.moves[store.currentMoveIndex - 1]?.evaluation?.narratives?.[store.coachStyle]
                      || <p className="italic text-slate-400">Loading analysis explanation...</p>
                  }
                </div>
              </div>

              {/* Analysis tabs */}
              <div className="flex-1 flex flex-col bg-[#0d1326]/60 border border-slate-800/80 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-4 border-b border-slate-800/80 text-xs font-bold text-center shrink-0">
                  {["Move Log", "Charts", "Metrics", "Puzzles"].map((tab, i) => (
                    <button
                      key={i}
                      onClick={() => store.setActiveTab(i)}
                      className={`py-3 transition ${store.activeTab === i ? "border-b-2 border-teal-500 text-teal-400 bg-slate-800/20" : "text-slate-400 hover:text-white"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {store.activeTab === 0 && <MoveLog game={store.game} currentIndex={store.currentMoveIndex} onSelect={store.setCurrentMoveIndex} />}
                  {store.activeTab === 1 && <GameLineChart data={chartsData} />}
                  {store.activeTab === 2 && currentMetrics && <MetricsView metrics={currentMetrics} />}
                  {store.activeTab === 3 && <PuzzlesTab game={store.game} onLaunch={launchPuzzle} />}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center py-20 max-w-2xl mx-auto">
            <div className="p-6 rounded-full text-teal-400 border border-teal-500/20 mb-6">
              <Compass className="w-16 h-16 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black mb-2">No Active Game Loaded</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Import a game by uploading a PGN file, pasting move history, or selecting from your previously analyzed games below.
            </p>
            {historicalGames.length > 0 && (
              <div className="w-full bg-[#0d1326]/60 p-6 rounded-2xl border border-slate-800">
                <h4 className="text-left text-xs font-bold text-teal-400 uppercase tracking-widest mb-4">Analyzed Games Logs</h4>
                <div className="space-y-2">
                  {historicalGames.slice(0, 5).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => store.setGame(g)}
                      className="w-full p-4 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/30 rounded-xl transition text-left flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-sm block">{g.white.name} vs {g.black.name}</span>
                        <span className="text-xs text-slate-400 mt-0.5 block">{g.date}</span>
                      </div>
                      <span className="text-xs font-bold text-teal-400">{g.result}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PGN Import Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#0d1326] border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setShowUploader(false)} className="absolute right-6 top-6 text-slate-400 hover:text-white font-bold text-lg">✕</button>
            <h3 className="text-xl font-bold mb-2">Import Chess Game PGN</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Paste PGN text or a Chess.com / Lichess game URL to trigger the Stockfish review pipeline.
            </p>

            {/* Engine switcher */}
            <div className="flex items-center justify-between mb-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
              <span className="text-xs font-bold text-slate-300">Engine Version</span>
              <div className="flex gap-1 bg-[#0a0f1d] p-1 rounded-xl border border-slate-800">
                {(["17", "18"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => store.setEngineVersion(v)}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${store.engineVersion === v ? "bg-teal-500 text-black shadow-md shadow-teal-500/20" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Stockfish {v}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              placeholder={`[Event "Casual Game"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6...`}
              className="w-full h-40 bg-[#0a0f1d] border border-slate-800 focus:border-teal-500 rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none font-mono tracking-wide leading-relaxed mb-4"
            />
            {errorMsg && <p className="text-rose-400 text-xs font-bold mb-4">{errorMsg}</p>}

            {store.isAnalyzing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-teal-400">
                  <span>Stockfish {store.engineVersion} is evaluating positions...</span>
                  <span>{store.analysisProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300" style={{ width: `${store.analysisProgress}%` }} />
                </div>
              </div>
            ) : (
              <button onClick={handlePgnAnalyze} className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-black font-black text-sm rounded-xl transition">
                Start Analysis
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

function PlayerBar({ name, side }: { name: string; side: "white" | "black" }) {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className={`w-6 h-6 rounded-full border-2 ${side === "white" ? "bg-white border-slate-300" : "bg-slate-900 border-slate-600"}`} />
      <span className="text-sm font-semibold text-slate-200">{name}</span>
    </div>
  );
}

function NavButton({ disabled, onClick, children, "aria-label": ariaLabel }: { disabled: boolean; onClick: () => void; children: React.ReactNode; "aria-label": string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition"
    >
      {children}
    </button>
  );
}

function MoveLog({ game, currentIndex, onSelect }: { game: Game; currentIndex: number; onSelect: (i: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {game.moves.map((move, idx) => {
        const isWhite = idx % 2 === 0;
        const moveNumber = Math.floor(idx / 2) + 1;
        const isSelected = currentIndex === idx + 1;
        let colorClass = "bg-slate-900/40 border border-transparent";
        if (isSelected) colorClass = "bg-teal-500/20 border border-teal-500/40 text-teal-300";
        else if (move.evaluation?.classification === "blunder") colorClass = "bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400";
        else if (move.evaluation?.classification === "mistake") colorClass = "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400";
        return (
          <button
            key={move.moveIndex}
            onClick={() => onSelect(idx + 1)}
            className={`p-3 rounded-xl text-left flex justify-between items-center transition ${colorClass}`}
          >
            <span className="font-semibold text-sm">{isWhite ? `${moveNumber}. ` : ""}{move.san}</span>
            {move.evaluation?.classification && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800">
                {move.evaluation.classification}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MetricsView({ metrics }: { metrics: any }) {
  const bars = [
    { label: "Development Speed", a: metrics.development[0], b: metrics.development[1], max: 8 },
    { label: "Mobility", a: metrics.mobility[0], b: metrics.mobility[1], max: metrics.mobility[0] + metrics.mobility[1] || 1 },
    { label: "Board Tension", a: metrics.tension[0], b: metrics.tension[1], max: metrics.tension[0] + metrics.tension[1] || 1 },
  ];
  return (
    <div className="space-y-4">
      {bars.map(({ label, a, b, max }) => (
        <div key={label}>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{label}</span>
            <span className="font-semibold text-white">{a} vs {b}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 h-full" style={{ width: `${(a / max) * 100}%` }} />
            <div className="bg-red-500 h-full flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PuzzlesTab({ game, onLaunch }: { game: Game; onLaunch: (game: Game, idx: number) => void }) {
  const blunders = game.moves.filter((m) => m.evaluation?.classification === "blunder");
  if (blunders.length === 0) return <p className="text-sm text-slate-500 italic text-center py-6">Congrats! You made no blunders this game.</p>;
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Blunder Repetitions</h4>
      {game.moves.map((move, idx) => {
        if (move.evaluation?.classification !== "blunder") return null;
        return (
          <div key={move.moveIndex} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-sm font-semibold">Move {move.moveIndex}: {move.san}</span>
              <span className="text-[10px] block text-slate-400 mt-0.5">Motifs: {move.evaluation.facts?.tacticalMotifs.join(", ") || "None"}</span>
            </div>
            <button onClick={() => onLaunch(game, idx)} className="px-3 py-1.5 bg-teal-500 text-black text-xs font-bold rounded-lg hover:bg-teal-400 transition">
              Launch Puzzle
            </button>
          </div>
        );
      })}
    </div>
  );
}

function BlunderDrillPanel({ puzzle, success, onExit }: { puzzle: any; success: boolean | null; onExit: () => void }) {
  return (
    <div className="p-6 bg-teal-950/40 border border-teal-500/30 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
      <div className="absolute right-4 top-4">
        <button onClick={onExit} className="text-xs font-bold text-slate-400 hover:text-white underline">Exit Puzzle</button>
      </div>
      <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
        <Brain className="w-4 h-4" />
        <span>BLUNDER DRILL PUZZLE</span>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{puzzle.hint}</p>
      {success === true && <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold">🎉 Correct Move! Well done!</div>}
      {success === false && <div className="p-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-semibold">❌ Incorrect. Try again.</div>}
    </div>
  );
}
