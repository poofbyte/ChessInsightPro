import { Game, Puzzle } from "@chessinsight/types";

export class BlunderPuzzleGenerator {
  static generatePuzzleFromBlunder(game: Game, blunderMoveIndex: number): Puzzle | null {
    const blunderMove = game.moves[blunderMoveIndex];
    if (!blunderMove || !blunderMove.evaluation) return null;

    const positionBeforeMove = game.moves[blunderMoveIndex - 1];
    const initialFen = positionBeforeMove ? positionBeforeMove.fenAfter : game.initialFen;

    const bestMove = blunderMove.evaluation.bestMove;
    if (!bestMove) return null;

    const playedSan = blunderMove.san;
    const motifs = blunderMove.evaluation.facts?.tacticalMotifs || [];
    const motifStr = motifs.length > 0 ? ` (involving ${motifs.join(", ")})` : "";

    return {
      id: `blunder-${game.id}-${blunderMoveIndex}`,
      initialFen,
      solutionMoves: [bestMove],
      hint: `In the game, you played ${playedSan}, which was classified as a blunder${motifStr}. Find the best alternative move in this position!`,
      explanation: blunderMove.evaluation.explanation || "Locate the stronger tactical or positional continuation that preserves your win chances.",
    };
  }
}
