import { create } from "zustand";
import { Game, GameEval, CoachStyle } from "@chessinsight/types";

interface ChessStore {
  game: Game | null;
  boardFen: string;
  currentMoveIndex: number;
  evaluation: GameEval | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  coachStyle: CoachStyle;
  activeTab: number;
  boardOrientation: "white" | "black";
  
  setGame: (game: Game) => void;
  setCurrentMoveIndex: (index: number) => void;
  setEvaluation: (evaluation: GameEval | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setCoachStyle: (style: CoachStyle) => void;
  setActiveTab: (tab: number) => void;
  toggleBoardOrientation: () => void;
  reset: () => void;
}

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const useChessStore = create<ChessStore>((set) => ({
  game: null,
  boardFen: initialFen,
  currentMoveIndex: 0,
  evaluation: null,
  isAnalyzing: false,
  analysisProgress: 0,
  coachStyle: CoachStyle.Friendly,
  activeTab: 0,
  boardOrientation: "white",

  setGame: (game) => set({
    game,
    boardFen: game.initialFen || initialFen,
    currentMoveIndex: 0,
    evaluation: game.eval || null,
    analysisProgress: 0
  }),
  
  setCurrentMoveIndex: (index) => set((state) => {
    if (!state.game) return {};
    const move = state.game.moves[index - 1];
    return {
      currentMoveIndex: index,
      boardFen: move ? move.fenAfter : (state.game.initialFen || initialFen)
    };
  }),

  setEvaluation: (evaluation) => set({ evaluation }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
  setCoachStyle: (coachStyle) => set({ coachStyle }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleBoardOrientation: () => set((state) => ({
    boardOrientation: state.boardOrientation === "white" ? "black" : "white"
  })),

  reset: () => set({
    game: null,
    boardFen: initialFen,
    currentMoveIndex: 0,
    evaluation: null,
    isAnalyzing: false,
    analysisProgress: 0,
    activeTab: 0
  })
}));
