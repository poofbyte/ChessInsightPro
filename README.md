# ChessInsight Pro

**The all-in-one chess improvement platform — AI-powered game analysis, tactical training, and personalized coaching.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Stockfish](https://img.shields.io/badge/Stockfish-18-green)](https://stockfishchess.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io/)

---

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Internal Packages](#internal-packages)
- [Core Modules and Functions](#core-modules-and-functions)
- [Page-by-Page Feature Guide](#page-by-page-feature-guide)
- [ELO System](#elo-system)
- [Hint System](#hint-system)
- [Sound System](#sound-system)
- [Board Themes](#board-themes)
- [Persistence and Storage](#persistence-and-storage)
- [Getting Started](#getting-started)
- [Scripts Reference](#scripts-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

**ChessInsight Pro** is a full-featured, offline-first chess improvement platform built as a **Next.js 15 pnpm monorepo**. It runs **100% in the browser** including the Stockfish 18 chess engine compiled to WebAssembly (WASM) — no backend required.

### Core Philosophy

- **Zero server required** — Stockfish runs as a WebAssembly worker entirely in the browser
- **Privacy first** — all games and profile data are stored locally in IndexedDB via Dexie
- **Integrated improvement loop** — analyze a game, detect weaknesses, do targeted puzzles, track ELO
- **Personalized AI coaching** — 7 distinct coach personalities powered by a narrative generation engine

---

## Key Features

| Feature | Description |
|---|---|
| **Game Analyzer** | Paste any PGN or Lichess URL — Stockfish 18 evaluates every position |
| **Virtual Coach** | 7 AI personalities: Friendly, Professional, Roast, Beginner, Tactical, Positional, Minimal |
| **Win-Chance Chart** | Interactive Recharts timeline showing evaluation swing across the whole game |
| **Blunder Puzzles** | Auto-generates playable puzzles directly from your game blunders |
| **Daily Puzzle** | Live Lichess daily puzzle with 3-level hint system and ELO rewards |
| **Puzzle Rush** | Beat-the-clock tactical puzzle mode with score tracking |
| **Puzzle Battle** | Accuracy-based competitive puzzle mode (10 puzzles, scored) |
| **Custom Puzzles** | 500+ built-in puzzles filterable by theme and difficulty |
| **Lessons** | Structured chess lessons organized by skill level |
| **Play Coach** | Play practice games against an adaptive coaching bot |
| **Openings Explorer** | Browse openings with move trees, ECO codes, and typical plans |
| **Coordinate Trainer** | Square-name recognition speed game with accuracy tracking |
| **Analysis Board** | Free-play sandbox with move history and FEN loader |
| **Endgame Practice** | Focused training on critical endgame positions |
| **Player Analytics** | Weakness detection, ELO tracking, spaced repetition study cards |
| **Board Themes** | 6 premium color themes applied globally to every board in the app |
| **Sound Effects** | Context-aware audio: move, capture, castle, check, promote |
| **Click-to-Move** | Tap a piece to see legal moves as green dots, tap destination to move |
| **Keyboard Navigation** | Left/right arrow keys navigate moves in Game Reviewer |
| **localStorage History** | Puzzle solve history persisted locally, shown in Recent History panel |

---

## Architecture

ChessInsight Pro is a **pnpm monorepo** with one frontend application and 15+ internal TypeScript packages.

```
ChessInsightPro/
├── apps/
│   └── web/                    # Next.js 15 frontend application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   │   ├── page.tsx    # Home: Game Reviewer
│       │   │   ├── store.ts    # Zustand global state
│       │   │   ├── pipeline.ts # Analysis orchestration
│       │   │   ├── db.ts       # Dexie IndexedDB schema
│       │   │   ├── puzzles/    # 4 puzzle mode pages
│       │   │   ├── learn/      # 6 learning pages
│       │   │   ├── train/      # 3 training pages
│       │   │   ├── profile/    # Player analytics
│       │   │   └── settings/   # App settings
│       │   ├── components/     # Shared React components
│       │   └── lib/            # Utility helpers
│       └── public/
│           ├── engines/        # Stockfish 17 and 18 WASM binaries
│           ├── sounds/         # 8 WebM audio files
│           └── piece/          # Chess piece SVG sets
├── packages/                   # 15 internal TypeScript packages
├── scripts/
│   └── setup-engines.js        # Copies Stockfish WASM to public/ on install
└── pnpm-workspace.yaml
```

### Data Flow (Game Analysis)

```
User inputs PGN or Lichess URL
        |-- resolvePgnFromUrl() -- fetch PGN text if URL
        |-- parsePgn()          -- extract moves, FENs, headers
        |-- analyzeGame()       -- pipeline.ts orchestration loop
               |-- fetchLichessCloudEval()              (cloud cache, fast path)
               |-- StockfishWasmProvider.evaluate()     (local WASM, fallback)
               |-- calculatePositionalMetrics()
               |-- detectTacticalMotifs()
               |-- classifyMove()   --> Brilliant/Best/Good/Inaccuracy/Mistake/Blunder
               |-- NarrativeGenerator.generate()  --> 7 coach personalities x every move
               |-- calculateGameAccuracy()
               |-- WeaknessDetector.detectWeaknesses()
               |-- SpacedRepetitionManager (Leitner cards)
        |-- db.games.put() + db.profiles.put()  -- IndexedDB via Dexie
        |-- React renders: BoardView + GameLineChart + Move list + Coach tab
```

---

## Technology Stack

### Frontend Framework

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.x | React framework — App Router, SSR, file-based routing |
| **React** | 18.3 | UI component library |
| **TypeScript** | 5.7 | Static typing across all packages |
| **Tailwind CSS** | 3.4 | Utility-first CSS for all styling |
| **Framer Motion** | 11.x | Animations and smooth transitions |

### Chess Engine

| Technology | Version | Purpose |
|---|---|---|
| **Stockfish 18** | 18.0.8 | Primary chess engine — WASM lite single-threaded build |
| **Stockfish 17** | — | Alternative engine (lighter, user-selectable in Settings) |
| **chess.js** | — | Move legality, FEN/PGN parsing wrapped in chess-core package |

Both engines run 100% in the browser via WebAssembly — no backend server required.

### State and Storage

| Technology | Version | Purpose |
|---|---|---|
| **Zustand** | 5.0 | Global reactive state — game, board, settings |
| **Dexie** | 4.0 | IndexedDB wrapper — persistent local storage for games and profiles |
| **localStorage** | Native | Puzzle solve history and user preferences persistence |

### UI Libraries

| Technology | Version | Purpose |
|---|---|---|
| **react-chessboard** | 4.7 | Interactive chess board with drag-and-drop |
| **Recharts** | 2.15 | Win-chance evaluation line chart |
| **lucide-react** | 0.468 | Comprehensive icon set |

### External APIs (No Auth Required)

| API | Purpose |
|---|---|
| **Lichess Cloud Eval API** | GET /api/cloud-eval — free cached position evaluations |
| **Lichess Daily Puzzle API** | GET /api/puzzle/daily — today's featured puzzle |

---

## Project Structure

```
apps/web/src/
├── app/
│   ├── page.tsx              # Game Reviewer (home page — flagship feature)
│   ├── layout.tsx            # Root layout: wraps all pages in SidebarShell
│   ├── globals.css           # Global Tailwind base + custom animations
│   ├── store.ts              # Zustand store: game state, board theme, settings
│   ├── pipeline.ts           # analyzeGame() — Stockfish orchestration
│   ├── db.ts                 # Dexie schema: games, profiles, learning tables
│   ├── profile/page.tsx      # Player Analytics dashboard
│   ├── settings/page.tsx     # Engine, board theme, coach personality settings
│   ├── puzzles/
│   │   ├── daily/page.tsx    # Daily Puzzle — live from Lichess API
│   │   ├── rush/page.tsx     # Puzzle Rush — 3-minute countdown mode
│   │   ├── battle/page.tsx   # Puzzle Battle — 10-puzzle accuracy mode
│   │   └── custom/page.tsx   # Custom Puzzles — 500+ with filters
│   ├── learn/
│   │   ├── lessons/page.tsx
│   │   ├── play-coach/page.tsx
│   │   ├── openings/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── rules/page.tsx
│   │   └── coordinates/page.tsx
│   └── train/
│       ├── sandbox/page.tsx  # Analysis board / free-play sandbox
│       ├── endgames/page.tsx
│       └── practice/page.tsx
├── components/
│   ├── BoardView.tsx         # Universal chess board (used on every page)
│   ├── GameLineChart.tsx     # Win-chance evaluation chart (Recharts)
│   ├── Sidebar.tsx           # Left navigation sidebar
│   └── SidebarShell.tsx      # Layout wrapper that loads ELO from DB for sidebar
└── lib/
    └── pgn-resolver.ts       # Resolves PGN from raw text or Lichess URL
```

---

## Internal Packages

All packages live under `packages/` and are referenced as `@chessinsight/<name>` workspace dependencies.

| Package | Description |
|---|---|
| `@chessinsight/types` | Shared TypeScript interfaces: Game, Move, MoveEvaluation, GameEval, PlayerProfile, CoachStyle |
| `@chessinsight/chess-core` | chess.js wrapper — Chess class, parsePgn(), getEvaluateGameParams(), moveLineUciToSan() |
| `@chessinsight/engine` | StockfishWasmProvider — loads Stockfish WASM into a Web Worker, returns MultiPV evaluations |
| `@chessinsight/evaluator` | getLineWinPercentage() converts centipawns to win%, fetchLichessCloudEval() for cloud cache |
| `@chessinsight/positional` | calculatePositionalMetrics() — pawn structure, piece activity, king safety |
| `@chessinsight/tactical` | detectTacticalMotifs() — Fork, Pin, Skewer, HangingPiece, Sacrifice |
| `@chessinsight/classifier` | classifyMove() — maps win-chance delta to Brilliant/Best/Good/Inaccuracy/Mistake/Blunder |
| `@chessinsight/narrative` | NarrativeGenerator.generate(facts, style) — coach commentary for 7 personalities |
| `@chessinsight/player-profile` | initializeProfile(), updateProfileWithGame(), calculateGameAccuracy() |
| `@chessinsight/weakness-detector` | WeaknessDetector.detectWeaknesses(games) — finds recurring tactical blind spots |
| `@chessinsight/recommendations` | RecommendationEngine.getRecommendations(profile) — suggests study topics |
| `@chessinsight/puzzles` | BlunderPuzzleGenerator, 500+ built-in puzzles, getRandomPuzzle() |
| `@chessinsight/learning` | SpacedRepetitionManager — Leitner box: createInitialProgress(), updateConceptProgress() |
| `@chessinsight/charts` | VisualizationFormatter.formatTimeline() — formats data for Recharts |
| `@chessinsight/heatmaps` | Piece activity heatmap generation |

---

## Core Modules and Functions

### Analysis Pipeline (pipeline.ts)

The central function called when the user clicks Analyze Game.

```typescript
analyzeGame(
  game: Game,
  engineVersion: "17" | "18",
  onProgress: (progress: number) => void
): Promise<GameEval>
```

**Execution steps:**

1. **Engine init** — `new StockfishWasmProvider(enginePath)` + `engine.initialize()` loads WASM into Web Worker
2. **Position extraction** — `getEvaluateGameParams(game.pgn)` returns `{ fens, uciMoves }`
3. **Per-position loop** — for each FEN:
   - Try `fetchLichessCloudEval(fen, 2)` (cloud cache, fast)
   - On cache miss: `engine.evaluatePosition(fen, depth=10, multiPv=2)` (local Stockfish)
   - `calculatePositionalMetrics(fen)` — pawn structure, space, king safety
   - `detectTacticalMotifs(prevFen, playedMove, fen, bestLinePv)`
   - `classifyMove({ lastWinChance, currentWinChance, ... })`
   - `NarrativeGenerator.generate(facts, style)` for all 7 CoachStyle values
4. **Accuracy** — `calculateGameAccuracy(winChances)` returns `{ white, black }` percentages
5. **Cleanup** — `engine.terminate()` shuts down the Web Worker

**Returns:** `GameEval` with `positions[]`, `accuracy`, and `settings`.

---

### Global State Store (store.ts)

Built with **Zustand** + `persist` middleware.

```typescript
const store = useChessStore();
```

**State fields:**

| Field | Type | Description |
|---|---|---|
| `game` | `Game or null` | Currently loaded game |
| `boardFen` | `string` | FEN of the currently shown board position |
| `currentMoveIndex` | `number` | 0 = start position, N = move N |
| `evaluation` | `GameEval or null` | Full Stockfish analysis result |
| `isAnalyzing` | `boolean` | True while Stockfish is running |
| `analysisProgress` | `number` | 0–100 progress bar value |
| `coachStyle` | `CoachStyle` | Active coach personality |
| `boardOrientation` | `white or black` | Which side is shown at the bottom |
| `engineVersion` | `17 or 18` | Which Stockfish build to use |
| `boardTheme` | `BoardThemeId` | Active board color scheme |

**Actions:**

| Action | What it does |
|---|---|
| `setGame(game)` | Loads game, resets index to 0 |
| `setCurrentMoveIndex(i)` | Navigates to move i, updates FEN, plays move sound |
| `setEvaluation(eval)` | Stores Stockfish analysis result |
| `toggleBoardOrientation()` | Flips white and black at bottom |
| `setBoardTheme(id)` | Changes board colors globally across all pages |
| `setCoachStyle(style)` | Switches coach personality |
| `setEngineVersion(v)` | Switches between Stockfish 17 and 18 |
| `reset()` | Clears game and analysis state |

**Persisted to localStorage** (key: `chess-insight-settings`): `engineVersion`, `boardTheme`, `coachStyle`, `boardOrientation`

**playMoveSound(san) utility:**

```typescript
// Routes to the correct WebM file based on SAN notation:
// san.includes("O-O")        -> castle.webm
// san.includes("+") or "#"   -> move-check.webm
// san.includes("x")          -> capture.webm
// san.includes("=")          -> promote.webm
// otherwise                  -> move.webm
```

---

### Database Layer (db.ts)

Built with **Dexie 4** — a Promise-based IndexedDB wrapper.

Database name: `ChessInsightProDb`

| Table | Key | Stores |
|---|---|---|
| `games` | `id` | Full analyzed games with all move evaluations and coach narratives |
| `profiles` | `playerId` | Player ELO, accuracy history, detected weaknesses |
| `learning` | `conceptId` | Leitner spaced repetition card state |

```typescript
// Common queries:
await db.games.put(newGame);                           // save/update game
const profile = await db.profiles.get("default-user");// load profile
const games = await db.games.reverse().toArray();      // all games, newest first
const cards = await db.learning.toArray();             // all learning cards
```

---

### BoardView Component (BoardView.tsx)

The universal chess board used on every page of the app.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `fen` | `string` | FEN position to display |
| `orientation` | `white or black` | Which color is at the bottom |
| `onPieceDrop` | `(from, to) => boolean` | Called on drag-drop and click-to-move |
| `arePiecesDraggable` | `boolean` | False makes board read-only |
| `boardWidth` | `number` | Fixed width — omit to auto-measure |
| `onSquareClick` | `(square) => void` | Raw click forwarded to parent |
| `customSquareStyles` | `Record<string, CSSProperties>` | Per-square CSS — used for hint highlights |
| `customArrows` | `[from, to, hexColor][]` | Arrows drawn on board — MUST use hex color format |

**Key behaviors:**

- **Auto-sizing**: Uses `ResizeObserver` to always fill container width — perfect square at any screen size
- **Global board theme**: Reads `boardTheme` from Zustand store, passes colors to react-chessboard. Theme changes in Settings update every board instantly
- **Click-to-move**: Click a piece → see green dots (quiet moves) or hollow rings (captures) → click destination to move. Works alongside drag-and-drop
- **Hint overlay priority**: Parent `customSquareStyles` are merged AFTER click-to-move dots, so hint highlights always win
- **State reset**: `selectedSquare` and `moveOptionSquares` clear on every `fen` or `arePiecesDraggable` change
- **Error safety**: All chess operations inside `handleSquareClick` are wrapped in try/catch — bad FENs never crash the app

**Square style merge:**
```typescript
const mergedSquareStyles = {
  ...moveOptionSquares,      // click-to-move dots (lower priority)
  ...(customSquareStyles)    // hint highlights (higher priority)
};
```

---

### Sidebar and Navigation (Sidebar.tsx)

Persistent left navigation shown on all pages. Active item has a teal left border and background tint.

**Routes:**

| Section | Item | Route |
|---|---|---|
| — | Game Reviewer | / |
| — | Player Analytics | /profile |
| Puzzles | Daily Puzzle | /puzzles/daily |
| Puzzles | Puzzle Rush | /puzzles/rush |
| Puzzles | Puzzle Battle | /puzzles/battle |
| Puzzles | Custom Puzzles | /puzzles/custom |
| Learn | Lessons | /learn/lessons |
| Learn | Play Coach | /learn/play-coach |
| Learn | Openings | /learn/openings |
| Learn | Chess Terms | /learn/terms |
| Learn | Rules | /learn/rules |
| Learn | Coordinates | /learn/coordinates |
| Train | Analysis | /train/sandbox |
| Train | Endgames | /train/endgames |
| Train | Practice | /train/practice |
| — | Settings | /settings |

ELO badge at the bottom reads from IndexedDB via `SidebarShell.tsx` and updates in real-time when `window.dispatchEvent(new Event("profile-updated"))` fires after any puzzle completion.

---

## Page-by-Page Feature Guide

### Game Reviewer — /

The flagship feature. Deep analysis of any chess game using Stockfish 18.

**How to use:**
1. Paste a PGN string or a Lichess game URL (e.g., https://lichess.org/AbCdEfGh)
2. Click Analyze Game — progress bar shows 0–100% as Stockfish evaluates each position
3. Navigate moves using the arrow buttons or keyboard arrow keys
4. Read per-move coach commentary in the Coach tab
5. Click any Blunder move to launch a mini-puzzle from that position

**UI sections:**
- **Chessboard** — interactive, flip button, evaluation bar showing white/black advantage
- **Win-Chance Chart** — Recharts line graph; hover/click any point to jump to that move
- **Move List tab** — color-coded move quality badges: Brilliant (blue), Best (green), Good (yellow-green), Inaccuracy (orange), Mistake (red), Blunder (dark red)
- **Coach tab** — per-move narrative from the selected coach personality
- **Metrics tab** — positional factors per move: pawn structure, piece activity, king safety
- **Historical games** — sidebar list of all analyzed games; click to reload any
- **Player profile** — ELO, accuracy %, weakness count shown at top

**Key functions:**

```
handlePgnAnalyze()
  1. resolvePgnFromUrl(input)                    -- fetch PGN if URL, use raw text otherwise
  2. parsePgn(text)                              -- extract headers, moves, FENs
  3. analyzeGame(game, engineVersion, progress)  -- Stockfish analysis loop
  4. db.games.put(newGame)                       -- persist to IndexedDB
  5. updateProfileWithGame(profile, accuracy)    -- update ELO estimate
  6. WeaknessDetector.detectWeaknesses([game])   -- find tactical blind spots
  7. SpacedRepetitionManager                     -- create/update Leitner cards
  8. store.setGame(newGame)                      -- load into reactive state

launchPuzzle(game, moveIndex)
  -- BlunderPuzzleGenerator.generatePuzzleFromBlunder(game, moveIndex)
  -- Sets activePuzzle state, board switches to puzzle mode

handlePuzzleMove(from, to, promotion)
  -- Validates move UCI against activePuzzle.solutionMoves[puzzleMoveIdx]
  -- On match: playMoveSound, puzzleSuccess=true
  -- On mismatch: play illegal-move.webm, puzzleSuccess=false

getEvalState()
  -- Returns { score: "+1.2", percent: 65, isWhiteAhead: true }
  -- Handles mate scores: score="M3", percent=100 or 0
```

---

### Player Analytics — /profile

Personal improvement dashboard. Populated after at least one game is analyzed.

- **Estimated ELO** — derived from game accuracy
- **Games analyzed** count
- **Weakness cards** — recurring motifs detected across all games (Pins, Hanging Pieces, etc.)
- **Recommendations** — `RecommendationEngine.getRecommendations(profile)` suggests study topics
- **Spaced repetition queue** — Leitner cards due for review today via `SpacedRepetitionManager.getCardsForReview()`

WeaknessDetector scans analyzed games for positions where the user consistently played Mistake or Blunder moves involving specific tactical motifs, and ranks them by frequency and severity.

---

### Daily Puzzle — /puzzles/daily

Live tactical puzzle from `GET https://lichess.org/api/puzzle/daily`.

**Puzzle flow:**
1. Fetch puzzle — get `puzzle.fen`, `puzzle.solution[]`, `puzzle.themes`, `rating.rating`
2. Load FEN, auto-play `solution[0]` (opponent's move to set up the tactic)
3. Player must find `solution[1]`
4. On correct: advance `moveIdx`, auto-play opponent reply after 600ms, repeat
5. On wrong: play illegal sound, increment mistakes
6. On completion: `updateEloForPuzzle()`, `saveToHistory()`

**Key functions:**

```
handleMove(from, to)
  -- Validates against solution[moveIdx] (with "q" promotion fallback)
  -- On correct: chess.move(), playMoveSound(), advance moveIdx
  -- On wrong: play illegal-move.webm, setMistakesCount(prev+1)

handleRequestHint()
  -- Level 0->1: show piece type ("Try moving your Knight")
  -- Level 1->2: amber glow on source square
  -- Level 2->3: amber arrow on board + both squares highlighted
  -- Increments currentMoveHintLevel and totalHintsUsed

handleAutoSolve()
  -- Applies -10 ELO immediately, plays remaining solution with 750ms delays

updateEloForPuzzle(hintsUsed, mistakes, isSolved)
  -- Calculates ELO delta, calls db.profiles.put(), dispatches profile-updated event

resetPuzzle()
  -- Reloads from puzzle.fen, replays solution[0], resets all state to idle

saveToHistory(record)
  -- Reads, deduplicates, prepends, slices to 50, writes back to localStorage
  -- Key: chess_insight_solved_puzzles
```

Recent History panel shows last 10 solved puzzles from localStorage.

---

### Puzzle Rush — /puzzles/rush

Solve as many puzzles as possible before the 3-minute timer reaches zero.

**Rules:**
- Timer: 180 seconds, +5s per correct solve
- Wrong move: load next puzzle immediately (no retry)
- Score = total correct solves

**ELO on session end:** Score 0-2: -5 | Score 3-7: +0 | Score 8-14: +5 | Score 15+: +10

Timer is managed via `setInterval`. All 3 hint levels available per puzzle, reset on each new load.

---

### Puzzle Battle — /puzzles/battle

Accuracy-focused mode — 10 puzzles, no time limit.

- Each puzzle scored: `max(0, 100 - hintsUsed*15 - mistakes*20)`
- Session accuracy = average of all 10 scores
- ELO proportional to final accuracy

---

### Custom Puzzles — /puzzles/custom

Browse and filter the built-in puzzle library.

**Filters:** Theme (Fork, Pin, Skewer, Back Rank, Discovered Attack, Double Check, Mate in 1/2, Hanging Piece, Endgame) and Difficulty (Easy <1200, Medium 1200-1600, Hard >1600).

After solving: **Next Puzzle** button appears, loading a random puzzle from current filter set. Every solve is saved to `localStorage` key `chess_insight_solved_puzzles`.

---

### Lessons — /learn/lessons

Structured lessons by level: Tactics fundamentals, Piece values, Checkmate patterns, Opening principles, Middlegame strategy, Endgame technique, Special moves.

---

### Play Coach — /learn/play-coach

Play practice games against an adaptive coaching bot that explains its moves.

---

### Openings Explorer — /learn/openings

Browse common openings with ECO codes, move trees, and strategic plans. Filter by color and opening family.

---

### Chess Terms — /learn/terms

Searchable glossary of 50+ terms with definitions and board examples. Includes: Fork, Pin, Skewer, Zwischenzug, Zugzwang, Tempo, Initiative, Prophylaxis, and more.

---

### Rules — /learn/rules

Interactive rules reference: piece movement, castling, en passant, promotion, check, checkmate, stalemate, all draw conditions.

---

### Coordinate Trainer — /learn/coordinates

Speed game: a square name is displayed, click it on the board. 30 squares per session, tracks average response time and accuracy %.

---

### Analysis Board (Sandbox) — /train/sandbox

Free-play chess board for exploring positions and testing ideas.

**Features:** Move history navigation, board flip, reset, FEN loader, move log, status bar.

**Design — FEN as single source of truth:**

```typescript
// NO shared mutable Chess instance. FEN string is the only state.
const [fen, setFen] = useState(INITIAL_FEN);
const [history, setHistory] = useState<string[]>([INITIAL_FEN]);

const handleMove = (from: string, to: string) => {
  try {
    const chess = new Chess(fen);          // fresh instance from current FEN
    const result = chess.move({ from, to, promotion: "q" });
    if (!result) return false;
    const newFen = chess.fen();
    setHistory([...history.slice(0, histIdx + 1), newFen]);
    setHistIdx(prev => prev + 1);
    setFen(newFen);
    return true;
  } catch {
    return false;  // invalid moves silently ignored
  }
};
```

Why? A shared Chess instance accumulates state across renders and desyncs with React's concurrent model. Reconstructing from FEN is cheap and always correct.

```
goBack()      -- setHistIdx(-1), setFen(history[newIdx])
goForward()   -- setHistIdx(+1), setFen(history[newIdx])
loadFen()     -- validates with new Chess(trimmed), clears history
gameStatus()  -- new Chess(fen) to check isCheckmate/isDraw/isCheck
```

---

### Endgames — /train/endgames

King and pawn endgames, rook vs pawn, opposition, Lucena and Philidor positions, queen vs pawn.

---

### Practice — /train/practice

Tactical drill mode — repeat the same categories until patterns are automatic.

---

### Settings — /settings

Global configuration, persisted via Zustand to localStorage.

**Engine:** Stockfish 18 (default, stronger) or Stockfish 17 (lighter). Both are WASM builds, no install needed.

**Board Themes (6, applied globally):**

| ID | Name | Dark Square | Light Square |
|---|---|---|---|
| `slate` | Classic Slate | #2d3748 | #4a5568 |
| `teal` | Ocean Teal | #2b3447 | #3f4b66 |
| `green` | Tournament Green | #769656 | #eeeed2 |
| `walnut` | Dark Walnut | #5d3a1a | #c8a47a |
| `purple` | Royal Purple | #4a2c6e | #9b72cf |
| `ice` | Arctic Ice | #2c4a6e | #a8d8ea |

**Coach Personalities (7):**

| Style | Tone |
|---|---|
| Friendly | Warm, encouraging, accessible |
| Professional | Objective, technical, formal |
| Beginner | Simple words with extra explanations |
| Roast | Playful trash-talk about blunders |
| Positional | Structure, plans, long-term factors |
| Tactical | Combinations, calculation, forcing lines |
| Minimal | One sentence, no fluff |

---

## ELO System

Starting ELO: **1200** — Minimum: **100**

### ELO change per puzzle:

| Outcome | Hints Used | Mistakes | ELO Change |
|---|---|---|---|
| Solved | 0 | 0 | +10 |
| Solved | 1 | 0 | +2 |
| Solved | 2 | 0 | +0 |
| Solved | 3 | 0 | -5 |
| Solved | any | N | above minus (N x 2) |
| Auto-Solved or Failed | any | any | -10 |

After every change: `window.dispatchEvent(new Event("profile-updated"))` → sidebar badge updates live.

---

## Hint System

All four puzzle modes use the same 3-level progressive hint system.

| Level | Visual Effect | Information Revealed |
|---|---|---|
| 1 of 3 | Hint text card appears | Piece type only ("Try moving your Knight") |
| 2 of 3 | Amber glow ring on source square | Source square name ("The piece is on F3") |
| 3 of 3 | Amber arrow on board, both squares highlighted | Full move ("Move from F3 to E5") |

**Implementation notes:**
- Square highlight: `boxShadow: "inset 0 0 0 3px rgba(251,191,36,0.9)"`
- Arrow color: `"#fbbf24"` — MUST be hex format, not rgb() — react-chessboard SVG canvas requires hex
- 3 dot indicators fill amber as hints are revealed

**Why two separate counters:**

```typescript
const [currentMoveHintLevel, setCurrentMoveHintLevel] = useState(0);
// Gates the hint button. Resets to 0 on every new puzzle/move.

const [totalHintsUsed, setTotalHintsUsed] = useState(0);
// Cumulative, used ONLY for ELO penalty. Never gates the button.
```

This ensures all 3 hints are always accessible on every new move regardless of hints used on previous moves.

---

## Sound System

8 WebM audio files in `/public/sounds/`:

| File | Trigger |
|---|---|
| `move.webm` | Normal quiet piece move |
| `capture.webm` | Capture (SAN contains x) |
| `castle.webm` | Castling (SAN contains O-O) |
| `move-check.webm` | Check or checkmate (SAN contains + or #) |
| `promote.webm` | Pawn promotion (SAN contains =) |
| `illegal-move.webm` | Wrong move in puzzle mode |
| `game-start.webm` | Navigating to move 0 in Game Reviewer |
| `game-end.webm` | Game conclusion |

All audio at volume 0.6 with `.play().catch(() => {})` to handle browser autoplay restrictions silently.

---

## Board Themes

```typescript
export const BOARD_THEMES = {
  slate:  { label: "Classic Slate",    dark: "#2d3748", light: "#4a5568" },
  teal:   { label: "Ocean Teal",       dark: "#2b3447", light: "#3f4b66" },
  green:  { label: "Tournament Green", dark: "#769656", light: "#eeeed2" },
  walnut: { label: "Dark Walnut",      dark: "#5d3a1a", light: "#c8a47a" },
  purple: { label: "Royal Purple",     dark: "#4a2c6e", light: "#9b72cf" },
  ice:    { label: "Arctic Ice",       dark: "#2c4a6e", light: "#a8d8ea" },
};
```

BoardView reads the theme from Zustand on every render and passes it to react-chessboard via `customDarkSquareStyle` and `customLightSquareStyle`. Changing the theme in Settings instantly updates all boards in the app with no page reload.

---

## Persistence and Storage

### 1. Zustand persist — localStorage

Key: `chess-insight-settings`

Persists: `engineVersion`, `boardTheme`, `coachStyle`, `boardOrientation`

Volatile game state (the current game, analysis results, progress) is excluded via `partialize` — it always starts fresh.

### 2. Dexie — IndexedDB

Database: `ChessInsightProDb`

| Table | Data |
|---|---|
| `games` | Full analyzed games including all move evaluations and coach narratives |
| `profiles` | Player ELO, accuracy history, detected weaknesses — one record per user |
| `learning` | Spaced repetition Leitner box card state — one record per tactical concept |

### 3. Puzzle History — localStorage

Key: `chess_insight_solved_puzzles`

Each entry: `{ id, solvedAt (ISO 8601), hintsUsed (0-3), mistakes, eloChange, themes[] }`

Maximum 50 entries, newest first. Older entries discarded. Last 10 shown in the Daily Puzzle Recent History panel.

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later — https://nodejs.org
- **pnpm** 9 or later — `npm install -g pnpm`
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/prayingforthelastsunbeam/ChessInsightPro.git
cd ChessInsightPro

# Install all dependencies
# The postinstall script automatically copies Stockfish WASM to apps/web/public/engines/
pnpm install

# Start the development server
pnpm dev
```

Open http://localhost:3000 in your browser.

### Manual engine setup (if needed)

```bash
pnpm setup-engines
```

Copies `stockfish-18-lite-single.js` and `stockfish-17-lite-single.js` into `apps/web/public/engines/`.

---

## Scripts Reference

All scripts run from the **repository root**:

| Script | Command | Description |
|---|---|---|
| Dev server | `pnpm dev` | Next.js dev server at localhost:3000 with hot reload |
| Production build | `pnpm build` | Build all packages + Next.js production bundle |
| Linter | `pnpm lint` | ESLint across all workspaces |
| Type check | `pnpm typecheck` | tsc --noEmit across all workspaces |
| Engine setup | `pnpm setup-engines` | Copy Stockfish WASM to public/engines/ |

```bash
# Target a specific workspace:
pnpm --filter web exec tsc --noEmit
pnpm --filter web build
```

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
# Set Root Directory: apps/web
```

Or push to GitHub, import at vercel.com, set Root Directory to `apps/web`.

### Netlify

Create `netlify.toml` at repo root:

```toml
[build]
  base    = "apps/web"
  command = "cd ../.. && pnpm install && pnpm --filter web build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Docker

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
```

```bash
docker build -t chessinsight-pro .
docker run -p 3000:3000 chessinsight-pro
```

### Self-hosted VPS (Linux + PM2)

```bash
git clone https://github.com/prayingforthelastsunbeam/ChessInsightPro.git
cd ChessInsightPro
pnpm install && pnpm build

npm install -g pm2
pm2 start "pnpm --filter web start" --name chessinsight
pm2 save && pm2 startup
```

Nginx reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment Variables

No environment variables required. Everything runs client-side. Lichess API is unauthenticated.

Optional: `NEXT_PUBLIC_APP_URL=https://your-domain.com` in `apps/web/.env.local`

---

## Contributing

```bash
git clone https://github.com/YOUR_USERNAME/ChessInsightPro.git
cd ChessInsightPro && pnpm install

git checkout -b feature/my-feature
# make changes
pnpm typecheck && pnpm lint

git commit -m "feat: add opening name detection"
git push origin feature/my-feature
# open a Pull Request on GitHub
```

### Code Conventions

| Rule | Detail |
|---|---|
| TypeScript | No `any` without an explanatory comment |
| Components | Functional only, no class components |
| State | Zustand for global, useState for local |
| Async errors | All async operations in try/catch |
| Chess operations | Always `new Chess(fen)` from current FEN — never mutate a shared instance |
| chess.move() | Always wrap in try/catch — the package throws on invalid moves |
| Arrow colors | Always hex format (#fbbf24) — never rgb() — react-chessboard SVG requires hex |
| Sounds | Always `.play().catch(() => {})` to handle autoplay restrictions |
| ELO changes | Always dispatch `window.dispatchEvent(new Event("profile-updated"))` after update |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with chess and care. **ChessInsight Pro v2.0**

*"Every grandmaster was once a beginner who refused to stop analyzing."*
