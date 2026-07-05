"use client";

import dynamic from "next/dynamic";
import { useChessStore, BOARD_THEMES } from "../app/store";

const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  { ssr: false }
);

interface Props {
  fen?: string;
  orientation?: "white" | "black";
  onPieceDrop?: (from: string, to: string, piece: string) => boolean;
  arePiecesDraggable?: boolean;
  boardWidth?: number;
}

export function BoardView({
  fen,
  orientation,
  onPieceDrop,
  arePiecesDraggable = true,
  boardWidth,
}: Props) {
  const { boardTheme } = useChessStore();
  const theme = BOARD_THEMES[boardTheme];

  return (
    <Chessboard
      position={fen || "start"}
      boardOrientation={orientation || "white"}
      onPieceDrop={onPieceDrop}
      arePiecesDraggable={arePiecesDraggable}
      boardWidth={boardWidth}
      customDarkSquareStyle={{ backgroundColor: theme.dark }}
      customLightSquareStyle={{ backgroundColor: theme.light }}
    />
  );
}
