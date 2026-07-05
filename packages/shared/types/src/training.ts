export interface Puzzle {
  id: string;
  initialFen: string;
  solutionMoves: string[]; // UCI moves
  hint: string;
  explanation?: string;
}

export interface ConceptProgress {
  conceptId: string;
  box: number; // Leitner box index (1 to 5)
  nextReviewDate: string; // ISO String
  correctStreak: number;
}

export interface PuzzleProvider {
  getDailyPuzzle(): Promise<Puzzle | null>;
  getCustomPuzzle(motif: string, difficulty: string): Promise<Puzzle | null>;
  validatePuzzleMove(puzzleId: string, uciMove: string, moveIndex: number): boolean;
}
