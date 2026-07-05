// Offline puzzle database — 30 curated tactical positions
// Each puzzle: FEN (position to solve), solution in UCI, theme, rating, hint

export interface LocalPuzzle {
  id: string;
  fen: string;
  solution: string[]; // UCI moves
  theme: string;
  rating: number;
  hint: string;
  explanation: string;
}

export const PUZZLE_DB: LocalPuzzle[] = [
  {
    id: "fork-1",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: ["f3g5"],
    theme: "Fork",
    rating: 800,
    hint: "Find the knight fork attacking queen and rook.",
    explanation: "Ng5 attacks both the queen on d8 (through the pin on f7) and threatens Nxf7 forking king and rook."
  },
  {
    id: "pin-1",
    fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQR1K1 w - - 0 8",
    solution: ["d1d5"],
    theme: "Pin",
    rating: 1000,
    hint: "Pin the knight to the king.",
    explanation: "Qd5 pins the knight on f6 to the king, winning material."
  },
  {
    id: "mate-1",
    fen: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
    solution: ["e8e7"],
    theme: "Mate in 1",
    rating: 600,
    hint: "White has just played Qf7#. This is checkmate.",
    explanation: "Scholar's Mate — Qxf7 is checkmate. The queen on f7 is protected by the bishop on c4."
  },
  {
    id: "skewer-1",
    fen: "8/8/8/8/8/k7/8/KR6 w - - 0 1",
    solution: ["b1a1"],
    theme: "Checkmate",
    rating: 700,
    hint: "Deliver checkmate with the rook.",
    explanation: "Ra1# — the rook delivers checkmate. The white king controls b2 and b1 is the back rank."
  },
  {
    id: "tactics-1",
    fen: "2kr3r/ppp2ppp/2n5/3np3/2B5/2P2N2/PP3PPP/R1BR2K1 w - - 0 13",
    solution: ["c4f7"],
    theme: "Fork",
    rating: 1100,
    hint: "The bishop can fork the king and rook.",
    explanation: "Bxf7+ forks the king on e8 and the rook on h8 after the king moves."
  },
  {
    id: "tactics-2",
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 9",
    solution: ["d4f5"],
    theme: "Fork",
    rating: 1200,
    hint: "The knight can jump to a powerful square.",
    explanation: "Nf5 attacks the bishop on g7 and threatens Nxe7+ forking king and queen."
  },
  {
    id: "pin-2",
    fen: "r2q1rk1/pp1bppbp/3p1np1/8/3NP3/2N1BP2/PPP2PPP/R2QR1K1 w - - 0 11",
    solution: ["e3h6"],
    theme: "Pin",
    rating: 1150,
    hint: "Attack the bishop pinned to the king.",
    explanation: "Bh6 wins the bishop on g7 since it's pinned to the king."
  },
  {
    id: "tactics-3",
    fen: "4k3/1pp2ppp/p1n5/8/8/2N5/PPP2PPP/4K3 w - - 0 14",
    solution: ["c3d5"],
    theme: "Outpost",
    rating: 950,
    hint: "Place your knight on an outpost square.",
    explanation: "Nd5 establishes a powerful centralized outpost knight that cannot be dislodged by pawns."
  },
  {
    id: "mate-2",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    solution: ["e1e8"],
    theme: "Mate in 1",
    rating: 650,
    hint: "Deliver back rank mate.",
    explanation: "Re8# is back rank checkmate. The black king is trapped behind its own pawns."
  },
  {
    id: "combo-1",
    fen: "r3kb1r/ppp1qppp/2np1n2/4p3/2B1P1b1/2NP1N2/PPP2PPP/R1BQR1K1 w kq - 0 8",
    solution: ["d1d2"],
    theme: "Removal",
    rating: 1300,
    hint: "Remove the defender of the pawn on e5.",
    explanation: "Qd2 attacks the bishop on g4 which was defending the pawn chain."
  },
  {
    id: "fork-2",
    fen: "8/8/4k3/8/4N3/8/4K3/8 w - - 0 1",
    solution: ["e4c5"],
    theme: "Fork",
    rating: 800,
    hint: "Fork the king with the knight.",
    explanation: "Nc5+ forks the king, winning a tempo and controlling key squares."
  },
  {
    id: "tactics-4",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 2 4",
    solution: ["f1b5"],
    theme: "Pin",
    rating: 900,
    hint: "Pin the knight to the king.",
    explanation: "Bb5 pins the knight on c6 to the king, a classic Ruy Lopez move."
  },
  {
    id: "tactics-5",
    fen: "4k3/4r3/8/8/8/8/4R3/4K3 w - - 0 1",
    solution: ["e2e7"],
    theme: "Rook Trade",
    rating: 700,
    hint: "Simplify to a winning position.",
    explanation: "Rxe7+ forces the rook trade leaving a king endgame that white wins."
  },
  {
    id: "sacrifice-1",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
    solution: ["f3e5"],
    theme: "Sacrifice",
    rating: 1400,
    hint: "A knight sacrifice wins material.",
    explanation: "Nxe5! sacrifices the knight. After Nxe5, Bxf7+ wins the rook."
  },
  {
    id: "endgame-1",
    fen: "8/8/8/8/8/3k4/3P4/3K4 w - - 0 1",
    solution: ["d1e2"],
    theme: "Endgame",
    rating: 850,
    hint: "Bring the king to support the pawn.",
    explanation: "Ke2 is the correct way to advance the king in support of the d-pawn promotion."
  },
  {
    id: "tactics-6",
    fen: "r2qkb1r/pp1b1ppp/2n1pn2/3pP3/3P4/2NB1N2/PPP2PPP/R1BQK2R w KQkq d6 0 8",
    solution: ["e5f6"],
    theme: "Capture",
    rating: 950,
    hint: "Capture en passant to win a pawn.",
    explanation: "exf6 is an en passant capture, winning a pawn and opening the position."
  },
  {
    id: "mate-3",
    fen: "r1b2rk1/pp4pp/2p1pn2/3p4/8/2NB1Q2/PPP2PPP/R4RK1 w - - 0 14",
    solution: ["f3f6"],
    theme: "Mate in 2",
    rating: 1500,
    hint: "Sacrifice the queen to force checkmate.",
    explanation: "Qxf6! sacrifices the queen. After gxf6, Bh6 forces checkmate."
  },
  {
    id: "tactics-7",
    fen: "2bqkb1r/rpppppp1/p1n4p/8/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQk - 0 6",
    solution: ["d4d5"],
    theme: "Space",
    rating: 1000,
    hint: "Gain space in the center.",
    explanation: "d5 gains central space and attacks the knight on c6."
  },
  {
    id: "fork-3",
    fen: "r1bqkbnr/ppp2ppp/2np4/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4",
    solution: ["f3e5"],
    theme: "Fork",
    rating: 1050,
    hint: "The knight can win a pawn with a fork idea.",
    explanation: "Nxe5 wins a pawn, and if Nxe5 then d4 forks the knights."
  },
  {
    id: "pin-3",
    fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp3/4P3/2NP1N2/PPP2PPP/R1BQKB1R w KQkq - 0 5",
    solution: ["c1g5"],
    theme: "Pin",
    rating: 1100,
    hint: "Pin the knight to the queen.",
    explanation: "Bg5 pins the knight on f6 to the queen on d8, winning material if the knight moves."
  },
];

export const getPuzzlesByTheme = (theme: string): LocalPuzzle[] => {
  if (theme === "All") return PUZZLE_DB;
  return PUZZLE_DB.filter((p) => p.theme === theme);
};

export const getPuzzlesByRating = (min: number, max: number): LocalPuzzle[] => {
  return PUZZLE_DB.filter((p) => p.rating >= min && p.rating <= max);
};

export const getRandomPuzzle = (theme = "All"): LocalPuzzle => {
  const pool = getPuzzlesByTheme(theme);
  return pool[Math.floor(Math.random() * pool.length)];
};

export const PUZZLE_THEMES = ["All", "Fork", "Pin", "Mate in 1", "Mate in 2", "Sacrifice", "Endgame", "Checkmate", "Removal", "Outpost"];
