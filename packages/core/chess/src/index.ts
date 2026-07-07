import { Chess, Square, PieceSymbol } from "chess.js";
import { Player, Game, Move } from "@chessinsight/types";

export { Chess, Square, PieceSymbol };

export interface ParsedGame {
  headers: Record<string, string>;
  history: { san: string; from: string; to: string; promotion?: string; fenBefore: string; fenAfter: string }[];
  initialFen: string;
}

export const parsePgn = (pgn: string): ParsedGame => {
  const game = new Chess();
  game.loadPgn(pgn);

  const headers = game.getHeaders() as Record<string, string>;
  const initialFen = headers.FEN || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  // Replay moves to extract FENs
  const replayer = new Chess();
  if (headers.FEN) {
    replayer.load(headers.FEN);
  }

  const history = game.history({ verbose: true }).map((move) => {
    const fenBefore = replayer.fen();
    replayer.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
    const fenAfter = replayer.fen();

    return {
      san: move.san,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      fenBefore,
      fenAfter,
    };
  });

  return {
    headers,
    history,
    initialFen,
  };
};

export const getEvaluateGameParams = (pgn: string): { fens: string[]; uciMoves: string[] } => {
  const parsed = parsePgn(pgn);
  const fens = parsed.history.map((m) => m.fenBefore);
  if (parsed.history.length > 0) {
    fens.push(parsed.history[parsed.history.length - 1].fenAfter);
  } else {
    fens.push(parsed.initialFen);
  }

  const uciMoves = parsed.history.map((m) => m.from + m.to + (m.promotion || ""));

  return { fens, uciMoves };
};

export const uciMoveParams = (
  uciMove: string
): {
  from: Square;
  to: Square;
  promotion?: string;
} => ({
  from: uciMove.slice(0, 2) as Square,
  to: uciMove.slice(2, 4) as Square,
  promotion: uciMove.slice(4, 5) || undefined,
});

export const moveLineUciToSan = (
  fen: string
): ((moveUci: string) => string) => {
  const game = new Chess(fen);

  return (moveUci: string): string => {
    try {
      const params = uciMoveParams(moveUci);
      const move = game.move({
        from: params.from,
        to: params.to,
        promotion: params.promotion,
      });
      // Undo so we don't pollute the state if called sequentially
      game.undo();
      return move.san;
    } catch {
      return moveUci;
    }
  };
};

export const getPieceValue = (piece: PieceSymbol): number => {
  switch (piece) {
    case "p":
      return 100;
    case "n":
      return 300;
    case "b":
      return 300;
    case "r":
      return 500;
    case "q":
      return 900;
    default:
      return 0;
  }
};

export const getMaterialDifference = (fen: string): number => {
  const game = new Chess(fen);
  const board = game.board().flat();

  return board.reduce((acc, square) => {
    if (!square) return acc;
    const value = getPieceValue(square.type);

    if (square.color === "w") {
      return acc + value;
    }

    return acc - value;
  }, 0);
};

export const getCapturedPieces = (
  fen: string
): {
  white: { type: string; count: number }[];
  black: { type: string; count: number }[];
} => {
  const piecesLeft = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  const game = new Chess(fen);
  const board = game.board().flat();
  for (const sq of board) {
    if (sq) {
      piecesLeft[sq.color][sq.type]++;
    }
  }

  const whiteCaptured = [
    { type: "p", count: Math.max(0, 8 - piecesLeft.b.p) },
    { type: "n", count: Math.max(0, 2 - piecesLeft.b.n) },
    { type: "b", count: Math.max(0, 2 - piecesLeft.b.b) },
    { type: "r", count: Math.max(0, 2 - piecesLeft.b.r) },
    { type: "q", count: Math.max(0, 1 - piecesLeft.b.q) },
  ];

  const blackCaptured = [
    { type: "p", count: Math.max(0, 8 - piecesLeft.w.p) },
    { type: "n", count: Math.max(0, 2 - piecesLeft.w.n) },
    { type: "b", count: Math.max(0, 2 - piecesLeft.w.b) },
    { type: "r", count: Math.max(0, 2 - piecesLeft.w.r) },
    { type: "q", count: Math.max(0, 1 - piecesLeft.w.q) },
  ];

  return {
    white: whiteCaptured,
    black: blackCaptured,
  };
};

