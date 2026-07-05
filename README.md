# ChessInsight Pro — v2.0 Production Monorepo

ChessInsight Pro is an advanced web application for chess game analysis and review designed to serve as **the Duolingo of Chess Improvement**. Rather than just displaying engine calculations, it focuses on explaining moves conceptually using virtual coach personalities, detecting player weaknesses over time, and generating interactive training puzzles from player blunders under spaced-repetition schedules.

---

## 🏗️ Architecture Overview

The repository is organized as a high-performance monorepo using `pnpm` workspaces:

```
├── apps/
│   └── web/                         # Next.js App Router UI, Zustand store, and Dexie storage
├── packages/
│   ├── core/
│   │   ├── chess/                   # chess.js rules and parsing wrappers
│   │   ├── engine/                  # Web Worker Stockfish WASM lifecycle provider
│   │   └── openings/                # ECO openings dictionary and lookup
│   ├── analysis/
│   │   ├── evaluator/               # Lichess win-chance calculations & cloud cache fetching
│   │   ├── positional/              # Tension, mobility, and space control metrics
│   │   ├── tactical/                # Fork, pin, sacrifice, check, and hanging piece detectors
│   │   ├── classifier/              # Centipawn-based move quality categorization
│   │   └── narrative/               # Multi-personality Virtual Coach storytelling engine
│   ├── player/
│   │   ├── profile/                 # Historic ELO curves and performance stats
│   │   ├── weakness-detector/       # Aggregates move history for systemic error tracking
│   │   └── recommendations/         # Matches weaknesses to study programs
│   ├── training/
│   │   ├── puzzles/                 # Generates interactive training puzzles from game blunders
│   │   └── learning/                # Spaced repetition Leitner Box progression schedules
│   ├── visualization/
│   │   ├── charts/                  # Prepares data points for Recharts timelines
│   │   └── heatmaps/                # Calculates square-coordinate frequencies on chess boards
│   └── shared/
│       ├── types/                   # Unified interfaces for the entire system
│       └── utils/                   # Bounding and platform utilities
├── archive/                         # Legacy reference folder (Chesskit, open-source models)
└── pnpm-workspace.yaml              # Workspace topology rules
```

---

## 🛠️ Tech Stack & Requirements

- **Runtime & Package Manager**: Node.js (v18+) and `pnpm` (v9+)
- **Frontend Framework**: Next.js 15 (App Router), React 18
- **State Management**: Zustand
- **Database (Offline Cache)**: Dexie.js (IndexedDB wrapper)
- **Chess Board UI**: `react-chessboard` & `chess.js`
- **Charts**: Recharts
- **CSS**: Tailwind CSS

---

## 🚀 Getting Started

### 1. Prerequisite: PNPM & Windows Setup
If you are developing on Windows and run into command-not-found or execution policy errors:
- **Install PNPM globally**:
  ```powershell
  npm install -g pnpm
  ```
- **Allow script execution (PowerShell)**:
  If PowerShell blocks running `pnpm` or `npx` script wrappers, open PowerShell and run:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
  ```

### 2. Install Dependencies & Assemble Engines
Run the install command from the root workspace directory:
```bash
pnpm install
```
> [!NOTE]
> During installation, a postinstall hook (`scripts/setup-engines.js`) runs automatically to assemble the full Stockfish 17 WebAssembly engines (`stockfish-17.wasm` and `stockfish-17-single.wasm`) from their split parts. These parts were split to adhere to GitHub's 100MB file limit. If you ever need to manually trigger engine assembly, run:
> ```bash
> pnpm run setup-engines
> ```

### 3. Topological Compilation
Build all packages in the correct topological order:
```bash
pnpm run build
```

### 4. Run Development Server
Spin up the Next.js dev server:
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.


---

## 💾 Local Storage Schema (Dexie.js)

The application operates fully offline by persisting data locally inside the browser using IndexedDB:

- **`games`**: Stores PGN inputs, move sequences, centipawn evaluations, tactical motifs, and coach narratives.
- **`profiles`**: Aggregates ratings history, estimated ELO curve logs, and detected weaknesses.
- **`learning`**: Tracks spaced-repetition card boxes (`Box 1` to `Box 5`), streaks, and scheduled study review times.

---

## 🤖 Stockfish Web Worker Orchestration

Local browser calculations are processed using Stockfish 17 (lite single-thread WASM build) located inside the `public/engines/` directory.

- The `@chessinsight/engine` package boots Stockfish inside a standard browser Web Worker to prevent UI freezing.
- The pipeline utilizes a double-pv search (`MultiPV = 2`) to calculate both the played move and the best alternative move, enabling precise quality evaluation.
