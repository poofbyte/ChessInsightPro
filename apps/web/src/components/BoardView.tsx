"use client";

import dynamic from "next/dynamic";
import { useChessStore, BOARD_THEMES } from "../app/store";

const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard || (m as any).default),
  { ssr: false }
);

interface Props {
  fen?: string;
  orientation?: "white" | "black";
  onPieceDrop?: (from: string, to: string, piece: string) => boolean;
  arePiecesDraggable?: boolean;
  boardWidth?: number;
  onSquareClick?: (square: string) => void;
  showBoardNotation?: boolean;
  customSquareStyles?: Record<string, React.CSSProperties>;
}

export function BoardView({
  fen,
  orientation,
  onPieceDrop,
  arePiecesDraggable = true,
  boardWidth,
  onSquareClick,
  showBoardNotation = true,
  customSquareStyles,
}: Props) {
  const { boardTheme } = useChessStore();
  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.teal;

  return (
    <div className="w-full h-full aspect-square relative">
      <Chessboard
        position={fen || "start"}
        boardOrientation={orientation || "white"}
        onPieceDrop={onPieceDrop}
        arePiecesDraggable={arePiecesDraggable}
        boardWidth={boardWidth}
        onSquareClick={onSquareClick}
        showBoardNotation={showBoardNotation}
        customSquareStyles={customSquareStyles}
        customDarkSquareStyle={{ backgroundColor: theme.dark }}
        customLightSquareStyle={{ backgroundColor: theme.light }}
      />
    </div>
  );
}
