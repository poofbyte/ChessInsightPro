export interface EngineLine {
  pv: string[];
  cp?: number;
  mate?: number;
  depth: number;
  multiPv: number;
}

export interface EngineProvider {
  initialize(): Promise<void>;
  evaluatePosition(
    fen: string,
    depth: number,
    multiPv: number,
    onUpdate?: (lines: EngineLine[]) => void
  ): Promise<EngineLine[]>;
  stop(): void;
  terminate(): void;
}
