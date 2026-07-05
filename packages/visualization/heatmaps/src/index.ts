import { Game } from "@chessinsight/types";

export class HeatmapCalculator {
  static getBlunderHeatmap(games: Game[]): Record<string, number> {
    const heatmap: Record<string, number> = {};

    for (const game of games) {
      for (const move of game.moves) {
        if (
          move.evaluation?.classification === "blunder" ||
          move.evaluation?.classification === "mistake"
        ) {
          const targetSquare = move.uci.slice(2, 4);
          if (targetSquare) {
            heatmap[targetSquare] = (heatmap[targetSquare] || 0) + 1;
          }
        }
      }
    }

    return heatmap;
  }

  static getMoveDensityHeatmap(games: Game[]): Record<string, number> {
    const heatmap: Record<string, number> = {};

    for (const game of games) {
      for (const move of game.moves) {
        const targetSquare = move.uci.slice(2, 4);
        if (targetSquare) {
          heatmap[targetSquare] = (heatmap[targetSquare] || 0) + 1;
        }
      }
    }

    return heatmap;
  }
}
