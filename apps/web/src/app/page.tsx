"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Game, Move, CoachStyle, PlayerProfile,
} from "@chessinsight/types";
import { parsePgn, Chess } from "@chessinsight/chess-core";
import { useChessStore, playMoveSound } from "./store";
import { analyzeGame } from "./pipeline";
import { db } from "./db";
import {
  calculateGameAccuracy, initializeProfile, updateProfileWithGame,
} from "@chessinsight/player-profile";
import { WeaknessDetector } from "@chessinsight/weakness-detector";
import { BlunderPuzzleGenerator } from "@chessinsight/puzzles";
import { SpacedRepetitionManager } from "@chessinsight/learning";
import { getLineWinPercentage } from "@chessinsight/evaluator";
import { resolvePgnFromUrl } from "../lib/pgn-resolver";
import { logActivity } from "../lib/activity-log";
import { VisualizationFormatter } from "@chessinsight/charts";
import {
  Upload, RefreshCw, ChevronLeft, ChevronRight,
  Brain, Play, ShieldAlert
} from "lucide-react";
import { BoardView } from "../components/BoardView";
import { useAuthStore } from "./store";
import SignUpPrompt from "../components/SignUpPrompt";
import NavigationGuard from "../components/NavigationGuard";
import { PageContainer } from "../components/layout/PageContainer";
import { ContentContainer } from "../components/layout/ContentContainer";
import { ChessboardContainer } from "../components/layout/ChessboardContainer";
import { ResponsiveToolbar } from "../components/layout/ResponsiveToolbar";
import { PanelStack } from "../components/layout/PanelStack";
import { Panel } from "../components/layout/Panel";

const GameLineChart = dynamic(() => import("../components/GameLineChart"), { ssr: false });

