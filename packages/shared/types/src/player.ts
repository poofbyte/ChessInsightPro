import { TacticalMotif } from "./analysis";

export interface User {
  id: string;
  email: string;
  plan: string;
  role?: "USER" | "ADMIN";
}

export interface HistoricAccuracy {
  accuracyTrend: number[];
  averageCplTrend: number[];
}

export interface WeaknessMotif {
  motif: TacticalMotif | string;
  count: number;
  description: string;
}

export interface PlayerProfile {
  playerId: string;
  estimatedElo: number;
  gamesPlayed: number;
  accuracy: HistoricAccuracy;
  detectedWeaknesses: WeaknessMotif[];
  openingAccuracy: Record<string, number>; // Maps ECO codes to accuracy averages
}

export interface PlayerProfileRepository {
  getProfile(playerId: string): Promise<PlayerProfile | null>;
  saveProfile(profile: PlayerProfile): Promise<void>;
}
