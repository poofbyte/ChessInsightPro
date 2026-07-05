export interface OpeningProvider {
  getOpeningName(fen: string): string | null;
  getOpeningStats(fen: string): Promise<any | null>;
}
