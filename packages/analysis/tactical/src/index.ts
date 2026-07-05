import { Chess, Square, PieceSymbol, getIsPieceSacrifice } from "@chessinsight/chess-core";
import { TacticalMotif } from "@chessinsight/types";

const getSquareName = (row: number, col: number): Square => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  return (files[col] + ranks[row]) as Square;
};

// Check if a piece on a square is defended by its own side
export const isDefended = (game: Chess, square: Square, byColor: "w" | "b"): boolean => {
  const piece = game.get(square);
  if (!piece) return false;

  // Temporarily change piece to opponent color to see if its own color attacks it
  const originalColor = piece.color;
  game.put({ type: piece.type, color: originalColor === "w" ? "b" : "w" }, square);
  const defended = game.isAttacked(square, byColor);
  // Restore original
  game.put({ type: piece.type, color: originalColor }, square);

  return defended;
};

// Check if a piece on a square is hanging (attacked by opponent and undefended, or attacked by a lesser value piece)
export const isHanging = (game: Chess, square: Square, capturableBy: "w" | "b"): boolean => {
  const piece = game.get(square);
  if (!piece) return false;

  const opponentColor = piece.color === "w" ? "b" : "w";
  // Is it attacked by the opponent?
  const isAttacked = game.isAttacked(square, opponentColor);
  if (!isAttacked) return false;

  // Is it undefended?
  const defended = isDefended(game, square, piece.color);
  if (!defended) return true;

  // Even if defended, is it attacked by a piece of lesser value?
  // We can scan the board for opponent pieces that attack this square and check their values.
  const board = game.board();
  const targetValue = getPieceValue(piece.type);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === opponentColor) {
        const attackingSquare = getSquareName(r, c);
        // Check if this piece attacks the target square
        if (isAttackingSquare(game, attackingSquare, square)) {
          if (getPieceValue(p.type) < targetValue) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

const getPieceValue = (type: PieceSymbol): number => {
  switch (type) {
    case "p": return 1;
    case "n": return 3;
    case "b": return 3;
    case "r": return 5;
    case "q": return 9;
    case "k": return 1000;
    default: return 0;
  }
};

const isAttackingSquare = (game: Chess, attacker: Square, target: Square): boolean => {
  // Save board state
  const fen = game.fen();
  const currentTurn = game.turn();
  const piece = game.get(attacker);
  if (!piece) return false;

  // If the attacker's color is not the active turn, temporarily swap turns
  let activeGame = game;
  if (currentTurn !== piece.color) {
    const parts = fen.split(" ");
    parts[1] = piece.color;
    parts[3] = "-";
    activeGame = new Chess(parts.join(" "));
  }

  const moves = activeGame.moves({ square: attacker, verbose: true });
  const attacks = moves.some((m) => m.to === target);
  return attacks;
};

export const isPinned = (game: Chess, square: Square, color: "w" | "b"): boolean => {
  const piece = game.get(square);
  if (!piece || piece.type === "k") return false;

  // Find king
  let kingSquare: Square | null = null;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "k" && p.color === color) {
        kingSquare = getSquareName(r, c);
        break;
      }
    }
  }
  if (!kingSquare) return false;

  // Remove the piece and see if the king is attacked by a sliding piece
  game.remove(square);
  const opponentColor = color === "w" ? "b" : "w";
  const attacked = game.isAttacked(kingSquare, opponentColor);
  game.put(piece, square);

  return attacked;
};

export const detectTacticalMotifs = (
  fenBefore: string,
  playedMoveUci: string,
  fenAfter: string,
  bestLinePvToPlay: string[] = []
): TacticalMotif[] => {
  const motifs: TacticalMotif[] = [];
  const gameBefore = new Chess(fenBefore);
  const gameAfter = new Chess(fenAfter);

  const fromSquare = playedMoveUci.slice(0, 2) as Square;
  const toSquare = playedMoveUci.slice(2, 4) as Square;
  const promotion = playedMoveUci.slice(4, 5) || undefined;

  // 1. Check if Sacrifice
  if (bestLinePvToPlay.length > 0 && getIsPieceSacrifice(fenBefore, playedMoveUci, bestLinePvToPlay)) {
    motifs.push("Sacrifice");
  }

  // Reload board after move to inspect attack positions
  const piece = gameAfter.get(toSquare);
  if (piece) {
    // 2. Check if Fork
    // Check if the piece at toSquare attacks 2 or more valuable / undefended opponent pieces
    const attacks = gameAfter.moves({ square: toSquare, verbose: true });
    let forkTargetsCount = 0;
    const opponentColor = piece.color === "w" ? "b" : "w";

    for (const move of attacks) {
      const targetPiece = gameAfter.get(move.to);
      if (targetPiece && targetPiece.color === opponentColor) {
        // Target is undefended, or of higher value than the fork-attacking piece
        const undefended = !isDefended(gameAfter, move.to, opponentColor);
        const higherValue = getPieceValue(targetPiece.type) > getPieceValue(piece.type);
        if (undefended || higherValue || targetPiece.type === "k") {
          forkTargetsCount++;
        }
      }
    }
    if (forkTargetsCount >= 2) {
      motifs.push("Fork");
    }

    // 3. Check if Pin created
    // A pin is created if the opponent has a piece that is pinned to its king/queen along the attack line of our piece
    const SQUARES = getSquaresArray();
    for (const sq of SQUARES) {
      const target = gameAfter.get(sq);
      if (target && target.color === opponentColor) {
        if (isPinned(gameAfter, sq, opponentColor)) {
          // Check if this pin is along the line of our newly moved piece
          // (Temporarily remove target and see if our piece at toSquare attacks the king)
          if (isAttackingSquare(gameAfter, toSquare, sq)) {
            motifs.push("Pin");
            break;
          }
        }
      }
    }
  }

  // 4. Check if checkmate threat or checks
  if (gameAfter.isCheck()) {
    motifs.push("MateThreat"); // Simple flag if checking, or we can checkmate threat
  }

  // 5. Check if hanging piece left behind
  const boardBefore = gameBefore.board().flat();
  for (let sqIndex = 0; sqIndex < boardBefore.length; sqIndex++) {
    const p = boardBefore[sqIndex];
    if (p && p.color === gameBefore.turn()) {
      const square = getSquareName(Math.floor(sqIndex / 8), sqIndex % 8);
      if (isHanging(gameAfter, square, gameAfter.turn())) {
        motifs.push("HangingPiece");
        break;
      }
    }
  }

  return motifs;
};

const getSquaresArray = (): Square[] => {
  const squares: Square[] = [];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];
  for (const f of files) {
    for (const r of ranks) {
      squares.push((f + r) as Square);
    }
  }
  return squares;
};
