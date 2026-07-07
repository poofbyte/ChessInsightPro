import Dexie, { type Table } from "dexie";
import { Game, PlayerProfile, ConceptProgress } from "@chessinsight/types";

class ChessInsightDb extends Dexie {
  games!: Table<Game>;
  profiles!: Table<PlayerProfile>;
  learning!: Table<ConceptProgress>;

  constructor() {
    super("ChessInsightProDb");
    this.version(1).stores({
      games: "id, date, pgn, result",
      profiles: "playerId",
      learning: "conceptId, box, nextReviewDate"
    });
  }
}

export const db = new ChessInsightDb();
