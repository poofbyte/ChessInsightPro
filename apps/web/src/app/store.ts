import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Game, GameEval, CoachStyle, User } from "@chessinsight/types";

interface AuthStore {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "chessinsight-auth", // localStorage key
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
);

export type BoardThemeId = "slate" | "teal" | "walnut" | "purple" | "ice" | "classicLight";

export const BOARD_THEMES: Record<BoardThemeId, { label: string; dark: string; light: string }> = {
  slate:  { label: "Classic Slate",    dark: "#2d3748", light: "#4a5568" },
  teal:   { label: "Ocean Teal",       dark: "#2b3447", light: "#3f4b66" },
  walnut: { label: "Dark Walnut",      dark: "#5d3a1a", light: "#c8a47a" },
  purple: { label: "Royal Purple",     dark: "#4a2c6e", light: "#9b72cf" },
  ice:    { label: "Arctic Ice",       dark: "#2c4a6e", light: "#a8d8ea" },
  classicLight: { label: "Classic Light", dark: "#779556", light: "#ebecd0" },
};

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
  boardTheme: BoardThemeId;
  theme: "dark" | "light";

  setGame: (game: Game) => void;
  setCurrentMoveIndex: (index: number) => void;
  setEvaluation: (evaluation: GameEval | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setCoachStyle: (style: CoachStyle) => void;
  setActiveTab: (tab: number) => void;
  toggleBoardOrientation: () => void;
  setEngineVersion: (version: "17" | "18") => void;
  setBoardTheme: (theme: BoardThemeId) => void;
  setTheme: (theme: "dark" | "light") => void;
  reset: () => void;
}

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const playSound = (soundName: string) => {
  if (typeof window === "undefined") return;
  const audio = new globalThis.Audio(`/sounds/${soundName}.webm`);
  audio.volume = 0.6;
  audio.play().catch(() => {});
};

export const playMoveSound = (san?: string) => {
  if (!san) { playSound("move"); return; }
  if (san.includes("O-O")) playSound("castle");
  else if (san.includes("+") || san.includes("#")) playSound("move-check");
  else if (san.includes("x")) playSound("capture");
  else if (san.includes("=")) playSound("promote");
  else playSound("move");
};

export const useChessStore = create<ChessStore>()(
  persist(
    (set) => ({
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
      boardTheme: "classicLight",
      theme: "light",

      setGame: (game) => set({
        game,
        boardFen: game.initialFen || initialFen,
        currentMoveIndex: 0,
        evaluation: game.eval || null,
        analysisProgress: 0,
      }),

      setCurrentMoveIndex: (index) => set((state) => {
        if (!state.game) return {};
        const move = state.game.moves[index - 1];
        if (move) playMoveSound(move.san);
        else playSound("game-start");
        return {
          currentMoveIndex: index,
          boardFen: move ? move.fenAfter : (state.game.initialFen || initialFen),
        };
      }),

      setEvaluation: (evaluation) => set({ evaluation }),
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
      setCoachStyle: (coachStyle) => set({ coachStyle }),
      setActiveTab: (activeTab) => set({ activeTab }),
      toggleBoardOrientation: () => set((state) => ({
        boardOrientation: state.boardOrientation === "white" ? "black" : "white",
      })),
      setEngineVersion: (engineVersion) => set({ engineVersion }),
      setBoardTheme: (boardTheme) => set({ boardTheme }),
      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          if (theme === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }
        set({ theme });
      },

      reset: () => set({
        game: null,
        boardFen: initialFen,
        currentMoveIndex: 0,
        evaluation: null,
        isAnalyzing: false,
        analysisProgress: 0,
        activeTab: 0,
      }),
    }),
    {
      name: "chess-insight-settings",
      partialize: (s) => ({
        engineVersion: s.engineVersion,
        boardTheme: s.boardTheme,
        coachStyle: s.coachStyle,
        boardOrientation: s.boardOrientation,
        theme: s.theme,
      }),
      onRehydrateStorage: () => (state) => {
        // Migrate removed "green" (Tournament Green) to "classicLight"
        if (state && (state as any).boardTheme === "green") {
          (state as any).boardTheme = "classicLight";
        }
      },
    }
  )
);
