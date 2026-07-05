export interface Player {
  name: string;
  rating?: number;
}

export interface Move {
  moveIndex: number;
  san: string;
  uci: string;
  fenAfter: string;
  evaluation?: MoveEvaluation;
}

export interface Game {
  id: string;
  pgn: string;
  initialFen: string;
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white: Player;
  black: Player;
  result: string;
  termination?: string;
  timeControl?: string;
  moves: Move[];
  eval?: GameEval;
}

export interface GameRepository {
  getGame(id: string): Promise<Game | null>;
  saveGame(game: Game): Promise<void>;
  deleteGame(id: string): Promise<void>;
  getAllGames(): Promise<Game[]>;
}

import { MoveEvaluation, GameEval } from "./analysis";
