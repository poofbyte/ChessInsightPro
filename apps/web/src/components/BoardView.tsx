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
  customArrows?: any[];
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

  // States for Click-to-Move
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  useEffect(() => {
    setSelectedSquare(null);
    setOptionSquares({});
  }, [fen]);

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

  const handleSquareClick = (square: string) => {
    // Trigger parent square click if exists
    if (onSquareClick) {
      onSquareClick(square);
    }

    // Click-to-move only if writable
    if (!onPieceDrop || !arePiecesDraggable) return;

    try {
      const chess = new Chess(fen || "start");

      // 1. If a square is selected and the clicked square is one of the legal moves:
      if (selectedSquare && optionSquares[square] && square !== selectedSquare) {
        const pieceType = chess.get(selectedSquare as any)?.type || "p";
        onPieceDrop(selectedSquare, square, pieceType);
        setSelectedSquare(null);
        setOptionSquares({});
        return;
      }

      // 2. Otherwise, select the piece if it belongs to the side whose turn it is:
      const piece = chess.get(square as any);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);

        const moves = chess.moves({ square: square as any, verbose: true }) as any[];
        const newSquares: Record<string, React.CSSProperties> = {};

        moves.forEach((m) => {
          const isCapture = chess.get(m.to) !== null;
          newSquares[m.to] = {
            background: isCapture
              ? "radial-gradient(circle, transparent 70%, rgba(20,180,120,0.55) 70%)"
              : "radial-gradient(circle, rgba(20,180,120,0.65) 24%, transparent 24%)",
            cursor: "pointer",
          };
        });

        // Highlight selected square
        newSquares[square] = {
          background: "rgba(20, 180, 120, 0.25)",
        };

        setOptionSquares(newSquares);
      } else {
        setSelectedSquare(null);
        setOptionSquares({});
      }
    } catch (err) {
      console.error("Click-to-move error:", err);
    }
  };

  const mergedSquareStyles = {
    ...customSquareStyles,
    ...optionSquares,
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
          customArrows={customArrows}
          customDarkSquareStyle={{ backgroundColor: theme.dark }}
          customLightSquareStyle={{ backgroundColor: theme.light }}
        />
      )}
    </div>
  );
}
