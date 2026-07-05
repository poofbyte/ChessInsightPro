"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(boardWidth);

  useEffect(() => {
    // If boardWidth is explicitly passed, use it.
    if (boardWidth !== undefined) {
      setMeasuredWidth(boardWidth);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Initial measure
    if (container.clientWidth > 0) {
      setMeasuredWidth(container.clientWidth);
    }

    // Resize observer to keep it responsive
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setMeasuredWidth(width);
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [boardWidth]);

  return (
    <div ref={containerRef} className="w-full h-full aspect-square relative">
      {measuredWidth !== undefined && measuredWidth > 0 && (
        <Chessboard
          position={fen || "start"}
          boardOrientation={orientation || "white"}
          onPieceDrop={onPieceDrop}
          arePiecesDraggable={arePiecesDraggable}
          boardWidth={measuredWidth}
          onSquareClick={onSquareClick}
          showBoardNotation={showBoardNotation}
          customSquareStyles={customSquareStyles}
          customDarkSquareStyle={{ backgroundColor: theme.dark }}
          customLightSquareStyle={{ backgroundColor: theme.light }}
        />
      )}
    </div>
  );
}
