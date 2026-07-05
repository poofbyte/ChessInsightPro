import { Game, GameEval } from "@chessinsight/types";

export interface RechartsTimelinePoint {
  moveIndex: number;
  playedMove: string;
  eval: number; // Centipawn evaluation or mate scale
  whiteControl: number;
  blackControl: number;
  whiteMobility: number;
  blackMobility: number;
  whiteTension: number;
  blackTension: number;
}

export class VisualizationFormatter {
  static formatTimeline(game: Game, evaluation: GameEval): RechartsTimelinePoint[] {
    const points: RechartsTimelinePoint[] = [];

    game.moves.forEach((move, index) => {
      // offset by 1 because index 0 is initial FEN position
      const posEval = evaluation.positions[index + 1];

      let evalScore = 0;
      if (posEval && posEval.lines && posEval.lines[0]) {
        const line = posEval.lines[0];
        if (line.mate !== undefined) {
          evalScore = line.mate > 0 ? 10 : -10; // Mate scale cap
        } else if (line.cp !== undefined) {
          evalScore = parseFloat((line.cp / 100).toFixed(2));
        }
      }

      const metrics = posEval?.metrics;

      points.push({
        moveIndex: index + 1,
        playedMove: move.san,
        eval: evalScore,
        whiteControl: metrics?.control[0] || 0,
        blackControl: metrics?.control[1] || 0,
        whiteMobility: metrics?.mobility[0] || 0,
        blackMobility: metrics?.mobility[1] || 0,
        whiteTension: metrics?.tension[0] || 0,
        blackTension: metrics?.tension[1] || 0,
      });
    });

    return points;
  }
}
