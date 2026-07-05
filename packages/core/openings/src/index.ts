import { openings } from "./openingsDb";

export { openings };

export const lookupOpening = (fen: string): string | undefined => {
  const boardFen = fen.split(" ")[0];
  const found = openings.find((o) => o.fen === boardFen);
  return found?.name;
};
