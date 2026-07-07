import { ContentService } from "./service";
import { Rule, Lesson, Term, SiteSettings } from "./schema";

const DEFAULT_RULES: Rule[] = [
  {
    id: "objective",
    title: "The Objective",
    icon: "♚",
    content: "Chess is a two-player strategy game. Each player starts with 16 pieces: 1 King, 1 Queen, 2 Rooks, 2 Bishops, 2 Knights, and 8 Pawns. The goal is to checkmate your opponent's king — place it in check with no escape.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    tip: "Remember: the king is never captured — the game ends when checkmate is achieved.",
  },
  {
    id: "movement",
    title: "How Pieces Move",
    icon: "♞",
    content: "♟ Pawn: Forward 1 or 2 squares (from start), captures diagonally.\\n♜ Rook: Any distance horizontally or vertically.\\n♝ Bishop: Any distance diagonally (stays on same color).\\n♛ Queen: Combines rook + bishop — any direction, any distance.\\n♞ Knight: L-shape — 2 squares then 1 at 90°. Can jump over pieces.\\n♚ King: One square in any direction.",
    fen: "4k3/8/8/8/3RBQ2/8/8/4K3 w - - 0 1",
    tip: "The knight is the only piece that can jump over other pieces.",
  },
  {
    id: "special-moves",
    title: "Special Moves",
    icon: "🏰",
    content: "CASTLING: The king moves two squares toward a rook, then the rook jumps to the other side. Requirements: neither piece has moved, no pieces between them, king not in check, king doesn't pass through check.\\n\\nEN PASSANT: If a pawn advances two squares and passes an enemy pawn on an adjacent file, the enemy pawn can capture it as if it moved one square.\\n\\nPROMOTION: When a pawn reaches the opposite end of the board, it must be replaced by a queen, rook, bishop, or knight.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",
    tip: "Promotion is almost always to a queen (the strongest piece), but underpromotion to a knight can sometimes win by forking.",
  },
  {
    id: "check",
    title: "Check and Checkmate",
    icon: "⚠",
    content: "CHECK: Your king is attacked by an opponent's piece. You MUST resolve the check in one of three ways:\\n1. Move the king\\n2. Block the attack\\n3. Capture the attacking piece\\n\\nCHECKMATE: The king is in check and none of the three escape options work. The game ends and the attacking player wins.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    tip: "You can never make a move that leaves your own king in check.",
  },
  {
    id: "draws",
    title: "Draws & Stalemate",
    icon: "🤝",
    content: "The game is a draw in several scenarios:\\n\\nSTALEMATE: The player to move has no legal move and is NOT in check.\\n\\nINSUFFICIENT MATERIAL: Neither player has enough pieces to force checkmate.\\n\\nTHREEFOLD REPETITION: The same position occurs three times.\\n\\n50-MOVE RULE: 50 moves pass with no pawn move or capture.\\n\\nAGREEMENT: Both players agree to a draw.",
    fen: "8/8/8/8/8/8/6P1/6K1 w - - 0 1",
    tip: "Stalemate is a common defensive resource for the losing side. Watch out for it!",
  },
  {
    id: "time",
    title: "Time Controls",
    icon: "⏱",
    content: "In competitive chess, each player has a clock. Common time controls:\\n\\nBULLET: Under 3 minutes total\\nBLITZ: 3-10 minutes total\\nRAPID: 10-60 minutes total\\nCLASSICAL: Over 60 minutes total\\n\\nIf you run out of time, you lose — unless your opponent has insufficient material to checkmate you.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    tip: "Increment (extra seconds added per move) helps prevent time pressure in longer games.",
  },
];

const DEFAULT_LESSONS: Lesson[] = [
  {
    id: "basics-movement",
    title: "How Pieces Move",
    category: "Fundamentals",
    duration: "5 min",
    icon: "♟",
    slides: [
      { title: "The Pawn", body: "Pawns move forward one square at a time (or two from the starting square). They capture diagonally. Pawns can be promoted to any piece when reaching the 8th rank.", fen: "8/PPPPPPPP/8/8/8/8/pppppppp/8 w - - 0 1" },
      { title: "The Rook", body: "The Rook moves any number of squares horizontally or vertically. It is worth about 5 pawns and excels on open files and the 7th rank.", fen: "8/8/8/8/8/8/8/R7 w - - 0 1" },
      { title: "The Bishop", body: "The Bishop moves diagonally and always stays on the same color. It's worth about 3 pawns. A pair of bishops is very powerful.", fen: "8/8/8/8/8/8/8/2B5 w - - 0 1" },
      { title: "The Knight", body: "The Knight moves in an L-shape: two squares in one direction, then one at 90°. It can jump over pieces. Worth about 3 pawns.", fen: "8/8/8/8/8/8/8/1N6 w - - 0 1" },
      { title: "The Queen", body: "The Queen combines rook and bishop movement — any direction, any distance. The most powerful piece worth about 9 pawns.", fen: "8/8/8/8/8/8/8/3Q4 w - - 0 1" },
      { title: "The King", body: "The King moves one square in any direction. The goal of chess is to checkmate the opponent's king. Protect your king!", fen: "8/8/8/8/8/8/8/4K3 w - - 0 1" },
    ],
  },
];

const DEFAULT_TERMS: Term[] = [
  { term: "Algebraic Notation", category: "Notation", definition: "The standard system for recording chess moves. Files are labeled a-h (left to right) and ranks 1-8 (bottom to top from White's perspective)." },
  { term: "Back Rank Mate", category: "Tactics", definition: "Checkmate delivered on the 1st or 8th rank by a rook or queen when the enemy king is trapped behind its own pawns." },
];

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "ChessInsight Pro",
  description: "Advanced Agentic Coding Environment",
  maintenanceMode: false,
};

export async function seedContent(service: ContentService) {
  const seedItems = [
    { slug: "rules", type: "rules", data: DEFAULT_RULES },
    { slug: "lessons", type: "lessons", data: DEFAULT_LESSONS },
    { slug: "terms", type: "terms", data: DEFAULT_TERMS },
    { slug: "site-settings", type: "settings", data: DEFAULT_SITE_SETTINGS },
  ];

  for (const item of seedItems) {
    // Only publish if it doesn't already exist to preserve idempotency
    const existing = await service.getPublishedContent(item.slug);
    if (!existing) {
      await service.publishContent(item.slug, item.type, item.data, "system-seeder", "Initial system seed");
      console.log(`Seeded CMS content: ${item.slug}`);
    }
  }
}
