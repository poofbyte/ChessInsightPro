import { WeaknessMotif } from "@chessinsight/types";

export interface StudyRecommendation {
  id: string;
  title: string;
  category: "Tactics" | "Positional" | "Openings" | "Endgames";
  motif: string;
  description: string;
  suggestedAction: string;
}

export class RecommendationEngine {
  static getRecommendations(weaknesses: WeaknessMotif[]): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];

    for (const w of weaknesses) {
      if (w.motif === "Fork") {
        recommendations.push({
          id: "rec-forks",
          title: "Spotting Forks and Double Attacks",
          category: "Tactics",
          motif: "Fork",
          description: "Learn how to use knights and queens to attack multiple unprotected targets simultaneously.",
          suggestedAction: "Solve 10 Knight Fork puzzles and complete the 'Double Attacks' tutorial.",
        });
      }

      if (w.motif === "Pin") {
        recommendations.push({
          id: "rec-pins",
          title: "Mastering Pins & Alignments",
          category: "Tactics",
          motif: "Pin",
          description: "Analyze how lining up pieces with the opponent's king or queen restricts their movement.",
          suggestedAction: "Complete the 'Relative vs Absolute Pins' lesson and practice diagonal alignments.",
        });
      }

      if (w.motif === "HangingPiece") {
        recommendations.push({
          id: "rec-hanging",
          title: "Board Vision & Defending Pieces",
          category: "Positional",
          motif: "HangingPiece",
          description: "Train your board vision to spot undefended squares and secure loose pieces.",
          suggestedAction: "Run the 'Hanging Pieces Check' before playing your moves in game reviews.",
        });
      }

      if (w.motif === "TrappedPiece") {
        recommendations.push({
          id: "rec-trapped",
          title: "Piece Activity and Escape Routes",
          category: "Positional",
          motif: "TrappedPiece",
          description: "Learn how to retain active piece positions and avoid enclosing your own bishops or knights.",
          suggestedAction: "Study the 'Trapped Pieces: Bishop Traps in the Opening' interactive lesson.",
        });
      }
    }

    // Default recommendations if no specific weaknesses are flagged yet
    if (recommendations.length === 0) {
      recommendations.push({
        id: "rec-default-openings",
        title: "Opening Principles",
        category: "Openings",
        motif: "Opening",
        description: "Study basic concepts: control the center, develop active pieces, and secure the king early.",
        suggestedAction: "Study standard openings and review your first 10 book moves.",
      });

      recommendations.push({
        id: "rec-default-endgames",
        title: "Basic King and Pawn Endgames",
        category: "Endgames",
        motif: "Endgame",
        description: "Master the rules of opposition and pawn promotion keys.",
        suggestedAction: "Complete the 'King Opposition' endgame drill.",
      });
    }

    return recommendations;
  }
}
