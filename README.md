# ChessInsight Pro

**The all-in-one chess improvement platform — AI-powered game analysis, tactical training, personalized coaching, and enterprise-grade telemetry.**

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
- [Telemetry & Intelligence Platform](#telemetry--intelligence-platform)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Internal Packages (28 workspaces)](#internal-packages-28-workspaces)
- [Core Modules and Functions](#core-modules-and-functions)
- [Page-by-Page Feature Guide](#page-by-page-feature-guide)
- [Admin Analytics Dashboard](#admin-analytics-dashboard)
- [ELO System](#elo-system)
- [Persistence and Storage](#persistence-and-storage)
- [Getting Started](#getting-started)
- [Scripts Reference](#scripts-reference)
- [Deployment](#deployment)

---

## Overview

**ChessInsight Pro** is a full-featured, offline-first chess improvement platform built as a **Next.js 15 pnpm monorepo**. It runs **100% in the browser** including the Stockfish 18 chess engine compiled to WebAssembly (WASM).

### Core Philosophy

- **Zero compute server required** — Stockfish runs as a WebAssembly worker entirely in the browser.
- **Privacy first** — all games and profile data are stored locally in IndexedDB via Dexie.
- **Integrated improvement loop** — analyze a game, detect weaknesses, do targeted puzzles, track ELO.
- **Data-Driven Product** — Full-featured, offline-capable Telemetry Pipeline capturing usage and health metrics to Turso/SQLite.
- **Personalized AI coaching** — 7 distinct coach personalities powered by a narrative generation engine.

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
| **Openings Explorer** | Browse openings with move trees, ECO codes, and typical plans |
| **Coordinate Trainer** | Square-name recognition speed game with accuracy tracking |
| **Analysis Board** | Free-play sandbox with move history and FEN loader |
| **Player Analytics** | Weakness detection, ELO tracking, spaced repetition study cards |
| **Admin Dashboard** | Real-time SSE monitor and aggregated intelligence reports using Recharts |
| **Robust Telemetry** | Zod-validated, Dexie-queued event pipeline tracking feature adoption and engine health |

---

## Architecture

ChessInsight Pro is a **pnpm monorepo** with one frontend application and 28 internal TypeScript packages representing distinct business domains.

```
ChessInsightPro/
├── apps/
│   └── web/                    # Next.js 15 frontend application
│       ├── src/
│       │   ├── app/            
│       │   │   ├── admin/      # Admin Analytics Dashboards
│       │   │   ├── api/        # Telemetry ingestion & SSE Live endpoints
│       │   │   ├── puzzles/    # Puzzle modes
│       │   │   ├── learn/      # Learning modes
│       │   │   ├── train/      # Training modes
│       │   │   ├── profile/    # Player analytics
│       │   │   └── page.tsx    # Home: Game Reviewer
│       │   ├── components/     # AnalyticsProvider, BoardView, etc.
│       │   └── lib/            # db.ts (Turso & Dexie), intelligence-repo.ts
│       └── public/
│           ├── engines/        # Stockfish 17/18 WASM binaries
│           └── sounds/         # WebM audio files
├── packages/                   # 28 internal TypeScript packages
│   ├── core/                   # Telemetry, Intelligence, Engine, Chess
│   ├── analysis/               # Evaluator, Tactical, Positional, Narrative
│   ├── player/                 # Profile, Weakness-Detector, Recommendations
│   ├── training/               # Learning, Puzzles
│   └── visualization/          # Charts, Heatmaps
└── pnpm-workspace.yaml
```

---

## Telemetry & Intelligence Platform

We have successfully separated **Telemetry** (data capture) from **Intelligence** (aggregation/reporting).

### `@core/telemetry`
- **Synchronous Event Bus**: In-memory pub/sub decoupling SDK calls from the queue.
- **Strict Validation**: All events pass through strict Zod schemas ensuring `event_id`, `timestamp`, `platform`, `category`, and `event_type` are valid.
- **Offline Queue**: Uses Dexie/IndexedDB to queue events locally. When the user comes back online, events are batch-flushed to the server.
- **Domain API**: Developers use `telemetry.analysis.started()` rather than raw string tracking.

### `@core/intelligence`
- **Intelligence Repository**: Defines the interface for querying aggregated domain data (`OverviewMetrics`, `ProductMetrics`, `PlayerMetrics`).
- **No SQL Logic**: The intelligence layer is agnostic to the storage mechanism.
- **Turso/SQLite Implementation**: The actual implementation lives in `apps/web/src/lib/intelligence-repo.ts` and uses `unstable_cache` to ensure dashboards load instantly without slamming the database.

---

## Technology Stack

| Domain | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | Next.js | 15.x | App Router, SSR, Server Actions |
| **Language** | TypeScript | 5.7 | Strict typings across all 28 packages |
| **Engine** | Stockfish 18 | 18.0.8 | WebAssembly single-threaded build |
| **Local State**| Zustand | 5.0 | Global reactive state |
| **Local DB** | Dexie | 4.0 | IndexedDB for Games, Profiles, Telemetry Queue |
| **Remote DB** | Turso / libSQL | — | SQLite database for Telemetry ingestion |
| **Validation** | Zod | 3.23 | Schema validation for events and API boundaries |
| **Charts** | Recharts | 2.15 | Dashboard and Win-chance visualization |
| **Styling** | Tailwind CSS | 3.4 | Utility-first CSS |

---

## Internal Packages (28 workspaces)

The monorepo has grown to encompass 28 strictly bounded packages:

### Core Layer
- `@core/telemetry`: Event bus, Zod schemas, offline Dexie queue, and domain SDK.
- `@core/intelligence`: Aggregation domain models and `IntelligenceRepository`.
- `@core/engine`: Stockfish WebWorker integration.
- `@core/chess`: chess.js wrappers and FEN/PGN parsing.
- `@core/auth`, `@core/pricing`, `@core/quota`, `@core/db-sync`, `@core/email`, `@core/config`, `@core/openings`

### Analysis Layer
- `@analysis/evaluator`: Win-chance percentage conversion.
- `@analysis/positional`: Pawn structure, piece activity, space.
- `@analysis/tactical`: Pins, skewers, forks, hanging pieces.
- `@analysis/classifier`: Brilliant / Best / Good / Inaccuracy / Mistake / Blunder.
- `@analysis/narrative`: 7 distinct coach personality generators.
- `@analysis/puzzle-miner`

### Player & Training Layer
- `@player/profile`: ELO estimation and accuracy tracking.
- `@player/weakness-detector`: Scans games for recurring tactical blind spots.
- `@player/recommendations`: Suggests study topics.
- `@training/learning`: Spaced Repetition (Leitner) manager.
- `@training/puzzles`: Blunder generator and built-in puzzle library.

### Visualization & Shared
- `@visualization/charts`: Recharts formatting logic.
- `@visualization/heatmaps`: Piece activity visualization.
- `@shared/types`: Universal TypeScript interfaces.
- `@shared/utils`: Common utility functions.

---

## Admin Analytics Dashboard

Access the dashboard at `/admin/analytics`. Built exclusively with React Server Components, `unstable_cache`, and Recharts.

1. **Overview Dashboard**: High-level KPIs (Total Users, Sessions, Events) and sparkline trends.
2. **Product Analytics**: Feature adoption funnels and page view tracking.
3. **Chess Engine Health**: WASM memory usage and average evaluation times.
4. **Player Intelligence**: ELO distributions and aggregated weakness detection across the user base.
5. **Live Monitoring**: Uses **Server-Sent Events (SSE)** via `/api/analytics/live` to tail the telemetry firehose in real-time without polling.
6. **Additional Dashboards**: Learning, Puzzles, Training, and User Retention.

All dashboards include global Date Range filters, CSV/JSON Export capabilities, and graceful empty states.

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
| Failed | any | any | -10 |

After every change: `window.dispatchEvent(new Event("profile-updated"))` → sidebar badge updates live.

---

## Persistence and Storage

### 1. Zustand persist — localStorage
Key: `chess-insight-settings`
Persists: `engineVersion`, `boardTheme`, `coachStyle`, `boardOrientation`

### 2. Dexie — IndexedDB
Database: `ChessInsightProDb`
- `games`: Full analyzed games including all move evaluations and coach narratives.
- `profiles`: Player ELO, accuracy history, detected weaknesses.
- `learning`: Spaced repetition Leitner box card state.
- `telemetry_queue`: Offline event buffer.

### 3. Turso — Remote SQLite
- `analytics_events`: Central telemetry repository. Optimized with top-level indexed columns (`timestamp`, `platform`, `app_version`, `user_id`, `category`, `event_type`) to avoid expensive JSON parsing during aggregation.

---

## Getting Started

### Prerequisites
- **Node.js** 20 or later
- **pnpm** 9 or later
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/prayingforthelastsunbeam/ChessInsightPro.git
cd ChessInsightPro

# Install all dependencies
pnpm install

# Setup your local environment variables (Turso URL and Auth Token)
cp apps/web/.env.example apps/web/.env.local

# Start the development server
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## Scripts Reference

All scripts run from the **repository root**:

| Script | Command | Description |
|---|---|---|
| Dev server | `pnpm dev` | Next.js dev server at localhost:3000 with hot reload |
| Production build | `pnpm build` | Build all packages + Next.js production bundle |
| Linter | `pnpm lint` | ESLint across all workspaces |
| Type check | `pnpm typecheck` | `tsc --noEmit` across all 28 workspaces |
| Engine setup | `pnpm setup-engines` | Copy Stockfish WASM to public/engines/ |

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
# Set Root Directory: apps/web
# Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel settings
```

---

Built with chess and care. **ChessInsight Pro v2.0**

*"Every grandmaster was once a beginner who refused to stop analyzing."*
