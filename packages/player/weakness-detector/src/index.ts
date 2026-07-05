import { Game, WeaknessMotif, TacticalMotif } from "@chessinsight/types";

export class WeaknessDetector {
  static detectWeaknesses(games: Game[]): WeaknessMotif[] {
    const motifCounts: Record<TacticalMotif, number> = {
      Fork: 0,
      Pin: 0,
      Skewer: 0,
      HangingPiece: 0,
      DiscoveredAttack: 0,
      DoubleCheck: 0,
      TrappedPiece: 0,
      MateThreat: 0,
      Sacrifice: 0,
      Deflection: 0,
      Decoy: 0,
      MatingNet: 0,
      Clearance: 0,
    };

    for (const game of games) {
      for (const move of game.moves) {
        if (move.evaluation?.facts) {
          const { moveType, tacticalMotifs } = move.evaluation.facts;
          // Track motifs when the move is a mistake, blunder, or inaccuracy
          if (
            moveType === "blunder" ||
            moveType === "mistake" ||
            moveType === "inaccuracy"
          ) {
            for (const motif of tacticalMotifs) {
              if (motifCounts[motif] !== undefined) {
                motifCounts[motif]++;
              }
            }
          }
        }
      }
    }

    const weaknesses: WeaknessMotif[] = [];
    const threshold = 3;

    if (motifCounts.Fork >= threshold) {
      weaknesses.push({
        motif: "Fork",
        count: motifCounts.Fork,
        description: `You frequently overlook double-attack fork opportunities or threats. Pay closer attention to knights and queens attacking multiple targets.`,
      });
    }

    if (motifCounts.Pin >= threshold) {
      weaknesses.push({
        motif: "Pin",
        count: motifCounts.Pin,
        description: `You struggle with pinned pieces. Watch out for alignments along diagonals or files leading to your king or queen.`,
      });
    }

    if (motifCounts.HangingPiece >= threshold) {
      weaknesses.push({
        motif: "HangingPiece",
        count: motifCounts.HangingPiece,
        description: `You leave pieces undefended too often. Double-check that your destination squares are safe and guarded.`,
      });
    }

    if (motifCounts.TrappedPiece >= threshold) {
      weaknesses.push({
        motif: "TrappedPiece",
        count: motifCounts.TrappedPiece,
        description: `You let your active pieces get trapped. Always verify that your active pieces have escape squares.`,
      });
    }

    if (motifCounts.DiscoveredAttack >= threshold) {
      weaknesses.push({
        motif: "DiscoveredAttack",
        count: motifCounts.DiscoveredAttack,
        description: `You overlook discovered attacks from sliding pieces when a blocking piece moves.`,
      });
    }

    return weaknesses.sort((a, b) => b.count - a.count);
  }
}
