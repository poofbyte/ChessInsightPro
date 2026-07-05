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
  engineVersion: "17" | "18";
  
  setGame: (game: Game) => void;
  setCurrentMoveIndex: (index: number) => void;
  setEvaluation: (evaluation: GameEval | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setCoachStyle: (style: CoachStyle) => void;
  setActiveTab: (tab: number) => void;
  toggleBoardOrientation: () => void;
  setEngineVersion: (version: "17" | "18") => void;
  reset: () => void;
}

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const playSound = (soundName: string) => {
  if (typeof window === "undefined") return;
  const audio = new globalThis.Audio(`/sounds/${soundName}.webm`);
  audio.volume = 0.6;
  audio.play().catch((err) => {
    // Browser locks autoplay before first click, which is expected
    console.log("Audio playback blocked:", err);
  });
};

export const playMoveSound = (san?: string) => {
  if (!san) {
    playSound("move");
    return;
  }
  if (san.includes("O-O")) {
    playSound("castle");
  } else if (san.includes("+") || san.includes("#")) {
    playSound("move-check");
  } else if (san.includes("x")) {
    playSound("capture");
  } else if (san.includes("=")) {
    playSound("promote");
  } else {
    playSound("move");
  }
};

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
  engineVersion: "18",

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
    
    // Play the move sound preview
    if (move) {
      playMoveSound(move.san);
    } else {
      playSound("game-start");
    }
    
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
  setEngineVersion: (engineVersion) => set({ engineVersion }),

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
