import { ConceptProgress } from "@chessinsight/types";

export class SpacedRepetitionManager {
  static getBoxIntervalDays(box: number): number {
    switch (box) {
      case 1: return 1;
      case 2: return 3;
      case 3: return 7;
      case 4: return 14;
      case 5: return 30;
      default: return 1;
    }
  }

  static updateConceptProgress(progress: ConceptProgress, correct: boolean): ConceptProgress {
    let nextBox = progress.box;
    let nextStreak = progress.correctStreak;

    if (correct) {
      nextStreak++;
      if (nextBox < 5) {
        nextBox++;
      }
    } else {
      nextStreak = 0;
      nextBox = 1;
    }

    const intervalDays = this.getBoxIntervalDays(nextBox);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);

    return {
      conceptId: progress.conceptId,
      box: nextBox,
      correctStreak: nextStreak,
      nextReviewDate: nextReview.toISOString(),
    };
  }

  static createInitialProgress(conceptId: string): ConceptProgress {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 1); // Review tomorrow

    return {
      conceptId,
      box: 1,
      correctStreak: 0,
      nextReviewDate: nextReview.toISOString(),
    };
  }
}
