export class PuzzleRatingService {
  /**
   * Calculates the Elo change for a puzzle attempt based on the exact business rules.
   *
   * @param isSolved Whether the puzzle was ultimately solved.
   * @param hintsUsed The number of hints the user consumed.
   * @param mistakes The number of wrong moves made during the attempt.
   * @returns The calculated net Elo change.
   */
  static calculateEloChange(
    isSolved: boolean,
    hintsUsed: number,
    mistakes: number
  ): number {
    let eloChange = 0;
    const mistakePenalty = mistakes * 2;

    if (isSolved) {
      const baseReward = 10;
      let hintPenalty = 0;
      
      if (hintsUsed === 0) {
        hintPenalty = 0;
      } else if (hintsUsed === 1) {
        hintPenalty = 8;
      } else if (hintsUsed === 2) {
        hintPenalty = 10;
      } else {
        hintPenalty = 15;
      }

      eloChange = baseReward - hintPenalty - mistakePenalty;
    } else {
      // Failed puzzles always result in a -10 penalty
      eloChange = -10;
    }

    return eloChange;
  }

  /**
   * Calculates the new Elo given the current Elo and the change,
   * enforcing the global minimum floor.
   */
  static calculateNewElo(currentElo: number, eloChange: number): number {
    const MIN_ELO = 100;
    return Math.max(MIN_ELO, currentElo + eloChange);
  }
}
