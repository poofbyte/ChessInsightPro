import { Chess, Square } from "@chessinsight/chess-core";
import { PositionalMetrics } from "@chessinsight/types";

export const getDevelopment = (game: Chess): [number, number] => {
  let whiteDev = 0;
  let blackDev = 0;

  // White pieces off starting squares
  if (game.get("a1")?.type !== "r" || game.get("a1")?.color !== "w") whiteDev++;
  if (game.get("h1")?.type !== "r" || game.get("h1")?.color !== "w") whiteDev++;
  if (game.get("b1")?.type !== "n" || game.get("b1")?.color !== "w") whiteDev++;
  if (game.get("g1")?.type !== "n" || game.get("g1")?.color !== "w") whiteDev++;
  if (game.get("c1")?.type !== "b" || game.get("c1")?.color !== "w") whiteDev++;
  if (game.get("f1")?.type !== "b" || game.get("f1")?.color !== "w") whiteDev++;
  if (game.get("d1")?.type !== "q" || game.get("d1")?.color !== "w") whiteDev++;

  // Black pieces off starting squares
  if (game.get("a8")?.type !== "r" || game.get("a8")?.color !== "b") blackDev++;
  if (game.get("h8")?.type !== "r" || game.get("h8")?.color !== "b") blackDev++;
  if (game.get("b8")?.type !== "n" || game.get("b8")?.color !== "b") blackDev++;
  if (game.get("g8")?.type !== "n" || game.get("g8")?.color !== "b") blackDev++;
  if (game.get("c8")?.type !== "b" || game.get("c8")?.color !== "b") blackDev++;
  if (game.get("f8")?.type !== "b" || game.get("f8")?.color !== "b") blackDev++;
  if (game.get("d8")?.type !== "q" || game.get("d8")?.color !== "b") blackDev++;

  return [whiteDev, blackDev];
};

export const getTension = (game: Chess): [number, number] => {
  const fen = game.fen();
  const currentTurn = game.turn();
  const currentTension = game.moves({ verbose: true }).filter((m) => m.captured !== undefined).length;

  const swappedFen = getSwappedTurnFen(fen);
  const swappedGame = new Chess(swappedFen);
  const opponentTension = swappedGame.moves({ verbose: true }).filter((m) => m.captured !== undefined).length;

  return currentTurn === "w" ? [currentTension, opponentTension] : [opponentTension, currentTension];
};

export const getMobility = (game: Chess): [number, number] => {
  const fen = game.fen();
  const currentTurn = game.turn();
  const currentMobility = game.moves({ verbose: true }).filter((m) => m.piece !== "p").length;

  const swappedFen = getSwappedTurnFen(fen);
  const swappedGame = new Chess(swappedFen);
  const opponentMobility = swappedGame.moves({ verbose: true }).filter((m) => m.piece !== "p").length;

  return currentTurn === "w" ? [currentMobility, opponentMobility] : [opponentMobility, currentMobility];
};

export const getControl = (game: Chess): [number, number] => {
  let whiteControl = 0;
  let blackControl = 0;

  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const squareName = getSquareName(r, c);
        const attacks = getSquareAttacks(game, squareName);
        if (piece.color === "w") {
          whiteControl += attacks.length;
        } else {
          blackControl += attacks.length;
        }
      }
    }
  }

  return [whiteControl, blackControl];
};

const getSwappedTurnFen = (fen: string): string => {
  const parts = fen.split(" ");
  parts[1] = parts[1] === "w" ? "b" : "w";
  parts[3] = "-"; // Reset en passant square
  return parts.join(" ");
};

const getSquareName = (row: number, col: number): Square => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  return (files[col] + ranks[row]) as Square;
};

const getSquareAttacks = (game: Chess, square: Square): Square[] => {
  const piece = game.get(square);
  if (!piece) return [];

  const currentTurn = game.turn();
  const needSwap = currentTurn !== piece.color;
  let activeGame = game;

  if (needSwap) {
    const fen = game.fen();
    activeGame = new Chess(getSwappedTurnFen(fen));
  }

  const moves = activeGame.moves({ square, verbose: true });
  return moves.map((m) => m.to);
};

export const calculatePositionalMetrics = (fen: string): PositionalMetrics => {
  const game = new Chess(fen);
  return {
    development: getDevelopment(game),
    mobility: getMobility(game),
    tension: getTension(game),
    control: getControl(game),
  };
};
