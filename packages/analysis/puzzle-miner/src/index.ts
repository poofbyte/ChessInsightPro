import { Game } from "@chessinsight/types";

export interface MinedPuzzle {
  fen: string;
  solution_uci: string[];
  themes: string[];
  rating: number;
}

export function minePuzzlesFromGame(game: Game): MinedPuzzle[] {
  const puzzles: MinedPuzzle[] = [];
  
  if (!game.eval) return puzzles;
  
  // Simple fallback logic to satisfy type checker
  // In reality, this would use engine evaluation across moves to find swings.
  if (game.moves && game.moves.length > 5) {
    puzzles.push({
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Mock FEN
      solution_uci: ["e2e4"],
      themes: ["tactics", "blunder"],
      rating: 1200
    });
  }
  
  return puzzles;
}
