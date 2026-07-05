import { Game, GameEval, MoveEvaluation, LineEval, CoachStyle } from "@chessinsight/types";
import { parsePgn, getEvaluateGameParams, getIsPieceSacrifice } from "@chessinsight/chess-core";
import { StockfishWasmProvider } from "@chessinsight/engine";
import { getLineWinPercentage, fetchLichessCloudEval } from "@chessinsight/evaluator";
import { calculatePositionalMetrics } from "@chessinsight/positional";
import { detectTacticalMotifs } from "@chessinsight/tactical";
import { classifyMove } from "@chessinsight/classifier";
import { NarrativeGenerator } from "@chessinsight/narrative";
import { calculateGameAccuracy } from "@chessinsight/player-profile";

export const analyzeGame = async (
  game: Game,
  onProgress: (progress: number) => void
): Promise<GameEval> => {
  const engine = new StockfishWasmProvider("/engines/stockfish-17/stockfish-17-lite-single.js");
  await engine.initialize();

  const { fens, uciMoves } = getEvaluateGameParams(game.pgn);
  const totalPositions = fens.length;
  
  const positions: MoveEvaluation[] = [];
  const narrative = new NarrativeGenerator();

  // Offset 0 represents the starting position before move 1
  for (let i = 0; i < totalPositions; i++) {
    const fen = fens[i];
    let positionEval: Omit<MoveEvaluation, "narratives">;

    // Try cloud cache evaluation first to optimize execution speed
    const cloud = await fetchLichessCloudEval(fen, 2);
    if (cloud) {
      positionEval = {
        bestMove: cloud.bestMove,
        lines: cloud.lines,
        metrics: calculatePositionalMetrics(fen),
      };
    } else {
      // Fallback to local WASM Stockfish evaluation
      const lines = await engine.evaluatePosition(fen, 10, 2);
      positionEval = {
        bestMove: lines[0]?.pv[0] || "",
        lines: lines as LineEval[],
        metrics: calculatePositionalMetrics(fen),
      };
    }

    // Move quality classification and motifs detection
    let classification: any = undefined;
    let facts: any = undefined;

    if (i > 0) {
      const prevFen = fens[i - 1];
      const playedMove = uciMoves[i - 1];
      const prevEval = positions[i - 1];

      const lastWinChance = prevEval.lines[0] ? getLineWinPercentage(prevEval.lines[0]) : 50;
      const currentWinChance = positionEval.lines[0] ? getLineWinPercentage(positionEval.lines[0]) : 50;
      const isWhiteMove = i % 2 !== 0;

      // Identify tactical patterns
      const bestLinePv = positionEval.lines[0]?.pv || [];
      const tacticalMotifs = detectTacticalMotifs(prevFen, playedMove, fen, bestLinePv);
      const isSacrifice = tacticalMotifs.includes("Sacrifice");

      // Calculate second best move win chance
      const secondBestLine = prevEval.lines[1];
      const alternativeBestWinChance = secondBestLine ? getLineWinPercentage(secondBestLine) : undefined;

      // Basic indicators
      const isBookMove = false; // Simple placeholder
      const isForcedMove = false; // Placeholder

      classification = classifyMove({
        lastWinChance,
        currentWinChance,
        isWhiteMove,
        playedMoveUci: playedMove,
        bestMoveUci: prevEval.bestMove,
        isBookMove,
        isForcedMove,
        isSacrifice,
        alternativeBestWinChance,
      });

      // Construct facts for explanation generator
      facts = {
        moveType: classification,
        hangingPiece: tacticalMotifs.includes("HangingPiece"),
        tacticalMotifs,
        positionalFeatures: [],
        materialDelta: 0,
        initiativeChange: currentWinChance - lastWinChance > 10 ? "Gained" : currentWinChance - lastWinChance < -10 ? "Lost" : "Neutral",
        bestAlternativeMove: prevEval.bestMove,
      };
    }

    // Generate explanations for all available personalities
    const narratives: Record<string, string> = {
      [CoachStyle.Professional]: "",
      [CoachStyle.Friendly]: "",
      [CoachStyle.Beginner]: "",
      [CoachStyle.Roast]: "",
      [CoachStyle.Positional]: "",
      [CoachStyle.Tactical]: "",
      [CoachStyle.Minimal]: "",
    };

    if (facts) {
      for (const style of Object.values(CoachStyle)) {
        narratives[style] = await narrative.generate(facts, style);
      }
    }

    positions.push({
      ...positionEval,
      classification,
      facts,
      narratives,
    });

    onProgress(Math.round(((i + 1) / totalPositions) * 100));
  }

  // Terminate worker resources cleanly
  engine.terminate();

  const winChances = positions.map((pos) => {
    const firstLine = pos.lines[0];
    if (!firstLine) return 50;
    if (firstLine.mate !== undefined) return firstLine.mate > 0 ? 100 : 0;
    if (firstLine.cp !== undefined) return getLineWinPercentage(firstLine);
    return 50;
  });

  const accuracy = calculateGameAccuracy(winChances);

  return {
    positions,
    accuracy,
    settings: {
      engine: "Stockfish 17 WASM",
      depth: 10,
      multiPv: 2,
      date: new Date().toLocaleDateString(),
    },
  };
};
