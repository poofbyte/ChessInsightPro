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
