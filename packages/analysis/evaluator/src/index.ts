import { ceilsNumber } from "@chessinsight/utils";
import { EngineLine, LineEval, MoveEvaluation } from "@chessinsight/types";

export const getWinPercentageFromCp = (cp: number): number => {
  const cpCeiled = ceilsNumber(cp, -1000, 1000);
  const MULTIPLIER = -0.00368208; // Lichess win chance regression model coefficient
  const winChances = 2 / (1 + Math.exp(MULTIPLIER * cpCeiled)) - 1;
  return 50 + 50 * winChances;
};

export const getWinPercentageFromMate = (mate: number): number => {
  const sign = Math.sign(mate);
  // Mate in 0 is checkmate, assign infinity win/loss chance
  const mateInf = sign * Infinity;
  return getWinPercentageFromCp(mateInf);
};

export const getLineWinPercentage = (line: Pick<LineEval, "cp" | "mate">): number => {
  if (line.cp !== undefined) {
    return getWinPercentageFromCp(line.cp);
  }
  if (line.mate !== undefined) {
    return getWinPercentageFromMate(line.mate);
  }
  return 50;
};

export const getPositionWinPercentage = (position: Pick<MoveEvaluation, "lines">): number => {
  if (!position.lines || position.lines.length === 0) return 50;
  return getLineWinPercentage(position.lines[0]);
};

export const fetchLichessCloudEval = async (
  fen: string,
  multiPv: number
): Promise<{ bestMove: string; lines: LineEval[] } | null> => {
  try {
    const encodedFen = encodeURIComponent(fen);
    const res = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodedFen}&multiPv=${multiPv}`, {
      method: "GET",
      signal: AbortSignal.timeout?.(500) as any
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;

    const lines: LineEval[] = (data.pvs || []).map((pv: any, index: number) => ({
      pv: pv.moves.split(" "),
      cp: pv.cp,
      mate: pv.mate,
      depth: data.depth || 16,
      multiPv: index + 1,
    }));

    return {
      bestMove: lines[0]?.pv[0] || "",
      lines,
    };
  } catch {
    return null;
  }
};
