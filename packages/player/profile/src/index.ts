import { Game, PlayerProfile } from "@chessinsight/types";

export const estimateElo = (averageCpl: number, movesCount: number): number => {
  if (averageCpl > 500) return 100;
  const estimate = 3000 * Math.pow(Math.E, -0.01 * averageCpl) * Math.pow(movesCount / 50, 0.5);
  return Math.max(100, Math.ceil(estimate / 100) * 100);
};

export const calculateGameAccuracy = (
  winChances: number[] // win chance for white (0-100) at each move index (0 is starting position)
): { white: number; black: number } => {
  const whiteAccs: number[] = [];
  const blackAccs: number[] = [];

  for (let i = 0; i < winChances.length - 1; i++) {
    const before = winChances[i];
    const after = winChances[i + 1];

    if (i % 2 === 0) {
      // White's move: delta is drop in White's win percentage
      const delta = before - after;
      if (delta <= 0) {
        whiteAccs.push(100);
      } else {
        const acc = 100.0307234 * Math.exp(-0.1008298 * delta) - 0.03076726;
        whiteAccs.push(Math.max(0, Math.min(100, acc)));
      }
    } else {
      // Black's move: delta is drop in Black's win percentage (which is 100 - White's win percentage)
      const blackBefore = 100 - before;
      const blackAfter = 100 - after;
      const delta = blackBefore - blackAfter;
      if (delta <= 0) {
        blackAccs.push(100);
      } else {
        const acc = 100.0307234 * Math.exp(-0.1008298 * delta) - 0.03076726;
        blackAccs.push(Math.max(0, Math.min(100, acc)));
      }
    }
  }

  const whiteMean = whiteAccs.length > 0 ? whiteAccs.reduce((a, b) => a + b, 0) / whiteAccs.length : 100;
  const blackMean = blackAccs.length > 0 ? blackAccs.reduce((a, b) => a + b, 0) / blackAccs.length : 100;

  return {
    white: parseFloat(whiteMean.toFixed(1)),
    black: parseFloat(blackMean.toFixed(1)),
  };
};

export const initializeProfile = (playerId: string): PlayerProfile => ({
  playerId,
  estimatedElo: 1200,
  gamesPlayed: 0,
  accuracy: {
    accuracyTrend: [],
    averageCplTrend: [],
  },
  detectedWeaknesses: [],
  openingAccuracy: {},
});

export const updateProfileWithGame = (
  profile: PlayerProfile,
  gameAccuracy: number,
  gameCpl: number,
  ecoCode?: string,
  openingAccuracy?: number
): PlayerProfile => {
  const updatedAccuracyTrend = [...profile.accuracy.accuracyTrend, gameAccuracy].slice(-20);
  const updatedCplTrend = [...profile.accuracy.averageCplTrend, gameCpl].slice(-20);

  const newGamesPlayed = profile.gamesPlayed + 1;
  const newElo = Math.round(
    profile.estimatedElo + (gameAccuracy > 80 ? 15 : gameAccuracy < 50 ? -15 : 0)
  );

  const updatedOpeningAccuracy = { ...profile.openingAccuracy };
  if (ecoCode && openingAccuracy !== undefined) {
    const prev = updatedOpeningAccuracy[ecoCode] || 100;
    updatedOpeningAccuracy[ecoCode] = parseFloat(((prev * 2 + openingAccuracy) / 3).toFixed(1));
  }

  return {
    ...profile,
    gamesPlayed: newGamesPlayed,
    estimatedElo: newElo,
    accuracy: {
      accuracyTrend: updatedAccuracyTrend,
      averageCplTrend: updatedCplTrend,
    },
    openingAccuracy: updatedOpeningAccuracy,
  };
};
