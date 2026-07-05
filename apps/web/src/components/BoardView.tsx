"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useChessStore, BOARD_THEMES } from "../app/store";
import { Chess } from "@chessinsight/chess-core";

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
  customArrows?: [string, string, string][];
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
  customArrows,
}: Props) {
  const { boardTheme } = useChessStore();
  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.teal;
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(boardWidth);

  // Click-to-move states — these are SEPARATE from parent hint highlights
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveOptionSquares, setMoveOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  // Reset click-to-move selection when position or draggability changes
  useEffect(() => {
    setSelectedSquare(null);
    setMoveOptionSquares({});
  }, [fen, arePiecesDraggable]);

  useEffect(() => {
    if (boardWidth !== undefined) {
      setMeasuredWidth(boardWidth);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    if (container.clientWidth > 0) {
      setMeasuredWidth(container.clientWidth);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) setMeasuredWidth(width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [boardWidth]);

  const handleSquareClick = (square: string) => {
    if (onSquareClick) onSquareClick(square);
    if (!onPieceDrop || !arePiecesDraggable) return;

    try {
      const chess = new Chess(fen || "start");

      // If a square is already selected and clicked square is a valid destination
      if (selectedSquare && moveOptionSquares[square] && square !== selectedSquare) {
        const pieceObj = chess.get(selectedSquare as any);
        const pieceStr = pieceObj ? pieceObj.type : "p";
        onPieceDrop(selectedSquare, square, pieceStr);
        setSelectedSquare(null);
        setMoveOptionSquares({});
        return;
      }

      // Try selecting this square
      const piece = chess.get(square as any);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);

        const moves = chess.moves({ square: square as any, verbose: true }) as any[];
        const newSquares: Record<string, React.CSSProperties> = {};

        moves.forEach((m) => {
          const isCapture = !!chess.get(m.to);
          newSquares[m.to] = isCapture
            ? {
                background: "radial-gradient(circle, transparent 68%, rgba(14,165,100,0.6) 68%)",
                cursor: "pointer",
              }
            : {
                background: "radial-gradient(circle, rgba(14,165,100,0.7) 25%, transparent 25%)",
                cursor: "pointer",
              };
        });

        newSquares[square] = {
          background: "rgba(20,184,120,0.25)",
          boxShadow: "inset 0 0 0 3px rgba(20,184,120,0.6)",
        };

        setMoveOptionSquares(newSquares);
      } else {
        setSelectedSquare(null);
        setMoveOptionSquares({});
      }
    } catch {
      setSelectedSquare(null);
      setMoveOptionSquares({});
    }
  };

  // Merge: parent hint styles take PRIORITY over click-to-move option dots
  // so arrows and highlighted hint squares always show on top
  const mergedSquareStyles: Record<string, React.CSSProperties> = {
    ...moveOptionSquares,         // click-to-move dots (lowest priority)
    ...(customSquareStyles ?? {}), // hint squares from parent (highest priority)
  };

  return (
    <div ref={containerRef} className="w-full h-full aspect-square relative">
      {measuredWidth !== undefined && measuredWidth > 0 && (
        <Chessboard
          position={fen || "start"}
          boardOrientation={orientation || "white"}
          onPieceDrop={onPieceDrop}
          arePiecesDraggable={arePiecesDraggable}
          boardWidth={measuredWidth}
          onSquareClick={handleSquareClick}
          showBoardNotation={showBoardNotation}
          customSquareStyles={mergedSquareStyles}
          customArrows={customArrows as any}
          customDarkSquareStyle={{ backgroundColor: theme.dark }}
          customLightSquareStyle={{ backgroundColor: theme.light }}
          animationDuration={200}
        />
      )}
    </div>
  );
}