export default function RootReviewPage() {
  const game = useChessStore(s => s.game);
  const boardFen = useChessStore(s => s.boardFen);
  const currentMoveIndex = useChessStore(s => s.currentMoveIndex);
  const evaluation = useChessStore(s => s.evaluation);
  const isAnalyzing = useChessStore(s => s.isAnalyzing);
  const analysisProgress = useChessStore(s => s.analysisProgress);
  const coachStyle = useChessStore(s => s.coachStyle);
  const activeTab = useChessStore(s => s.activeTab);
  const boardOrientation = useChessStore(s => s.boardOrientation);
  const engineVersion = useChessStore(s => s.engineVersion);
  const setCurrentMoveIndex = useChessStore(s => s.setCurrentMoveIndex);
  const setIsAnalyzing = useChessStore(s => s.setIsAnalyzing);
  const setAnalysisProgress = useChessStore(s => s.setAnalysisProgress);
  const setCoachStyle = useChessStore(s => s.setCoachStyle);
  const setActiveTab = useChessStore(s => s.setActiveTab);
  const setGame = useChessStore(s => s.setGame);
  const reset = useChessStore(s => s.reset);
  const setEngineVersion = useChessStore(s => s.setEngineVersion);
  const [pgnInput, setPgnInput] = useState("");
  const [historicalGames, setHistoricalGames] = useState<Game[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const { accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // Puzzle state
  const [activePuzzle, setActivePuzzle] = useState<any | null>(null);
  const [puzzleGame, setPuzzleGame] = useState<Chess | null>(null);
  const [puzzleMoveIdx, setPuzzleMoveIdx] = useState(0);
  const [puzzleSuccess, setPuzzleSuccess] = useState<boolean | null>(null);

  // Keyboard navigation (ref avoids tearing down listener on every move change)
  const currentMoveIndexRef = useRef(currentMoveIndex);
  currentMoveIndexRef.current = currentMoveIndex;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game && !activePuzzle) {
        if (e.key === "ArrowRight") setCurrentMoveIndex(Math.min(currentMoveIndexRef.current + 1, game.moves.length));
        else if (e.key === "ArrowLeft") setCurrentMoveIndex(Math.max(0, currentMoveIndexRef.current - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game, activePuzzle]);

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

  const handlePgnAnalyze = useCallback(async () => {
    if (!pgnInput.trim()) return;
    setErrorMsg("");
    setIsAnalyzing(true);
    setAnalysisProgress(0);
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
      const analysisResult = await analyzeGame(newGame, engineVersion, (progress) => {
        setAnalysisProgress(progress);
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
      logActivity("game_review", "PGN analyzed", { game_id: newGame.id, white: newGame.white.name, black: newGame.black.name, result: newGame.result });
      setGame(newGame);
      setPgnInput("");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to parse and analyze PGN. Make sure it has a valid format.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [pgnInput, engineVersion, profile, loadDatabaseData, setGame, setIsAnalyzing, setAnalysisProgress]);

  const clearPuzzle = useCallback(() => setActivePuzzle(null), []);

  const launchPuzzle = useCallback((game: Game, moveIndex: number) => {
    const puzzle = BlunderPuzzleGenerator.generatePuzzleFromBlunder(game, moveIndex);
    if (puzzle) {
      logActivity("puzzle", "Puzzle launched", { game_id: game.id, move_index: moveIndex, hint: puzzle.hint });
      setActivePuzzle(puzzle);
      setPuzzleGame(new Chess(puzzle.initialFen));
      setPuzzleMoveIdx(0);
      setPuzzleSuccess(null);
    }
  }, []);

  const handlePuzzleMove = useCallback((from: string, to: string, promotion?: string) => {
    if (!activePuzzle || !puzzleGame || puzzleSuccess !== null) return false;
    try {
      const uciMove = from + to + (promotion || "");
      const solutionMove = activePuzzle.solutionMoves[puzzleMoveIdx];
      if (uciMove === solutionMove) {
        const resultMove = puzzleGame.move({ from, to, promotion });
        logActivity("puzzle", "Puzzle solved", { move: uciMove });
        setPuzzleSuccess(true);
        playMoveSound(resultMove.san);
        return true;
      } else {
        setPuzzleSuccess(false);
        const audio = new globalThis.Audio("/sounds/illegal-move.webm");
        audio.volume = 0.5;
        audio.play().catch(() => {});
        return false;
      }
    } catch {
      return false;
    }
  }, [activePuzzle, puzzleGame, puzzleMoveIdx, puzzleSuccess]);

  const evalState = useMemo(() => {
    if (!game || !evaluation) return { score: "0.0", percent: 50, isWhiteAhead: true };
    const pos = evaluation.positions[currentMoveIndex];
    if (!pos || !pos.lines || pos.lines.length === 0) return { score: "0.0", percent: 50, isWhiteAhead: true };

    const firstLine = pos.lines[0];
    if (firstLine.mate !== undefined) {
      const isWhiteWinning = firstLine.mate > 0;
      return {
        score: `M${Math.abs(firstLine.mate)}`,
        percent: isWhiteWinning ? 100 : 0,
        isWhiteAhead: isWhiteWinning,
      };
    }

    const cp = firstLine.cp ?? 0;
    const scoreVal = (cp / 100).toFixed(1);
    const winPercent = getLineWinPercentage(firstLine);

    return {
      score: cp > 0 ? `+${scoreVal}` : scoreVal,
      percent: Math.round(winPercent),
      isWhiteAhead: cp >= 0,
    };
  }, [game, evaluation, currentMoveIndex]);

  const chartsData = useMemo(() =>
    game && evaluation
      ? VisualizationFormatter.formatTimeline(game, evaluation)
      : [],
    [game, evaluation]
  );

  const currentMetrics = useMemo(() =>
    game && evaluation
      ? evaluation.positions[currentMoveIndex]?.metrics
      : null,
    [game, evaluation, currentMoveIndex]
  );

  return (
    <PageContainer>
      <NavigationGuard when={!!game || isAnalyzing} title="Game Review in Progress" message="Your analysis progress will be lost if you leave this page.">
      <ContentContainer maxWidth="max-w-[1600px]" className="space-y-6">
        
        {game ? (
          /* ACTIVE GAME REVIEW STATE */
          <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
            {/* Left: Board, Eval, and Controls */}
            <div className="w-full xl:w-[55%] flex flex-col gap-4">
              
              <Panel className="flex justify-between items-center !p-4 !rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-slate-900 border border-slate-700" />
                  <span className="text-sm font-semibold">{game.black.name}</span>
                </div>
                <button
                  onClick={() => reset()}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-foreground underline transition"
                >
                  Unload Game
                </button>
              </Panel>

              <div className="flex flex-col md:flex-row gap-4 w-full">
                {/* Board Box (Priority 1) */}
                <ChessboardContainer className="rounded-3xl overflow-hidden border border-border shadow-2xl order-1 md:order-2 bg-black/10 dark:bg-slate-950">
                  {activePuzzle ? (
                    <BoardView
                      fen={puzzleGame?.fen() || activePuzzle.initialFen}
                      onPieceDrop={handlePuzzleMove}
                      orientation={boardOrientation}
                    />
                  ) : (
                    <BoardView
                      fen={boardFen}
                      orientation={boardOrientation}
                      arePiecesDraggable={false}
                    />
                  )}
                </ChessboardContainer>
                
                {/* Eval Bar (Horizontal on mobile, Vertical on md+) */}
                <div className="h-3 md:h-auto md:w-6 bg-black/10 dark:bg-slate-800 rounded-full overflow-hidden flex flex-row md:flex-col border border-slate-700/50 shrink-0 order-2 md:order-1">
                  {/* Mobile Horizontal */}
                  <div className="bg-white transition-all duration-500 ease-out md:hidden" style={{ width: `${evalState.percent}%` }} />
                  <div className="bg-[#1b1f2b] flex-1 md:hidden" />
                  {/* Desktop Vertical */}
                  <div className="bg-white transition-all duration-500 ease-out hidden md:block" style={{ height: `${evalState.percent}%` }} />
                  <div className="bg-[#1b1f2b] flex-1 hidden md:block" />
                </div>
              </div>

              <Panel className="flex justify-between items-center !p-4 !rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white border border-slate-300" />
                  <span className="text-sm font-semibold">{game.white.name}</span>
                </div>
                <ResponsiveToolbar className="w-auto">
                  <NavButtonMemo
                    disabled={currentMoveIndex === 0}
                    onClick={() => setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1))}
                    aria-label="Previous move"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </NavButtonMemo>
                  <NavButtonMemo
                    disabled={currentMoveIndex === game.moves.length}
                    onClick={() => setCurrentMoveIndex(Math.min(currentMoveIndex + 1, game.moves.length))}
                    aria-label="Next move"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </NavButtonMemo>
                </ResponsiveToolbar>
              </Panel>

              {activePuzzle && (
                <BlunderDrillPanel
                  puzzle={activePuzzle}
                  success={puzzleSuccess}
                  onExit={clearPuzzle}
                />
              )}
            </div>

            {/* Right: Analysis & Feedback Panel */}
            <PanelStack className="w-full xl:w-[45%]">
              {/* Eval score */}
              <Panel className="text-center">
                <span className={`text-4xl font-black tracking-tight ${evalState.isWhiteAhead ? "text-foreground" : "text-slate-600 dark:text-slate-400"}`}>
                  {evalState.score}
                </span>
                <p className="text-xs text-slate-500 mt-1.5 uppercase font-bold tracking-widest">
                  {evalState.isWhiteAhead ? "White advantage" : "Black advantage"}
                </p>
              </Panel>

              {/* Coach panel */}
              <Panel className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <Brain className="w-4 h-4 text-teal-400 animate-pulse" />
                    <span>Virtual Coach Feedback</span>
                  </div>
                  <select
                    value={coachStyle}
                    onChange={(e) => setCoachStyle(e.target.value as CoachStyle)}
                    className="text-xs bg-black/5 dark:bg-slate-900 border border-border rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-teal-500 font-bold"
                  >
                    {Object.values(CoachStyle).map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)} Coach</option>
                    ))}
                  </select>
                </div>
                <div className="p-4 bg-black/10 dark:bg-slate-950/60 border border-border rounded-2xl min-h-[100px] text-sm text-slate-900 dark:text-slate-200 leading-relaxed font-medium">
                  {currentMoveIndex === 0
                    ? <p className="italic text-slate-500">Starting position. Use Arrow Keys or buttons to step through moves.</p>
                    : game.moves[currentMoveIndex - 1]?.evaluation?.narratives?.[coachStyle]
                      || <p className="italic text-slate-500">Evaluating position parameters...</p>
                  }
                </div>
              </Panel>

              {/* Analysis Tabs Container */}
              <Panel className="!p-0 flex-1 flex flex-col min-h-[350px]">
                <div className="flex overflow-x-auto scrollbar-hide whitespace-nowrap border-b border-border text-xs font-bold text-center shrink-0">
                  {["Move Log", "Accuracy Chart", "Positional Metrics", "Blunders"].map((tab, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(i)}
                      className={`flex-1 min-w-[120px] py-3.5 transition-all ${activeTab === i ? "border-b-2 border-teal-500 text-teal-400 bg-black/5 dark:bg-slate-900/40" : "text-slate-600 dark:text-slate-400 hover:text-foreground"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  {activeTab === 0 && <MoveLogMemo game={game} currentIndex={currentMoveIndex} onSelect={setCurrentMoveIndex} />}
                  {activeTab === 1 && <GameLineChart data={chartsData} />}
                  {activeTab === 2 && currentMetrics && <MetricsViewMemo metrics={currentMetrics} />}
                  {activeTab === 3 && <PuzzlesTabMemo game={game} onLaunch={launchPuzzle} />}
                </div>
              </Panel>
            </PanelStack>
          </div>
        ) : (
          /* EMPTY STATE - UPLOAD / RESOLVE GAME */
          <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
            
            {/* Left Column: Visual Starting Board */}
            <div className="w-full xl:w-[50%] flex flex-col gap-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Board Preview</h2>
              <ChessboardContainer className="rounded-3xl overflow-hidden border border-border shadow-2xl bg-black/10 dark:bg-slate-950">
                <BoardView fen="start" arePiecesDraggable={false} />
              </ChessboardContainer>
            </div>

            {/* Right Column: Paste Box and Previous reviews list */}
            <PanelStack className="w-full xl:w-[50%]">
              
              {/* Main uploader card */}
              <Panel className="space-y-6">
                
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Game Reviewer</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">Paste PGN text or chess.com URL to analyze</p>
                  </div>
                </div>

                {/* Engine selection settings */}
                <div className="flex items-center justify-between bg-background border border-border rounded-2xl p-3">
                  <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Stockfish Engine</span>
                  <div className="flex gap-1 p-0.5 bg-black/5 dark:bg-slate-900 rounded-xl border border-border">
                    {(["17", "18"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setEngineVersion(v)}
                        className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                          engineVersion === v
                            ? "bg-teal-500 text-black shadow-md shadow-teal-500/10"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-200"
                        }`}
                      >
                        SF {v}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={pgnInput}
                  onChange={(e) => setPgnInput(e.target.value)}
                  placeholder={`Paste PGN move history here...\nOr enter a Chess.com / Lichess game URL\n\ne.g. https://www.chess.com/game/live/...\n      https://lichess.org/abcd1234`}
                  className="w-full h-44 bg-background border border-border focus:border-teal-500/80 rounded-2xl p-4 text-sm text-foreground placeholder:text-slate-500 focus:outline-none resize-none font-mono tracking-wide leading-relaxed"
                />
                
                {errorMsg && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {isAnalyzing ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-teal-400">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Evaluating position parameters...
                      </span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/10 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300" style={{ width: `${analysisProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!hydrated || !accessToken) setShowSignUp(true);
                      else handlePgnAnalyze();
                    }}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-black font-black text-sm rounded-2xl transition shadow-lg shadow-teal-500/10"
                  >
                    Start Game Review
                  </button>
                )}
              </Panel>

              {/* Previously reviewed list */}
              {historicalGames.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 pl-1">Recent Game Reviews</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {historicalGames.slice(0, 5).map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGame(g)}
                        className="w-full p-4 bg-card/60 hover:bg-black/10 dark:bg-slate-800/40 border border-border hover:border-teal-500/25 rounded-2xl transition text-left flex justify-between items-center group"
                      >
                        <div>
                          <span className="font-bold text-sm block group-hover:text-foreground text-slate-900 dark:text-slate-200">{g.white.name} vs {g.black.name}</span>
                          <span className="text-xs text-slate-500 mt-1 block">{g.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-400 bg-teal-500/5 px-2 py-1 rounded-lg border border-teal-500/10">{g.result}</span>
                          <Play className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </PanelStack>
          </div>
        )}
      </ContentContainer>
      </NavigationGuard>

      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="game reviews" />
    </PageContainer>
  );
}

// Sub-components (wrapped with React.memo to prevent re-renders on parent state changes)

const NavButtonMemo = React.memo(function NavButton({ disabled, onClick, children, "aria-label": ariaLabel }: { disabled: boolean; onClick: () => void; children: React.ReactNode; "aria-label": string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className="p-3 bg-black/10 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition"
    >
      {children}
    </button>
  );
});

const MoveLogMemo = React.memo(function MoveLog({ game, currentIndex, onSelect }: { game: Game; currentIndex: number; onSelect: (i: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {game.moves.map((move, idx) => {
        const isWhite = idx % 2 === 0;
        const moveNumber = Math.floor(idx / 2) + 1;
        const isSelected = currentIndex === idx + 1;
        let colorClass = "bg-black/5 dark:bg-slate-900/40 border border-transparent";
        if (isSelected) colorClass = "bg-teal-500/20 border border-teal-500/40 text-teal-700 dark:text-teal-300";
        else if (move.evaluation?.classification === "blunder") colorClass = "bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400";
        else if (move.evaluation?.classification === "mistake") colorClass = "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400";
        return (
          <button
            key={move.moveIndex}
            onClick={() => onSelect(idx + 1)}
            className={`p-3 rounded-xl text-left flex justify-between items-center transition ${colorClass}`}
          >
            <span className="font-semibold text-sm">{isWhite ? `${moveNumber}. ` : ""}{move.san}</span>
            {move.evaluation?.classification && (
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/10 dark:bg-slate-800">
                {move.evaluation.classification}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

const MetricsViewMemo = React.memo(function MetricsView({ metrics }: { metrics: any }) {
  const bars = [
    { label: "Development Speed", a: metrics.development[0], b: metrics.development[1], max: 8 },
    { label: "Mobility", a: metrics.mobility[0], b: metrics.mobility[1], max: metrics.mobility[0] + metrics.mobility[1] || 1 },
    { label: "Board Tension", a: metrics.tension[0], b: metrics.tension[1], max: metrics.tension[0] + metrics.tension[1] || 1 },
  ];
  return (
    <div className="space-y-4">
      {bars.map(({ label, a, b, max }) => (
        <div key={label}>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span>{label}</span>
            <span className="font-semibold text-foreground">{a} vs {b}</span>
          </div>
          <div className="h-2 bg-black/10 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 h-full" style={{ width: `${(a / max) * 100}%` }} />
            <div className="bg-red-500 h-full flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
});

const PuzzlesTabMemo = React.memo(function PuzzlesTab({ game, onLaunch }: { game: Game; onLaunch: (game: Game, idx: number) => void }) {
  const blunders = game.moves.filter((m) => m.evaluation?.classification === "blunder");
  if (blunders.length === 0) return <p className="text-sm text-slate-500 italic text-center py-6">Congrats! You made no blunders this game.</p>;
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Available Blunder Repetitions</h4>
      {game.moves.map((move, idx) => {
        if (move.evaluation?.classification !== "blunder") return null;
        return (
          <div key={move.moveIndex} className="p-4 bg-black/5 dark:bg-slate-900 border border-border rounded-xl flex justify-between items-center">
            <div>
              <span className="text-sm font-semibold">Move {move.moveIndex}: {move.san}</span>
              <span className="text-xs block text-slate-600 dark:text-slate-400 mt-0.5">Motifs: {move.evaluation.facts?.tacticalMotifs.join(", ") || "None"}</span>
            </div>
            <button onClick={() => onLaunch(game, idx)} className="px-3 py-1.5 bg-teal-500 text-black text-xs font-bold rounded-lg hover:bg-teal-400 transition">
              Launch Puzzle
            </button>
          </div>
        );
      })}
    </div>
  );
});

const BlunderDrillPanel = React.memo(function BlunderDrillPanel({ puzzle, success, onExit }: { puzzle: any; success: boolean | null; onExit: () => void }) {
  return (
    <div className="p-6 bg-teal-950/40 border border-teal-500/30 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
      <div className="absolute right-4 top-4">
        <button onClick={onExit} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-foreground underline">Exit Puzzle</button>
      </div>
      <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
        <Brain className="w-4 h-4" />
        <span>BLUNDER DRILL PUZZLE</span>
      </div>
      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{puzzle.hint}</p>
      {success === true && <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold">🎉 Correct Move! Well done!</div>}
      {success === false && <div className="p-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-semibold">❌ Incorrect. Try again.</div>}
    </div>
  );
});
