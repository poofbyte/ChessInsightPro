import { MoveClassification } from "@chessinsight/types";

export interface ClassificationContext {
  lastWinChance: number;
  currentWinChance: number;
  isWhiteMove: boolean;
  playedMoveUci: string;
  bestMoveUci?: string;
  isBookMove?: boolean;
  isForcedMove?: boolean;
  isSacrifice?: boolean;
  alternativeBestWinChance?: number; // Second best move win chance
}

export const classifyMove = (ctx: ClassificationContext): MoveClassification => {
  if (ctx.isBookMove) {
    return MoveClassification.Book;
  }

  if (ctx.isForcedMove) {
    return MoveClassification.Forced;
  }

  const winPercentageDiff = (ctx.currentWinChance - ctx.lastWinChance) * (ctx.isWhiteMove ? 1 : -1);

  // Brilliant check: A sacrifice that maintains/improves win chance and is not losing
  if (ctx.isSacrifice && winPercentageDiff >= -2) {
    const isLosing = ctx.isWhiteMove ? ctx.currentWinChance < 45 : ctx.currentWinChance > 55;
    if (!isLosing) {
      return MoveClassification.Brilliant;
    }
  }

  // Great check
  const hasChangedOutcome =
    winPercentageDiff > 10 &&
    ((ctx.lastWinChance < 50 && ctx.currentWinChance > 50) ||
      (ctx.lastWinChance > 50 && ctx.currentWinChance < 50));

  const isOnlyGoodMove =
    ctx.alternativeBestWinChance !== undefined &&
    (ctx.currentWinChance - ctx.alternativeBestWinChance) * (ctx.isWhiteMove ? 1 : -1) > 10;

  if ((hasChangedOutcome || isOnlyGoodMove) && winPercentageDiff >= -2) {
    return MoveClassification.Great;
  }

  // Best check
  if (ctx.bestMoveUci && ctx.playedMoveUci === ctx.bestMoveUci) {
    return MoveClassification.Best;
  }

  // Basic classifications based on win percentage change
  if (winPercentageDiff < -20) return MoveClassification.Blunder;
  if (winPercentageDiff < -10) return MoveClassification.Mistake;
  if (winPercentageDiff < -5) return MoveClassification.Inaccuracy;
  if (winPercentageDiff < -2) return MoveClassification.Good;
  return MoveClassification.Excellent;
};
