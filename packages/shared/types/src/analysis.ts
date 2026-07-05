export enum MoveClassification {
  Brilliant = "brilliant",
  Great = "great",
  Best = "best",
  Excellent = "excellent",
  Good = "good",
  Inaccuracy = "inaccuracy",
  Mistake = "mistake",
  Blunder = "blunder",
  Miss = "miss",
  Forced = "forced",
  Book = "book"
}

export type TacticalMotif =
  | "Fork"
  | "Pin"
  | "Skewer"
  | "HangingPiece"
  | "DiscoveredAttack"
  | "DoubleCheck"
  | "TrappedPiece"
  | "MateThreat"
  | "Sacrifice"
  | "Deflection"
  | "Decoy"
  | "MatingNet"
  | "Clearance";

export type PositionalFeature =
  | "Space"
  | "Outpost"
  | "PawnIsland"
  | "PassedPawn"
  | "IsolatedPawn"
  | "DoubledPawn"
  | "KingSafety"
  | "OpenFile"
  | "BishopPair"
  | "ActivePiece";

export interface MoveAnalysisFacts {
  moveType: MoveClassification;
  materialDelta: number;
  hangingPiece: boolean;
  tacticalMotifs: TacticalMotif[];
  positionalFeatures: PositionalFeature[];
  weakSquares: string[];
  kingSafetyScore: number;
  passedPawnCreated: boolean;
  initiativeChange: "Gained" | "Lost" | "Neutral";
  bestAlternativeMove?: string; // UCI format
}

export interface LineEval {
  pv: string[];
  cp?: number;
  mate?: number;
  depth: number;
  multiPv: number;
}

export interface MoveEvaluation {
  bestMove?: string;
  classification?: MoveClassification;
  lines: LineEval[];
  facts?: MoveAnalysisFacts;
  explanation?: string;
  opening?: string;
  metrics?: PositionalMetrics;
  narratives?: Record<string, string>;
}

export interface PositionalMetrics {
  development: [number, number]; // [white, black]
  mobility: [number, number];
  tension: [number, number];
  control: [number, number];
}

export interface GameEval {
  positions: MoveEvaluation[];
  accuracy: {
    white: number;
    black: number;
  };
  estimatedElo?: {
    white: number;
    black: number;
  };
  settings: {
    engine: string;
    depth: number;
    multiPv: number;
    date: string;
  };
}
