"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Game, Move, MoveClassification, CoachStyle, PlayerProfile } from "@chessinsight/types";
import { parsePgn, Chess } from "@chessinsight/chess-core";
import { useChessStore } from "./store";
import { analyzeGame } from "./pipeline";
import { db } from "./db";
import { estimateElo, calculateGameAccuracy, initializeProfile, updateProfileWithGame } from "@chessinsight/player-profile";
import { WeaknessDetector } from "@chessinsight/weakness-detector";
import { RecommendationEngine } from "@chessinsight/recommendations";
import { BlunderPuzzleGenerator } from "@chessinsight/puzzles";
import { SpacedRepetitionManager } from "@chessinsight/learning";
import { VisualizationFormatter } from "@chessinsight/charts";
import { getLineWinPercentage } from "@chessinsight/evaluator";
import {
  Brain,
  History,
  BookOpen,
  Award,
  AlertTriangle,
  Sparkles,
  Upload,
  RefreshCw,
  Compass,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Load chessboard dynamically to bypass SSR window checks
const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

// Load line chart dynamically
const GameLineChart = dynamic(
  () => import("../components/GameLineChart"),
  { ssr: false }
);

const resolvePgnFromUrl = async (input: string): Promise<string> => {
  const trimmed = input.trim();
  
  // 1. Lichess Game URL
  // e.g. https://lichess.org/aBcDeFgH or https://lichess.org/aBcDeFgH/black
  const lichessRegex = /lichess\.org\/([a-zA-Z0-9]{8})/i;
  const lichessMatch = trimmed.match(lichessRegex);
  if (lichessMatch) {
    const gameId = lichessMatch[1];
    const res = await fetch(`https://lichess.org/game/export/${gameId}?clocks=true&evals=false`);
    if (!res.ok) {
      throw new Error(`Failed to fetch game from Lichess. Status: ${res.status}`);
    }
    return await res.text();
  }

  // 2. Chess.com Game URL
  // e.g. https://www.chess.com/game/live/144971919130 or https://www.chess.com/game/daily/144971919130
  const chessComRegex = /chess\.com\/game\/(live|daily)\/(\d+)/i;
  const chessComMatch = trimmed.match(chessComRegex);
  if (chessComMatch) {
    const type = chessComMatch[1].toLowerCase();
    const gameId = chessComMatch[2];
    
    // Call the callback to get usernames and game date
    const callbackUrl = `https://www.chess.com/callback/${type}/game/${gameId}`;
    const corsProxyUrl = (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`;
    
    let callbackRes;
    try {
      callbackRes = await fetch(corsProxyUrl(callbackUrl));
    } catch {
      // Fallback
      callbackRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(callbackUrl)}`);
    }

    if (!callbackRes.ok) {
      throw new Error(`Failed to retrieve Chess.com metadata. Status: ${callbackRes.status}`);
    }

    const gameData = await callbackRes.json();
    const whitePlayer = gameData?.game?.pgnHeaders?.White || gameData?.game?.pgnHeaders?.Black;
    const dateStr = gameData?.game?.pgnHeaders?.Date;
    
    if (!whitePlayer || !dateStr) {
      throw new Error("Unable to retrieve player metadata from Chess.com game page.");
    }

    const [year, month] = dateStr.split(".");
    const archiveUrl = `https://api.chess.com/pub/player/${whitePlayer}/games/${year}/${month}`;
    
    let archiveRes;
    try {
      // Try direct fetch first since api.chess.com supports CORS natively and avoids proxy payload limits (e.g. 413)
      archiveRes = await fetch(archiveUrl);
      if (!archiveRes.ok) {
        throw new Error(`Direct fetch returned status ${archiveRes.status}`);
      }
    } catch {
      try {
        archiveRes = await fetch(corsProxyUrl(archiveUrl));
      } catch {
        archiveRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(archiveUrl)}`);
      }
    }

    if (!archiveRes.ok) {
      throw new Error(`Failed to fetch Chess.com player monthly archives. Status: ${archiveRes.status}`);
    }

    const archiveData = await archiveRes.json();
    const games = archiveData?.games || [];
    
    const targetGame = games.find((g: any) => g.url.includes(gameId) || g.pgn?.includes(gameId));
    if (!targetGame || !targetGame.pgn) {
      throw new Error(`Game ${gameId} not found in player archives for ${year}/${month}.`);
    }

    return targetGame.pgn;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    throw new Error("Unsupported URL. Please paste a valid Chess.com or Lichess game URL.");
  }

  return input;
};

export default function Home() {
  const store = useChessStore();
  const [pgnInput, setPgnInput] = useState("");
  const [historicalGames, setHistoricalGames] = useState<Game[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<"reviews" | "profile" | "leitner">("reviews");
  const [showUploader, setShowUploader] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Leitner state
  const [leitnerBox, setLeitnerBox] = useState<any[]>([]);

  // Puzzle state
  const [activePuzzle, setActivePuzzle] = useState<any | null>(null);
  const [puzzleGame, setPuzzleGame] = useState<Chess | null>(null);
  const [puzzleMoveIdx, setPuzzleMoveIdx] = useState(0);
  const [puzzleSuccess, setPuzzleSuccess] = useState<boolean | null>(null);

  // Keyboard navigation setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (store.game && !showUploader && !activePuzzle) {
        if (e.key === "ArrowRight") {
          const next = Math.min(store.currentMoveIndex + 1, store.game.moves.length);
          store.setCurrentMoveIndex(next);
        } else if (e.key === "ArrowLeft") {
          const prev = Math.max(0, store.currentMoveIndex - 1);
          store.setCurrentMoveIndex(prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store.game, store.currentMoveIndex, showUploader, activePuzzle]);

  // Load initial data from Dexie
  const loadDatabaseData = async () => {
    const games = await db.games.reverse().toArray();
    setHistoricalGames(games);

    let prof = await db.profiles.get("default-user");
    if (!prof) {
      prof = initializeProfile("default-user");
      await db.profiles.put(prof);
    }

    // Refresh weakness analysis dynamically
    if (games.length > 0) {
      prof.detectedWeaknesses = WeaknessDetector.detectWeaknesses(games);
    }
    setProfile(prof);

    // Load Leitner spaced cards
    const cards = await db.learning.toArray();
    setLeitnerBox(cards);
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const handlePgnAnalyze = async () => {
    if (!pgnInput.trim()) return;
    setErrorMsg("");
    store.setIsAnalyzing(true);
    store.setAnalysisProgress(0);

    try {
      // Resolve PGN from URL if applicable
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

      // Run orchestrator pipeline
      const analysisResult = await analyzeGame(newGame, (progress) => {
        store.setAnalysisProgress(progress);
      });

      // Map evaluations back to move models
      newGame.moves = newGame.moves.map((move, index) => ({
        ...move,
        evaluation: analysisResult.positions[index + 1],
      }));
      newGame.eval = analysisResult;

      // Persist Game to database
      await db.games.put(newGame);

      // Update Player Profile stats
      if (profile) {
        const winChances = analysisResult.positions.map((pos) => {
          const firstLine = pos.lines[0];
          if (!firstLine) return 50;
          if (firstLine.mate !== undefined) return firstLine.mate > 0 ? 100 : 0;
          return getLineWinPercentage(firstLine);
        });
        const accuracies = calculateGameAccuracy(winChances);
        
        const avgCpl = 35; 
        const updatedProf = updateProfileWithGame(
          profile,
          accuracies.white,
          avgCpl,
          parsed.headers.ECO,
          accuracies.white
        );

        // Scan and update Leitner box scheduled tasks if player struggled with motifs
        const weaknesses = WeaknessDetector.detectWeaknesses([newGame]);
        for (const w of weaknesses) {
          let card = await db.learning.get(w.motif);
          if (!card) {
            card = SpacedRepetitionManager.createInitialProgress(w.motif);
          } else {
            card = SpacedRepetitionManager.updateConceptProgress(card, false);
          }
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
        puzzleGame.move({ from, to, promotion });
        setPuzzleSuccess(true);

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
        return false;
      }
    } catch {
      return false;
    }
  };

  const getEvalScoreText = (): { score: string; percent: number; isWhiteAhead: boolean } => {
    if (!store.game) return { score: "0.0", percent: 50, isWhiteAhead: true };
    const currentMove = store.game.moves[store.currentMoveIndex - 1];
    const posEval = currentMove?.evaluation || store.game.eval?.positions[0];

    if (!posEval || !posEval.lines || !posEval.lines[0]) {
      return { score: "0.0", percent: 50, isWhiteAhead: true };
    }

    const line = posEval.lines[0];
    if (line.mate !== undefined) {
      return {
        score: `M${Math.abs(line.mate)}`,
        percent: line.mate > 0 ? 100 : 0,
        isWhiteAhead: line.mate > 0,
      };
    }

    if (line.cp !== undefined) {
      const scoreNum = line.cp / 100;
      const rounded = scoreNum.toFixed(1);
      const val = scoreNum > 0 ? `+${rounded}` : rounded;
      
      const percent = Math.min(Math.max(50 + scoreNum * 10, 5), 95);
      return {
        score: val,
        percent,
        isWhiteAhead: scoreNum >= 0,
      };
    }

    return { score: "0.0", percent: 50, isWhiteAhead: true };
  };

  const evalState = getEvalScoreText();

  const chartsData = store.game && store.game.eval
    ? VisualizationFormatter.formatTimeline(store.game, store.game.eval)
    : [];

  const getActivePositionalMetrics = () => {
    if (!store.game) return null;
    const currentMove = store.game.moves[store.currentMoveIndex - 1];
    return currentMove?.evaluation?.metrics || store.game.eval?.positions[0]?.metrics || null;
  };

  const currentMetrics = getActivePositionalMetrics();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1d] text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0d1326] flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg">ChessInsight</h1>
            <span className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Pro v2.0</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => {
              setCurrentTab("reviews");
              setActivePuzzle(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentTab === "reviews"
                ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-300 border-l-4 border-teal-500 font-medium"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <History className="w-5 h-5" />
            <span>Game Reviewer</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab("profile");
              setActivePuzzle(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentTab === "profile"
                ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-300 border-l-4 border-teal-500 font-medium"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <Award className="w-5 h-5" />
            <span>Player Analytics</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab("leitner");
              setActivePuzzle(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentTab === "leitner"
                ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-300 border-l-4 border-teal-500 font-medium"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Spaced Learning</span>
          </button>
        </nav>

        {/* ELO Profile Badge */}
        {profile && (
          <div className="p-4 m-4 rounded-2xl glass-panel border border-teal-500/20 text-center">
            <span className="text-xs text-teal-400 font-bold uppercase tracking-widest">Estimated ELO</span>
            <div className="text-3xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              {profile.estimatedElo}
            </div>
            <div className="text-xs text-slate-400 mt-1">Games analyzed: {profile.gamesPlayed}</div>
          </div>
        )}
      </aside>

      {/* Main Panel Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-800/80 bg-[#0d1326]/60 backdrop-blur-md px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-semibold text-slate-300">
              {currentTab === "reviews" ? "Interactive Board & AI Analysis" : currentTab === "profile" ? "Error Weakness Profiler" : "Leitner Concept Box"}
            </h2>
          </div>

          {currentTab === "reviews" && (
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-black font-semibold rounded-xl shadow-lg shadow-teal-500/20 transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              <span>Import PGN</span>
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#0a0f1d]">
          {currentTab === "reviews" && (
            <>
              {store.game ? (
                <div className="grid grid-cols-12 gap-8 h-full max-w-[1600px] mx-auto">
                  <div className="col-span-7 flex flex-col gap-6">
                    <div className="flex gap-4">
                      {/* Interactive Win-Percentage Eval Bar */}
                      <div className="w-8 bg-slate-800 rounded-full overflow-hidden flex flex-col relative border border-slate-700/50 shadow-inner">
                        <div
                          className="bg-white transition-all duration-500 ease-out flex items-end justify-center pb-2 text-[10px] text-black font-black"
                          style={{ height: `${evalState.percent}%` }}
                        >
                          {evalState.isWhiteAhead ? evalState.score : ""}
                        </div>
                        <div className="flex-1 bg-neutral-950 flex items-start justify-center pt-2 text-[10px] text-white font-black">
                          {!evalState.isWhiteAhead ? evalState.score : ""}
                        </div>
                      </div>

                      {/* Chessboard container */}
                      <div className="flex-1 aspect-square max-w-[640px] board-container rounded-2xl overflow-hidden border border-slate-800/80">
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

                    <div className="flex justify-between items-center glass-panel p-4 rounded-2xl border border-slate-800">
                      <button
                        onClick={store.toggleBoardOrientation}
                        className="px-4 py-2 hover:bg-slate-800/80 rounded-xl transition text-slate-300 text-sm font-semibold flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Flip Board</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          disabled={store.currentMoveIndex === 0}
                          onClick={() => store.setCurrentMoveIndex(Math.max(0, store.currentMoveIndex - 1))}
                          className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          disabled={store.currentMoveIndex === (store.game?.moves?.length || 0)}
                          onClick={() => store.setCurrentMoveIndex(Math.min(store.currentMoveIndex + 1, store.game?.moves?.length || 0))}
                          className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {activePuzzle && (
                      <div className="p-6 bg-teal-950/40 border border-teal-500/30 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                        <div className="absolute right-4 top-4">
                          <button
                            onClick={() => setActivePuzzle(null)}
                            className="text-xs font-bold text-slate-400 hover:text-white underline"
                          >
                            Exit Puzzle
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                          <Brain className="w-4 h-4" />
                          <span>BLUNDER DRILL PUZZLE</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{activePuzzle.hint}</p>

                        {puzzleSuccess === true && (
                          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold">
                            🎉 Correct Move! Well done!
                          </div>
                        )}
                        {puzzleSuccess === false && (
                          <div className="p-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-semibold flex justify-between items-center">
                            <span>❌ Incorrect. Try again!</span>
                            <button
                              onClick={() => {
                                setPuzzleGame(new Chess(activePuzzle.initialFen));
                                setPuzzleMoveIdx(0);
                                setPuzzleSuccess(null);
                              }}
                              className="text-xs underline font-bold"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-span-5 flex flex-col gap-6 h-full overflow-hidden">
                    <div className="p-6 glass-panel border border-slate-800/80 rounded-2xl">
                      <h3 className="font-black text-lg truncate">
                        {store.game.white.name} vs {store.game.black.name}
                      </h3>
                      <div className="text-xs text-slate-400 mt-1 flex justify-between items-center">
                        <span>Date: {store.game.date}</span>
                        <span className="font-bold text-teal-400">{store.game.result}</span>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-b from-[#11182c] to-[#0a0f1d] border border-teal-500/20 rounded-2xl shadow-xl flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-teal-400" />
                          <span className="text-sm font-bold text-teal-300">Virtual Coach Explanation</span>
                        </div>

                        <select
                          value={store.coachStyle}
                          onChange={(e) => store.setCoachStyle(e.target.value as CoachStyle)}
                          className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none"
                        >
                          <option value={CoachStyle.Friendly}>Friendly Coach</option>
                          <option value={CoachStyle.Professional}>Professional Coach</option>
                          <option value={CoachStyle.Beginner}>Beginner Coach</option>
                          <option value={CoachStyle.Roast}>Roast Coach</option>
                          <option value={CoachStyle.Positional}>Positional Coach</option>
                          <option value={CoachStyle.Tactical}>Tactical Coach</option>
                          <option value={CoachStyle.Minimal}>Minimal Coach</option>
                        </select>
                      </div>

                      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl min-h-[96px] text-sm text-slate-300 leading-relaxed shadow-inner">
                        {store.currentMoveIndex === 0 ? (
                          <p className="italic text-slate-400">Starting position. Play moves to hear explanations from the coach.</p>
                        ) : (
                          store.game.moves[store.currentMoveIndex - 1]?.evaluation?.narratives?.[store.coachStyle] || (
                            <p className="italic text-slate-400">Loading analysis explanation...</p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1326]/60 border border-slate-800/80 rounded-2xl">
                      <div className="grid grid-cols-4 border-b border-slate-800/80 text-xs font-bold text-center">
                        <button
                          onClick={() => store.setActiveTab(0)}
                          className={`py-3 transition ${store.activeTab === 0 ? "border-b-2 border-teal-500 text-teal-400 bg-slate-800/20" : "text-slate-400 hover:text-white"}`}
                        >
                          Move Log
                        </button>
                        <button
                          onClick={() => store.setActiveTab(1)}
                          className={`py-3 transition ${store.activeTab === 1 ? "border-b-2 border-teal-500 text-teal-400 bg-slate-800/20" : "text-slate-400 hover:text-white"}`}
                        >
                          Charts
                        </button>
                        <button
                          onClick={() => store.setActiveTab(2)}
                          className={`py-3 transition ${store.activeTab === 2 ? "border-b-2 border-teal-500 text-teal-400 bg-slate-800/20" : "text-slate-400 hover:text-white"}`}
                        >
                          Metrics
                        </button>
                        <button
                          onClick={() => store.setActiveTab(3)}
                          className={`py-3 transition ${store.activeTab === 3 ? "border-b-2 border-teal-500 text-teal-400 bg-slate-800/20" : "text-slate-400 hover:text-white"}`}
                        >
                          Puzzles
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        {store.activeTab === 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {store.game.moves.map((move, idx) => {
                              const isWhite = idx % 2 === 0;
                              const moveNumber = Math.floor(idx / 2) + 1;
                              const isSelected = store.currentMoveIndex === idx + 1;
                              
                              let colorClass = "bg-slate-900/40 border border-transparent";
                              if (isSelected) {
                                colorClass = "bg-teal-500/20 border border-teal-500/40 text-teal-300";
                              } else if (move.evaluation?.classification === "blunder") {
                                colorClass = "bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400";
                              } else if (move.evaluation?.classification === "mistake") {
                                colorClass = "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400";
                              }

                              return (
                                <button
                                  key={move.moveIndex}
                                  onClick={() => store.setCurrentMoveIndex(idx + 1)}
                                  className={`p-3 rounded-xl text-left flex justify-between items-center transition ${colorClass}`}
                                >
                                  <span className="font-semibold text-sm">
                                    {isWhite ? `${moveNumber}. ` : ""}{move.san}
                                  </span>
                                  {move.evaluation?.classification && (
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800">
                                      {move.evaluation.classification}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {store.activeTab === 1 && (
                          <GameLineChart data={chartsData} />
                        )}

                        {store.activeTab === 2 && currentMetrics && (
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Development Speed</span>
                                <span className="font-semibold text-white">{currentMetrics.development[0]} vs {currentMetrics.development[1]}</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="bg-blue-500 h-full" style={{ width: `${(currentMetrics.development[0] / 8) * 100}%` }}></div>
                                <div className="bg-red-500 h-full flex-1"></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Mobility</span>
                                <span className="font-semibold text-white">{currentMetrics.mobility[0]} vs {currentMetrics.mobility[1]}</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="bg-blue-500 h-full" style={{ width: `${(currentMetrics.mobility[0] / Math.max(1, currentMetrics.mobility[0] + currentMetrics.mobility[1])) * 100}%` }}></div>
                                <div className="bg-red-500 h-full flex-1"></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Board Tension</span>
                                <span className="font-semibold text-white">{currentMetrics.tension[0]} vs {currentMetrics.tension[1]}</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="bg-blue-500 h-full" style={{ width: `${(currentMetrics.tension[0] / Math.max(1, currentMetrics.tension[0] + currentMetrics.tension[1])) * 100}%` }}></div>
                                <div className="bg-red-500 h-full flex-1"></div>
                              </div>
                            </div>
                          </div>
                        )}

                        {store.activeTab === 3 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Blunder Repetitions</h4>
                            {store.game.moves.filter(m => m.evaluation?.classification === "blunder").length === 0 ? (
                              <p className="text-sm text-slate-500 italic text-center py-6">Congrats! You made no blunders this game.</p>
                            ) : (
                              store.game.moves.map((move, idx) => {
                                if (move.evaluation?.classification !== "blunder") return null;
                                return (
                                  <div key={move.moveIndex} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                                    <div>
                                      <span className="text-sm font-semibold">Move {move.moveIndex}: {move.san}</span>
                                      <span className="text-[10px] block text-slate-400 mt-0.5">Motifs: {move.evaluation.facts?.tacticalMotifs.join(", ") || "None"}</span>
                                    </div>
                                    <button
                                      onClick={() => launchPuzzle(store.game!, idx)}
                                      className="px-3 py-1.5 bg-teal-500 text-black text-xs font-bold rounded-lg hover:bg-teal-400 transition"
                                    >
                                      Launch Puzzle
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 max-w-2xl mx-auto">
                  <div className="p-6 bg-slate-850 rounded-full text-teal-400 border border-teal-500/20 mb-6">
                    <Compass className="w-16 h-16 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black mb-2">No Active Game Loaded</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    To start analyzing, import a game by uploading a PGN database file, pasting raw movements history data, or select a previously analyzed game from the history list below.
                  </p>

                  <div className="w-full glass-panel p-6 rounded-2xl border border-slate-850">
                    <h4 className="text-left text-xs font-bold text-teal-400 uppercase tracking-widest mb-4">Analyzed Games Logs</h4>
                    {historicalGames.length === 0 ? (
                      <p className="text-slate-500 text-sm italic py-4">No previously reviewed games logs found in database.</p>
                    ) : (
                      <div className="space-y-2">
                        {historicalGames.slice(0, 5).map((g) => (
                          <button
                            key={g.id}
                            onClick={() => store.setGame(g)}
                            className="w-full p-4 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-850 hover:border-teal-500/30 rounded-xl transition text-left flex justify-between items-center"
                          >
                            <div>
                              <span className="font-bold text-sm block">{g.white.name} vs {g.black.name}</span>
                              <span className="text-xs text-slate-400 mt-0.5 block">{g.date}</span>
                            </div>
                            <span className="text-xs font-bold text-teal-400">{g.result}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {currentTab === "profile" && profile && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="p-6 bg-gradient-to-r from-[#11182c] to-[#0a0f1d] border border-slate-800 rounded-2xl">
                <h3 className="text-2xl font-black mb-1">Historic Performance & Weaknesses</h3>
                <p className="text-slate-400 text-sm">Your error profiler analyzes blunders across games to extract patterns and weaknesses.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Personalized Study Program</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {RecommendationEngine.getRecommendations(profile.detectedWeaknesses).map((rec) => (
                    <div key={rec.id} className="p-6 bg-[#0d1326] border border-slate-800 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800">{rec.category}</span>
                          <span className="text-xs text-slate-500">Motif: {rec.motif}</span>
                        </div>
                        <h4 className="font-bold text-base text-slate-200 mb-1">{rec.title}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">{rec.description}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-300 font-semibold italic">
                        🎯 Suggested: {rec.suggestedAction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Identified Weaknesses</h4>
                {profile.detectedWeaknesses.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-850 rounded-2xl italic text-sm">
                    No critical weaknesses detected yet. Play more games or check your blunder repetitions list.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.detectedWeaknesses.map((w) => (
                      <div key={w.motif} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-rose-400">{w.motif} Warnings ({w.count} times)</span>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{w.description}</p>
                        </div>
                        <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === "leitner" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="p-6 bg-gradient-to-r from-[#11182c] to-[#0a0f1d] border border-slate-800 rounded-2xl">
                <h3 className="text-2xl font-black mb-1">Leitner Concept Progression</h3>
                <p className="text-slate-400 text-sm">Review your tactical motifs scheduled on spaced intervals.</p>
              </div>

              {leitnerBox.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-850 rounded-2xl italic text-sm">
                  No concepts mapped to Leitner boxes yet. Once weaknesses are detected, card schedulers will populate here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leitnerBox.map((card) => {
                    const diffDays = Math.ceil((new Date(card.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={card.conceptId} className="p-6 bg-[#0d1326] border border-slate-800 rounded-2xl flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black uppercase text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">Box {card.box}</span>
                            <span className="text-xs text-slate-400">Streak: {card.correctStreak}🔥</span>
                          </div>
                          <h4 className="font-bold text-lg mb-1">{card.conceptId} Concept Review</h4>
                          <p className="text-sm text-slate-400">Next review date: {new Date(card.nextReviewDate).toLocaleDateString()}</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-850 flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-500">
                            {diffDays <= 0 ? "Review Ready! 🎯" : `Due in ${diffDays} days`}
                          </span>
                          <button
                            onClick={() => {
                              db.learning.put(SpacedRepetitionManager.updateConceptProgress(card, true)).then(loadDatabaseData);
                            }}
                            className="px-3 py-1.5 bg-slate-800 text-teal-400 text-xs font-bold rounded-lg hover:bg-slate-700 transition"
                          >
                            Mark Reviewed
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* PGN UPLOADER MODAL DIALOG */}
      {showUploader && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#0d1326] border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
            <div className="absolute right-6 top-6">
              <button
                onClick={() => setShowUploader(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="text-xl font-bold mb-2">Import Chess Game PGN</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Paste the PGN text containing the headers and moves list to trigger Stockfish 17 review pipeline.
            </p>

            <textarea
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              placeholder={`[Event "Casual Game"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6...`}
              className="w-full h-40 bg-[#0a0f1d] border border-slate-800 focus:border-teal-500 rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none font-mono tracking-wide leading-relaxed mb-4 shadow-inner"
            />

            {errorMsg && <p className="text-rose-400 text-xs font-bold mb-4">{errorMsg}</p>}

            {store.isAnalyzing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-teal-400">
                  <span>Stockfish 17 is evaluating positions...</span>
                  <span>{store.analysisProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${store.analysisProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handlePgnAnalyze}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-black font-black text-sm rounded-xl transition"
              >
                Start Analysis
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