export const isSimplePieceRecapture = (
  fen: string,
  uciMoves: [string, string]
): boolean => {
  const game = new Chess(fen);
  const moves = uciMoves.map((uciMove) => uciMoveParams(uciMove));

  if (moves[0].to !== moves[1].to) return false;

  const piece = game.get(moves[0].to);
  if (piece) return true;

  return false;
};

export const getIsPieceSacrifice = (
  fen: string,
  playedMove: string,
  bestLinePvToPlay: string[]
): boolean => {
  if (!bestLinePvToPlay.length) return false;

  const game = new Chess(fen);
  const whiteToPlay = game.turn() === "w";
  const startingMaterialDifference = getMaterialDifference(fen);

  let moves = [playedMove, ...bestLinePvToPlay];
  if (moves.length % 2 === 1) {
    moves = moves.slice(0, -1);
  }
  let nonCapturingMovesTemp = 1;

  const capturedPieces: { w: PieceSymbol[]; b: PieceSymbol[] } = {
    w: [],
    b: [],
  };

  for (const move of moves) {
    try {
      const params = uciMoveParams(move);
      const piece = game.get(params.to);
      const color = game.turn();
      const fullMove = game.move({
        from: params.from,
        to: params.to,
        promotion: params.promotion,
      });

      if (piece) {
        capturedPieces[color].push(piece.type);
        nonCapturingMovesTemp = 1;
      } else {
        nonCapturingMovesTemp--;
        if (nonCapturingMovesTemp < 0) break;
      }
    } catch {
      return false;
    }
  }

  for (const p of capturedPieces["w"].slice(0)) {
    const idx = capturedPieces["b"].indexOf(p);
    if (idx !== -1) {
      capturedPieces["b"].splice(idx, 1);
      const wIdx = capturedPieces["w"].indexOf(p);
      capturedPieces["w"].splice(wIdx, 1);
    }
  }

  if (
    Math.abs(capturedPieces["w"].length - capturedPieces["b"].length) <= 1 &&
    capturedPieces["w"].concat(capturedPieces["b"]).every((p) => p === "p")
  ) {
    return false;
  }

  const endingMaterialDifference = getMaterialDifference(game.fen());
  const materialDiff = endingMaterialDifference - startingMaterialDifference;
  const materialDiffPlayerRelative = whiteToPlay ? materialDiff : -materialDiff;

  return materialDiffPlayerRelative < 0;
};

export const formatUciPv = (fen: string, uciMoves: string[]): string[] => {
  const game = new Chess(fen);
  const castlingRights = fen.split(" ")[2];

  let canWhiteCastleKingSide = castlingRights.includes("K");
  let canWhiteCastleQueenSide = castlingRights.includes("Q");
  let canBlackCastleKingSide = castlingRights.includes("k");
  let canBlackCastleQueenSide = castlingRights.includes("q");

  return uciMoves.map((uci) => {
    if (uci === "e1h1" && canWhiteCastleKingSide) {
      canWhiteCastleKingSide = false;
      return "e1g1";
    }
    if (uci === "e1a1" && canWhiteCastleQueenSide) {
      canWhiteCastleQueenSide = false;
      return "e1c1";
    }

    if (uci === "e8h8" && canBlackCastleKingSide) {
      canBlackCastleKingSide = false;
      return "e8g8";
    }
    if (uci === "e8a8" && canBlackCastleQueenSide) {
      canBlackCastleQueenSide = false;
      return "e8c8";
    }

    return uci;
  });
};
