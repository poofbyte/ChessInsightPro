import { ContentService } from "./service";
import { Rule, Lesson, Term, Opening, SiteSettings } from "./schema";

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
  {
    id: "notation",
    title: "Algebraic Notation",
    icon: "📝",
    content: "Algebraic notation is the standard way to record chess moves.\\n\\nFILES: The columns are labeled a-h from White's left to right.\\nRANKS: The rows are numbered 1-8 from White's side to Black's.\\n\\nEach square has a unique name (e.g., e4, d5).\\n\\nPIECE ABBREVIATIONS: K=King, Q=Queen, R=Rook, B=Bishop, N=Knight. Pawns are not indicated by a letter.\\n\\nSPECIAL SYMBOLS: x = capture, + = check, # = checkmate, O-O = kingside castle, O-O-O = queenside castle.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    tip: "The file is always lowercase (a-h) and the rank is always a number (1-8).",
  },
  {
    id: "etiquette",
    title: "Tournament Etiquette",
    icon: "🎯",
    content: "CHESS CLOCK: Press your clock with the same hand you moved. Both sides should be visible to both players.\\n\\nTOUCH-MOVE RULE: If you touch a piece, you must move it. If you let go, the move stands.\\n\\nSCORING: 1 point for a win, 0.5 for a draw, 0 for a loss.\\n\\nCONDUCT: No talking during games. No electronic devices. Offer draws only on your own time.\\n\\nRESIGNING: You may resign at any time by tipping your king or saying \"I resign\".",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    tip: "Always write your move on the scoresheet BEFORE making it to avoid touch-move disputes.",
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
  {
    id: "basic-tactics",
    title: "Basic Tactics",
    category: "Tactics",
    duration: "8 min",
    icon: "⚡",
    slides: [
      { title: "The Fork", body: "A fork is a single piece attacking two or more enemy pieces at once. Knights are especially good at forking because of their unique movement. Always look for forks — they win material.", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1" },
      { title: "The Pin", body: "A pin occurs when a piece cannot move without exposing a more valuable piece behind it. Bishops and rooks are excellent pinning pieces. Pins often lead to material gain.", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1" },
      { title: "The Skewer", body: "A skewer is like a reverse pin — the more valuable piece is in front and must move, exposing a less valuable piece behind. This often happens with bishops, rooks, and queens along ranks, files, or diagonals.", fen: "r3k2r/ppp2ppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1" },
      { title: "Discovered Attack", body: "A discovered attack happens when one piece moves away, revealing an attack from a piece behind it. This is a powerful tactical motif because it creates two threats at once.", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1" },
      { title: "Double Check", body: "Double check is a special discovered attack where both the moving piece and the revealed piece give check. The king must move — blocks and captures don't work. Double check is often decisive.", fen: "4k3/8/8/8/3N4/8/8/3B4 w - - 0 1" },
    ],
  },
  {
    id: "opening-principles",
    title: "Opening Principles",
    category: "Opening",
    duration: "7 min",
    icon: "🏁",
    slides: [
      { title: "Control the Center", body: "The four center squares (d4, d5, e4, e5) are the most important on the board. Controlling them gives your pieces maximum mobility. Push your center pawns early.", fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1" },
      { title: "Develop Your Pieces", body: "Bring your knights and bishops out early, ideally toward the center. Aim to develop each piece once in the opening — don't move the same piece twice without good reason.", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 0 1" },
      { title: "Castle Early", body: "Castling gets your king to safety and activates your rook. Aim to castle within the first 10 moves. King-side castling (0-0) is slightly more common, but queen-side (0-0-0) can be strong too.", fen: "rnbq1rk1/ppppbppp/4pn2/8/2PP4/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 1" },
      { title: "Don't Move Same Piece Twice", body: "In the opening, avoid moving a piece twice while other pieces remain undeveloped. Each move should bring a new piece into play. Wasting tempos gives your opponent an advantage.", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1" },
      { title: "Connect the Rooks", body: "Once both rooks are connected on the back rank with no pieces between them, the opening phase is complete. This signals you're ready for the middlegame.", fen: "r1bq1rk1/ppppbppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1" },
    ],
  },
  {
    id: "middlegame-strategy",
    title: "Middlegame Strategy",
    category: "Strategy",
    duration: "8 min",
    icon: "🧠",
    slides: [
      { title: "Piece Activity", body: "Active pieces control more squares and create threats. Place rooks on open files, bishops on long diagonals, and knights on central outposts. Inactive pieces are a major disadvantage.", fen: "r4rk1/ppp2ppp/2np4/4n3/2B1P3/2NP4/PPP2PPP/R1B2RK1 w - - 0 1" },
      { title: "Pawn Structure", body: "Pawns form the skeleton of your position. Avoid doubled, isolated, or backward pawns unless there's a concrete compensation. Pawn weaknesses are permanent and can be targeted in the endgame.", fen: "r1bq1rk1/pp2bppp/2np4/2p1p3/4P3/2NP1N2/PPP2PPP/R1BQR1K1 w - - 0 1" },
      { title: "Outposts", body: "An outpost is a square protected by your pawn where a piece (usually a knight) cannot be chased away by enemy pawns. A knight on an outpost in enemy territory is a dominating force.", fen: "r1bq1rk1/pppp1ppp/2n5/4n3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1" },
      { title: "Weak Squares", body: "A square that cannot be defended by a pawn is a weak square. If your opponent can place a piece on a weak square, it can be very difficult to dislodge. Pay attention to color complexes.", fen: "r1bq1rk1/ppp2ppp/2np4/4N3/2B1P3/3P4/PPP2PPP/R1BQ1RK1 b - - 0 1" },
      { title: "Open Files", body: "Rooks belong on open files (files with no pawns). If you have a semi-open file (only your opponent's pawn), try to place a rook on it. Control of open files often decides the game.", fen: "r4rk1/ppp2ppp/2np4/8/4P3/2NP4/PPP2PPP/R1B2RK1 w - - 0 1" },
    ],
  },
  {
    id: "endgame-basics",
    title: "Endgame Basics",
    category: "Endgame",
    duration: "8 min",
    icon: "🎯",
    slides: [
      { title: "King Activity", body: "In the endgame, the king transforms from a piece to protect into a fighting unit. Bring your king toward the center and use it to support your pawns and attack enemy pawns.", fen: "8/8/4k3/8/3K4/8/8/8 w - - 0 1" },
      { title: "Pawn Promotion", body: "Getting a pawn to the 8th rank is the most common way to win an endgame. Create passed pawns (pawns with no enemy pawns blocking their path) and push them. A queen is almost always the best promotion.", fen: "8/8/8/3k4/8/3KP3/8/8 w - - 0 1" },
      { title: "The Opposition", body: "Opposition is when two kings face each other with one square between them. The side NOT to move has the opposition, forcing the other king to give ground. This is a critical tool in pawn endgames.", fen: "8/8/8/3k4/8/3K4/8/8 w - - 0 1" },
      { title: "Rook Endgames", body: "Rook endgames are the most common. Key principles: active rooks belong behind passed pawns (yours and your opponent's), cut off the enemy king, and use the 7th rank as a battering ram.", fen: "8/8/8/8/8/8/7k/1R4K1 w - - 0 1" },
      { title: "Basic Checkmates", body: "The simplest checkmates: King + Queen vs King (force the king to edge, use queen to restrict), King + Rook vs King (same idea, but need both kings), Two Bishops (tricky but methodical).", fen: "8/8/8/8/8/8/6k1/3Q3K w - - 0 1" },
    ],
  },
  {
    id: "checkmate-patterns",
    title: "Checkmate Patterns",
    category: "Tactics",
    duration: "7 min",
    icon: "🏆",
    slides: [
      { title: "Back Rank Mate", body: "A classic mate where a rook or queen delivers checkmate on the back rank when the enemy king is trapped behind its own pawns. Always make an escape hole (moving a pawn) for your king to avoid this.", fen: "6k1/5ppp/8/8/8/8/8/5R1K w - - 0 1" },
      { title: "Smothered Mate", body: "A knight delivers checkmate while the enemy king is surrounded by its own pieces. This is one of the most beautiful checkmate patterns and often arises from a forced sequence of checks.", fen: "6k1/6pp/8/8/8/8/8/4N2K w - - 0 1" },
      { title: "Anastasia's Mate", body: "A rook and knight cooperate to deliver checkmate along the h-file. The knight covers the escape squares while the rook delivers check. A stunning pattern named after a novel by Wilhelm Heinse.", fen: "6k1/7p/8/8/8/8/8/5N1R w - - 0 1" },
      { title: "Scholar's Mate", body: "The classic four-move checkmate against beginners. White attacks the f7 square with queen and bishop. Black can easily defend by developing knights and not weakening the f7 pawn.", fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1" },
      { title: "Fool's Mate", body: "The fastest possible checkmate in chess (two moves). White delivers mate on f2 after Black makes two terrible opening moves. It's almost impossible in serious play but illustrates basic king safety.", fen: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/8/PPPPPP1P/RNBQKBNR w KQkq - 0 1" },
    ],
  },
];

const DEFAULT_TERMS: Term[] = [
  { term: "Algebraic Notation", category: "Notation", definition: "The standard system for recording chess moves. Files are labeled a-h (left to right) and ranks 1-8 (bottom to top from White's perspective)." },
  { term: "Back Rank Mate", category: "Tactics", definition: "Checkmate delivered on the 1st or 8th rank by a rook or queen when the enemy king is trapped behind its own pawns." },
  { term: "Blitz", category: "Time Controls", definition: "A fast time control where each player has 3-10 minutes for the entire game. Popular on online platforms." },
  { term: "Bullet", category: "Time Controls", definition: "An extremely fast time control where each player has under 3 minutes, often 1 minute per side." },
  { term: "Castling", category: "Rules", definition: "A special move where the king moves two squares toward a rook and the rook jumps over the king. Kingside (O-O) and Queenside (O-O-O)." },
  { term: "Center", category: "Strategy", definition: "The four central squares: d4, d5, e4, e5. Controlling the center is a fundamental strategic goal." },
  { term: "Check", category: "Rules", definition: "A direct attack on the king. The player in check must resolve it immediately by moving the king, blocking, or capturing the attacking piece." },
  { term: "Checkmate", category: "Rules", definition: "A position where the king is in check and there is no legal move to escape. This ends the game with a win for the attacking player." },
  { term: "Development", category: "Strategy", definition: "The process of moving pieces from their starting squares to active positions. Good development is essential in the opening." },
  { term: "Discovered Attack", category: "Tactics", definition: "An attack revealed when one piece moves out of the way of another. A powerful tactical motif that creates two threats." },
  { term: "En Passant", category: "Rules", definition: "A special pawn capture where a pawn that advanced two squares can be captured by an enemy pawn on the adjacent file as if it moved only one square." },
  { term: "Endgame", category: "Phases", definition: "The final phase of the game when few pieces remain. King activity becomes critical and pawn promotion is often the deciding factor." },
  { term: "FEN", category: "Notation", definition: "Forsyth-Edwards Notation — a standard notation for describing a chess position. Used to set up specific board positions for analysis." },
  { term: "Fianchetto", category: "Strategy", definition: "Developing a bishop to b2/g2 (or b7/g7) after moving the b- or g-pawn one square. Creates a powerful diagonal." },
  { term: "Fork", category: "Tactics", definition: "A single piece attacking two or more enemy pieces simultaneously. Knights are especially dangerous forking pieces." },
  { term: "Gambit", category: "Openings", definition: "A voluntary sacrifice of material (usually a pawn) in the opening to gain rapid development or positional compensation." },
  { term: "Initiative", category: "Strategy", definition: "The ability to make threats that force the opponent to respond. Having the initiative means you control the flow of the game." },
  { term: "Isolated Pawn", category: "Strategy", definition: "A pawn with no friendly pawns on adjacent files. Isolated pawns are weak because they cannot be defended by other pawns." },
  { term: "Middlegame", category: "Phases", definition: "The phase after the opening where both sides have developed and the main tactical and strategic battles take place." },
  { term: "Opposition", category: "Endgame", definition: "A king vs king situation where the kings face each other with one square between. The side to move is at a disadvantage." },
  { term: "Outpost", category: "Strategy", definition: "A square protected by a friendly pawn where a piece (often a knight) cannot be chased away by enemy pawns." },
  { term: "Passed Pawn", category: "Strategy", definition: "A pawn with no enemy pawns in front of it on the same file or on adjacent files. Passed pawns have promotion potential." },
  { term: "Pin", category: "Tactics", definition: "A piece is pinned when moving it would expose a more valuable piece behind it. Absolute pins are against the king." },
  { term: "Promotion", category: "Rules", definition: "When a pawn reaches the 8th rank, it must be promoted to a queen, rook, bishop, or knight. Queening is almost always best." },
  { term: "Rapid", category: "Time Controls", definition: "A time control with 10-60 minutes per player. A common format for tournaments and online play." },
  { term: "Sacrifice", category: "Tactics", definition: "Voluntarily giving up material to gain a larger advantage, often checkmate or a decisive attack." },
  { term: "Skewer", category: "Tactics", definition: "Like a reverse pin — a valuable piece in front must move, exposing a less valuable piece behind it. Common with bishops and rooks." },
  { term: "Stalemate", category: "Rules", definition: "A position where the player to move has no legal moves but is NOT in check. The game ends in a draw." },
  { term: "Tempo", category: "Strategy", definition: "A unit of time in chess — one move. Winning a tempo means gaining a move relative to the opponent. Losing a tempo wastes a move." },
  { term: "Zugzwang", category: "Strategy", definition: "A position where any move the player makes worsens their position. Common in endgames where the side to move is at a disadvantage." },
];

const DEFAULT_OPENINGS: Opening[] = [
  {
    id: "ruy-lopez",
    name: "Ruy Lopez",
    eco: "C60",
    moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5",
    category: "King's Pawn",
    fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    description: "One of the oldest and most popular openings. White immediately attacks the defender of the e5 pawn, aiming for long-term positional pressure and a slight edge.",
    keyIdeas: ["Attack the e5 pawn's defender", "Long-term positional pressure", "Castle kingside early", "Reroute the b5 bishop to c2 (Giuoco Piano-like plan)"],
    winRate: { white: 54, black: 29, draw: 17 },
  },
  {
    id: "sicilian",
    name: "Sicilian Defense",
    eco: "B20",
    moves: "1. e4 c5",
    category: "King's Pawn",
    fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
    description: "The most popular response to 1.e4. Black fights for the center asymmetrically, creating imbalances that lead to sharp, dynamic play. A favorite of aggressive players.",
    keyIdeas: ["Create counterplay on the c-file", "Asymmetrical pawn structure", "Counter-attack rather than symmetry", "Dragon, Najdorf, Scheveningen variations"],
    winRate: { white: 47, black: 37, draw: 16 },
  },
  {
    id: "queens-gambit",
    name: "Queen's Gambit",
    eco: "D06",
    moves: "1. d4 d5 2. c4",
    category: "Queen's Pawn",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2",
    description: "A solid classical opening offering a pawn to gain central control. Not truly a gambit — the c4 pawn can usually be recovered or exchanged for central dominance.",
    keyIdeas: ["Offer pawn for rapid development", "Control d5 square", "Free the c1 bishop", "Accepted or declined — both solid for White"],
    winRate: { white: 52, black: 27, draw: 21 },
  },
  {
    id: "kings-indian",
    name: "King's Indian Defense",
    eco: "E60",
    moves: "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7",
    category: "Queen's Pawn",
    fen: "rnbqk2r/ppppppbp/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    description: "Black allows White to build a big center, then attacks it with piece pressure. A dynamic, fighting defense favored by Fischer and Kasparov. Leads to razor-sharp positions.",
    keyIdeas: ["Fianchetto the king's bishop", "Let White take the center", "Attack with ...e5 or ...c5 later", "Dynamic counterplay against the center"],
    winRate: { white: 46, black: 38, draw: 16 },
  },
  {
    id: "french",
    name: "French Defense",
    eco: "C00",
    moves: "1. e4 e6 2. d4 d5",
    category: "King's Pawn",
    fen: "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
    description: "A solid counter to 1.e4. Black closes the center and creates a solid pawn structure, often leading to queenside counterplay. The main drawback is the passive c8 bishop.",
    keyIdeas: ["Solid pawn structure", "Create queenside counterplay", "Attack the d4 pawn with ...c5", "The c8 bishop can be problematic"],
    winRate: { white: 49, black: 34, draw: 17 },
  },
  {
    id: "caro-kann",
    name: "Caro-Kann Defense",
    eco: "B10",
    moves: "1. e4 c6 2. d4 d5",
    category: "King's Pawn",
    fen: "rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
    description: "A solid and reliable defense to 1.e4. Unlike the French, Black's c8 bishop has freedom. Favored by many World Champions including Capablanca and Karpov.",
    keyIdeas: ["Solid pawn structure without blocked bishop", "Recapture on d5 with c6 pawn", "Strong endgame prospects", "Less dynamic than Sicilian but more solid"],
    winRate: { white: 48, black: 32, draw: 20 },
  },
  {
    id: "italian",
    name: "Italian Game",
    eco: "C50",
    moves: "1. e4 e5 2. Nf3 Nc6 3. Bc4",
    category: "King's Pawn",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    description: "One of the oldest openings, aiming to control the center and target the vulnerable f7 square. Leads to open, tactical positions ideal for learning chess.",
    keyIdeas: ["Target f7 square", "Control the center with pawns", "d3 or d4 push", "Often leads to Giuco Piano or Evans Gambit"],
    winRate: { white: 52, black: 28, draw: 20 },
  },
  {
    id: "pirc",
    name: "Pirc Defense",
    eco: "B07",
    moves: "1. e4 d6 2. d4 Nf6 3. Nc3 g6",
    category: "King's Pawn",
    fen: "rnbqk2r/ppppppbp/5np1/8/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 4 4",
    description: "A hypermodern defense where Black allows White to occupy the center, then attacks it with pieces. Named after Slovenian grandmaster Vasja Pirc.",
    keyIdeas: ["Fianchetto king's bishop", "Attack White's center with ...c5 or ...e5", "Flexible pawn structure", "Counter-attack mindset"],
    winRate: { white: 50, black: 30, draw: 20 },
  },
  {
    id: "english",
    name: "English Opening",
    eco: "A10",
    moves: "1. c4",
    category: "Flank Openings",
    fen: "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1",
    description: "A flexible flank opening that often transposes into Queen's Gambit or Sicilian structures. White controls the d5 square and delays central pawn commitments.",
    keyIdeas: ["Control d5 square", "Flexible transposition options", "Often leads to Hedgehog structures", "Solid choice avoiding heavy theory"],
    winRate: { white: 48, black: 29, draw: 23 },
  },
  {
    id: "scandinavian",
    name: "Scandinavian Defense",
    eco: "B01",
    moves: "1. e4 d5",
    category: "King's Pawn",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
    description: "Black immediately challenges the center by attacking e4. After 2. exd5 Qxd5, Black's queen comes out early but can be a target for White's pieces to gain time.",
    keyIdeas: ["Immediate center challenge", "Queen develops early", "White gains tempo attacking the queen", "Solid but slightly passive for Black"],
    winRate: { white: 45, black: 32, draw: 23 },
  },
  {
    id: "nimzo-indian",
    name: "Nimzo-Indian Defense",
    eco: "E20",
    moves: "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4",
    category: "Queen's Pawn",
    fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    description: "A hypermodern opening where Black pins the knight to restrict White's pawn center. One of the most respected defenses, played by virtually every world champion.",
    keyIdeas: ["Pin the c3 knight", "Fight for control of e4", "Double White's c-pawns", "Dynamic piece play against the center"],
    winRate: { white: 48, black: 32, draw: 20 },
  },
  {
    id: "petrov",
    name: "Petrov's Defense",
    eco: "C42",
    moves: "1. e4 e5 2. Nf3 Nf6",
    category: "King's Pawn",
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 3",
    description: "Also known as the Russian Game, this symmetrical defense is known for being solid and drawish. Black immediately copies White's move to create symmetry.",
    keyIdeas: ["Symmetrical response to 1.e4", "Solid and drawish reputation", "4...Qxd4 or 4...Nxe4 main lines", "Known for being hard to beat"],
    winRate: { white: 40, black: 36, draw: 24 },
  },
];

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "ChessInsight Pro",
  description: "Advanced Agentic Coding Environment",
  maintenanceMode: false,
};

function getItemId(item: any): string | undefined {
  return item.id || item.term;
}

function findIndex(arr: any[], item: any): number {
  const id = getItemId(item);
  if (!id) return -1;
  return arr.findIndex((e) => getItemId(e) === id);
}

export async function seedContent(service: ContentService) {
  const seedItems = [
    { slug: "rules", type: "rules", data: DEFAULT_RULES },
    { slug: "lessons", type: "lessons", data: DEFAULT_LESSONS },
    { slug: "terms", type: "terms", data: DEFAULT_TERMS },
    { slug: "openings", type: "openings", data: DEFAULT_OPENINGS },
    { slug: "site-settings", type: "settings", data: DEFAULT_SITE_SETTINGS },
  ];

  for (const item of seedItems) {
    const existing = await service.getPublishedContent<any>(item.slug);

    if (!existing) {
      await service.publishContent(item.slug, item.type, item.data, "system-seeder", "System seed");
      console.log(`Seeded CMS content: ${item.slug} (new)`);
      continue;
    }

    if (Array.isArray(existing) && Array.isArray(item.data)) {
      let changed = false;
      const merged = [...existing];

      for (const seedItem of item.data) {
        if (findIndex(merged, seedItem) === -1) {
          merged.push(seedItem);
          changed = true;
        }
      }

      if (changed) {
        await service.publishContent(item.slug, item.type, merged, "system-seeder", "Auto-merge: new items added");
        console.log(`Seeded CMS content: ${item.slug} (${merged.length - existing.length} new items added, ${existing.length} kept)`);
      } else {
        console.log(`Seeded CMS content: ${item.slug} (up to date — ${existing.length} items)`);
      }
    } else if (typeof existing === "object" && existing !== null && typeof item.data === "object" && !Array.isArray(item.data)) {
      let changed = false;
      const merged = { ...existing };

      for (const [key, value] of Object.entries(item.data)) {
        if (!(key in merged)) {
          (merged as any)[key] = value;
          changed = true;
        }
      }

      if (changed) {
        await service.publishContent(item.slug, item.type, merged, "system-seeder", "Auto-merge: new settings added");
        console.log(`Seeded CMS content: ${item.slug} (merged)`);
      } else {
        console.log(`Seeded CMS content: ${item.slug} (up to date)`);
      }
    } else {
      await service.publishContent(item.slug, item.type, item.data, "system-seeder", "Schema migration overwrite");
      console.log(`Seeded CMS content: ${item.slug} (overwritten — schema changed)`);
    }
  }
}
