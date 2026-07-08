# ChessInsight Pro

**The all-in-one chess improvement platform — AI-powered game analysis, tactical training, Stockfish 18 WASM engine, CMS-driven learning, and enterprise-grade telemetry.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Stockfish](https://img.shields.io/badge/Stockfish-18-green)](https://stockfishchess.org/)
[![Turso](https://img.shields.io/badge/Turso-libSQL-4FC08D)](https://turso.tech/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io/)

---

## Table of Contents

- [Overview](#overview)
- [Core Philosophy](#core-philosophy)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Internal Packages (26 workspaces)](#internal-packages-26-workspaces)
- [Page-by-Page Feature Guide](#page-by-page-feature-guide)
- [API Routes](#api-routes)
- [Shared Components](#shared-components)
- [Database Schema (18 Tables)](#database-schema-18-tables)
- [Zustand Stores](#zustand-stores)
- [Admin Panel Features](#admin-panel-features)
- [Security Architecture](#security-architecture)
- [Telemetry & Analytics Pipeline](#telemetry--analytics-pipeline)
- [ELO System](#elo-system)
- [Persistence & Storage](#persistence--storage)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts Reference](#scripts-reference)
- [Deployment](#deployment)

---

## Overview

**ChessInsight Pro** is a full-featured, offline-first chess improvement platform built as a **Next.js 15 pnpm monorepo**. It runs **100% in the browser** — including the Stockfish 18 chess engine compiled to WebAssembly (WASM) — with a remote Turso/libSQL database for persistence and analytics.

The platform serves **three personas**:

- **Players** — Analyze games, solve puzzles, train tactics, track ELO, study openings/lessons
- **Coaches** — 7 AI coach personalities provide narrative feedback on every move
- **Admins** — Full CMS, user/billing management, real-time analytics dashboards

---

## Core Philosophy

- **Zero compute server required** — Stockfish runs as a WebAssembly worker entirely in the browser. No cloud evaluation servers needed.
- **Privacy first** — Games and profiles stored locally in IndexedDB via Dexie; server sync is optional.
- **Integrated improvement loop** — Analyze a game → detect weaknesses → get targeted puzzles → track ELO → repeat.
- **Data-Driven** — Full-featured telemetry pipeline captures usage and health metrics to Turso/SQLite for business intelligence.
- **Personalized AI coaching** — 7 distinct coach personalities powered by a narrative generation engine (plus optional Hugging Face integration).

---

## Key Features

| Feature | Description |
|---|---|
| **Game Analyzer** | Paste PGN, upload file, or resolve Lichess/Chess.com URL — Stockfish 18 evaluates every position |
| **Stockfish 18/17 WASM** | Two engine versions compiled to WebAssembly, runs in-browser via Web Worker |
| **Move Classification** | Brilliant / Best / Good / Inaccuracy / Mistake / Blunder — based on win-probability deltas |
| **Virtual Coach** | 7 AI personalities: Professional, Friendly, Roast, Beginner, Tactical, Positional, Minimal |
| **Win-Chance Chart** | Interactive Recharts timeline showing evaluation swing across the whole game |
| **Blunder Puzzles** | Auto-generates playable puzzles directly from your game blunders |
| **Tactical Motif Detection** | Detects forks, pins, skewers, sacrifices, hanging pieces, discovered attacks |
| **Positional Metrics** | Development count, mobility, tension, piece control per position |
| **Accuracy Scoring** | Per-side accuracy percentage from win-chance deltas |
| **Weakness Detection** | Scans all games for recurring tactical blind spots (forks, pins, hanging pieces, etc.) |
| **Study Recommendations** | Maps detected weaknesses to specific study topics with suggested actions |
| **Daily Puzzle** | Server-fetched daily puzzle with 3-level hint system and ELO rewards |
| **Puzzle Rush** | Beat-the-clock mode — 3 minutes, 3 strikes, speed scoring |
| **Puzzle Battle** | Race against a bot opponent — bot gets easier puzzles as it falls behind |
| **Custom Puzzles** | 30 built-in puzzles filterable by theme and difficulty rating |
| **Spaced Repetition (Leitner)** | Learning cards with 5-box Leitner system — review intervals: 1d, 3d, 7d, 14d, 30d |
| **Openings Explorer** | Browse 12+ openings with FEN, description, key ideas, win rates — CMS-driven |
| **Chess Lessons** | CMS-driven structured lessons organized by skill level with rich text |
| **Chess Rules** | CMS-driven rules reference with 8 core rules |
| **Chess Glossary** | CMS-driven glossary with 30+ chess terms with definitions |
| **Coordinate Trainer** | Two modes: Find the Square (click from coordinate) and Name the Square (type from highlight) |
| **Play & Coach** | Play against AI bots at 3 levels (600/1200/1800 ELO) with random coach tips |
| **Practice Scenarios** | 4 curated positions: Open Battle, Closed Strategy, Rook Endgame, Kingside Attack |
| **Endgame Training** | Curated endgame positions with goals, tips, and checkmate practice |
| **Analysis Sandbox** | Free-play board with move history, undo/redo, FEN loader, board flip |
| **Player Analytics** | ELO history chart, weakness radar chart, accuracy trends, learning card progress |
| **Pricing Plans** | Free / Pro / Elite / Custom plans with usage quotas, upgrade request workflow |
| **Contact Form** | Categorized contact form with confirmation email and admin reply management |
| **Settings Page** | Engine version selector, 6 board themes with live preview, coach style, contact form |
| **Navigation Guard** | Prevents accidental data loss during active puzzles/training/analysis |
| **Admin Dashboard** | Multi-tab admin with stats, user/billing/puzzle/content/contact management |
| **Admin Analytics** | 9 sub-dashboards: Overview, Product, Engine, Player, Learning, Puzzles, Training, Retention, Live SSE Monitor |
| **Robust Telemetry** | Zod-validated event pipeline with offline Dexie queue and periodic flush |

---

## Architecture

ChessInsight Pro is a **pnpm monorepo** with one Next.js 15 application and 26 internal TypeScript packages grouped into 7 workspace directories.

```
ChessInsightPro/
├── apps/
│   └── web/                          # Next.js 15 application
│       ├── src/
│       │   ├── app/                  # App Router pages + API routes
│       │   │   ├── (auth)/           # login, signup, forgot-password, reset-password
│       │   │   ├── (legal)/          # privacy, terms
│       │   │   ├── admin/            # +12 admin pages + analytics dashboards
│       │   │   ├── api/              # +40 API route handlers
│       │   │   ├── learn/            # lessons, openings, rules, terms, coordinates, play-coach
│       │   │   ├── puzzles/          # daily, custom, rush, battle
│       │   │   ├── train/            # sandbox, practice, endgames
│       │   │   ├── page.tsx          # Home: Game Analysis workspace
│       │   │   └── store.ts          # Zustand stores (auth + chess state)
│       │   ├── components/           # 17 shared UI components
│       │   └── lib/                  # db, auth, schema, sync, rating, puzzles, telemetry, activity-log
│       └── public/
│           ├── engines/              # Stockfish 17/18 WASM binaries
│           └── sounds/               # Move, capture, castle, check, promote .webm
├── packages/
│   ├── core/          (12)           # auth, chess, config, content, db-sync, email, engine,
│   │                                  # intelligence, openings, pricing, quota, telemetry
│   ├── analysis/      (6)            # classifier, evaluator, narrative, positional,
│   │                                  # puzzle-miner, tactical
│   ├── player/        (3)            # profile, recommendations, weakness-detector
│   ├── training/      (2)            # learning, puzzles
│   ├── visualization/ (1)            # charts
│   └── shared/        (2)            # types, utils
├── scripts/                          # setup-engines, split-stockfish, theme-replace
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vercel.json
```

---

## Technology Stack

| Domain | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | Next.js | 15.2.4 | App Router, Server Components, Server Actions |
| **Language** | TypeScript | 5.7 | Strict typings across all 26 packages |
| **Engine** | Stockfish 18 | 18.0.8 | WebAssembly single-threaded binary |
| **State** | Zustand | 5.x | Global reactive state + localStorage persist |
| **Client DB** | Dexie | 4.x | IndexedDB for offline games, profiles, learning cards, telemetry queue |
| **Remote DB** | Turso / libSQL | 0.14 | Edge-distributed SQLite database |
| **Validation** | Zod | 4.x | Schema validation for events, API boundaries, CMS content |
| **Charts** | Recharts | 2.15 | Dashboard and win-chance visualization |
| **Chess** | chess.js | — | Move validation, FEN/PGN parsing, legal move generation |
| **Auth** | bcryptjs + jsonwebtoken | — | Password hashing, JWT access/refresh tokens |
| **Email** | nodemailer | — | SMTP email sending for password reset, notifications |
| **AI** | @huggingface/inference | — | Optional LLM integration for Play Coach narratives |
| **Rich Text** | react-quill-new | — | CMS content editor for lessons and descriptions |
| **Styling** | Tailwind CSS | 3.4 | Utility-first CSS with dark/light theme support |
| **Board** | react-chessboard | — | Interactive chess board with drag-and-drop |
| **Icons** | lucide-react | — | Consistent icon set throughout the UI |

---

## Project Structure

### `apps/web/` — The Next.js Application

All source code lives under `src/app/` following the Next.js App Router convention:

**Page routes (34 pages):**

| Route | Type | Description |
|---|---|---|
| `/` | Client | Main game analysis workspace — PGN import, Stockfish evaluation, coach narrative, win-chart, blunder puzzles |
| `/login` | Client | Email/password login with rate-limit handling, callback URL redirect |
| `/signup` | Client | Registration with validation, auto-auth on success |
| `/forgot-password` | Client | Email form, sends reset link |
| `/reset-password` | Client | Token validation, new password form |
| `/pricing` | Client | Plan comparison + upgrade request modal with payment instructions |
| `/profile` | Client | ELO chart, weakness radar, learning cards, account editing |
| `/settings` | Client | Engine version, 6 board themes with live preview, coach style, contact form |
| `/contact-to-upgrade` | Client | View upgrade request status history |
| `/puzzles/daily` | Client | Daily puzzle with hints, ELO change, solve history |
| `/puzzles/custom` | Client | Filterable puzzle library by theme/difficulty |
| `/puzzles/rush` | Client | Timed mode — 3 min, 3 strikes, speed scoring |
| `/puzzles/battle` | Client | Race vs bot opponent with adaptive difficulty |
| `/train/sandbox` | Client | Free-play board with undo/redo/FEN loader |
| `/train/practice` | Client | 4 curated practice scenarios |
| `/train/endgames` | Client | Endgame catalog with categorized positions |
| `/learn/lessons` | Server→Client | CMS-driven lesson catalog with rich text |
| `/learn/openings` | Server→Client | CMS-driven opening explorer with stats |
| `/learn/rules` | Server→Client | CMS-driven chess rules reference |
| `/learn/terms` | Server→Client | CMS-driven chess glossary (30+ terms) |
| `/learn/coordinates` | Client | Find-the-square + name-the-square modes |
| `/learn/play-coach` | Client | Play vs AI bot (600/1200/1800 ELO) with coach tips |
| `/privacy` | Server | Static privacy policy |
| `/terms` | Server | Static terms of service |
| `/admin` | Client | Dashboard (stats/charts), upgrade requests, settings |
| `/admin/users` | Client | User CRUD, search, ban, activity logs |
| `/admin/puzzles` | Client | Puzzle list + manual mining trigger |
| `/admin/content` | Client | CMS editor — rules, openings, lessons, terms, pricing, site settings |
| `/admin/contact-messages` | Client | Contact inbox with reply, archive, status management |
| `/admin/activity-logs` | Client | User activity log viewer with search/filter |
| `/admin/audit-log` | Client | Admin action audit trail |
| `/admin/billing` | Client | Subscription management — extend, cancel, set expiry |
| `/admin/upgrade-requests` | Client | Approve/reject upgrade requests with admin notes |
| `/admin/analytics/*` (9) | Mixed | Overview, Product, Engine, Player, Learning, Puzzles, Training, Retention, Live SSE |

### `apps/web/src/lib/` — Core Application Library

| File | Purpose |
|---|---|
| `schema/index.ts` | 18 table definitions for `@core/db-sync` schema sync |
| `db.ts` | Turso client init, `ensureDbReady()` schema sync + admin bootstrap + CMS auto-seed |
| `auth.ts` | Server helpers: `requireAuth()`, `getAdminUserId()` JWT verification |
| `content.ts` | Singleton `ContentService` instance + `runContentSeeder()` |
| `activity-log.ts` | Client-side activity log POST helper |
| `intelligence-repo.ts` | `TursoIntelligenceRepository` — queries analytics_events for admin dashboards |
| `pgn-resolver.ts` | Fetches PGN from Lichess (direct) or Chess.com (via player archives) |
| `puzzle-db.ts` | 30 built-in puzzles + query helpers (by theme, rating, random) |
| `rating.ts` | `PuzzleRatingService` — ELO change calculation for puzzle attempts |
| `sync.ts` | Client-server data sync for games, profiles, learning cards |

---

## Internal Packages (26 workspaces)

### Core Layer — `packages/core/`

| Package | Dependencies | Purpose |
|---|---|---|
| **@chessinsight/chess-core** | chess.js | `parsePgn()`, `getEvaluateGameParams()`, `uciMoveParams()`, `getMaterialDifference()`, `getCapturedPieces()`, `isSimplePieceRecapture()`, `getIsPieceSacrifice()` |
| **@chessinsight/engine** | @chessinsight/types | `StockfishWasmProvider` — Web Worker-based Stockfish integration |
| **@chessinsight/openings** | @chessinsight/types | ~1000 opening positions database, `lookupOpening(fen)` |
| **@core/auth** | bcryptjs, jsonwebtoken, @libsql/client | JWT secret getters, password hash/verify, rate limiting (signup + login) |
| **@core/config** | @libsql/client | `getAllConfig()`, `setConfig()`, `setConfigBatch()` with 1-min TTL cache + audit logging |
| **@core/content** | zod | `ContentService`, `ContentRepository`, `seedContent()` — CMS with versioning |
| **@core/db-sync** | @libsql/client | `ensureSchema()` — auto-creates/migrates tables, safe column addition |
| **@core/email** | nodemailer | 7 email templates: welcome, password-reset, upgrade approved/rejected, contact confirmation/reply, admin notification |
| **@core/intelligence** | none | `IntelligenceRepository` interface + 11 metric domain types |
| **@core/pricing** | none | `calculateCustomPrice(reviews, sessions)` in BDT |
| **@core/quota** | @libsql/client | `checkQuota()`, `consumeQuota()` — plan-based usage limits |
| **@core/telemetry** | zod, dexie, uuid, @libsql/client | `TelemetryEventBus`, offline Dexie queue, Turso repository, domain SDK (`telemetry.analysis.started()`) |

### Analysis Layer — `packages/analysis/`

| Package | Purpose |
|---|---|
| **@chessinsight/classifier** | `classifyMove()` — 9-level move classification from Brilliant to Blunder based on win% delta |
| **@chessinsight/evaluator** | `getWinPercentageFromCp()`, `fetchLichessCloudEval()`, `getLineWinPercentage()` |
| **@chessinsight/narrative** | Move explanation generator with 7 distinct coaching personalities |
| **@chessinsight/positional** | `calculatePositionalMetrics()` — development, mobility, tension, control |
| **@chessinsight/puzzle-miner** | `minePuzzlesFromGame()` — scans evaluations for tactical swings |
| **@chessinsight/tactical** | `detectTacticalMotifs()` — fork, pin, skewer, sacrifice, hanging piece, mate threat |

### Player Layer — `packages/player/`

| Package | Purpose |
|---|---|
| **@chessinsight/player-profile** | `estimateElo(cpl)`, `calculateGameAccuracy()`, `updateProfileWithGame()` |
| **@chessinsight/weakness-detector** | `detectWeaknesses()` — finds recurring tactical blind spots across games |
| **@chessinsight/recommendations** | Maps weakness motifs to specific study recommendations |

### Training Layer — `packages/training/`

| Package | Purpose |
|---|---|
| **@chessinsight/learning** | 5-box Leitner spaced repetition manager |
| **@chessinsight/puzzles** | `BlunderPuzzleGenerator` — creates puzzles from game blunders |

### Visualization Layer — `packages/visualization/`

| Package | Purpose |
|---|---|
| **@chessinsight/charts** | `VisualizationFormatter.formatTimeline()` — converts evaluations to Recharts data points |

### Shared Layer — `packages/shared/`

| Package | Purpose |
|---|---|
| **@chessinsight/types** | All shared TypeScript interfaces, enums, and types for analysis, game, player, coach, engine, training, and openings |
| **@chessinsight/utils** | `ceilsNumber()`, `getPaddedNumber()`, `isIosDevice()`, `isMobileDevice()` |

---

## API Routes

### Authentication (`/api/auth/*`)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/login` | POST | No | Email/password auth, rate-limited, returns JWT access+refresh tokens |
| `/signup` | POST | No | Register user, rate-limited per IP, sends welcome email |
| `/logout` | POST | Cookie | Invalidates refresh token session |
| `/refresh` | POST | Cookie | Token rotation — issues new access+refresh token pair |
| `/forgot-password` | POST | No | HMAC-signed reset token (1hr expiry), sends email |
| `/reset-password` | POST | No | Validates token, updates password, invalidates all sessions |

### User Data (`/api/user/*`, `/api/profile`, `/api/games`)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/profile` | GET/PUT | Bearer | Chess profile (ELO, accuracy, weaknesses) |
| `/api/user/profile` | GET/PUT | Bearer | Account details (name, phone, URLs, bio) |
| `/api/user/quotas` | GET | Bearer | Plan quotas + current usage counts |
| `/api/user/upgrade-requests` | GET | Cookie | User's upgrade request history |
| `/api/games` | GET/POST | Bearer | Save/list analyzed games |

### Puzzles & Learning

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/puzzles/next` | GET | No | Random puzzle (optionally by theme) |
| `/api/puzzle-attempts` | POST | Bearer | Logs attempt, calculates ELO change |
| `/api/learning-cards` | GET/PUT | Bearer | Spaced repetition card state |

### Admin (`/api/admin/*`) — all require `getAdminUserId`

| Route | Methods | Description |
|---|---|---|
| `/api/admin/dashboard` | GET | Stats: users, plans, MRR, games, puzzles, time-series charts |
| `/api/admin/users` | GET/POST | Full user CRUD: list, create, edit, ban, delete |
| `/api/admin/puzzles` | GET/POST | List puzzles, trigger manual mining |
| `/api/admin/content` | GET/POST | CMS read/write — rules, lessons, terms, openings, config |
| `/api/admin/contact-messages` | GET/POST | Inbox with reply, archive, status management |
| `/api/admin/upgrade-requests` | GET/POST | List, approve, reject with admin notes + email |
| `/api/admin/settings` | GET/POST | Payment instructions, verification fields |
| `/api/admin/billing` | GET/POST | Subscription list, extend, expiry, cancel |
| `/api/admin/audit-log` | GET | Admin action audit trail (last 200) |
| `/api/admin/activity-logs` | GET | User activity logs with pagination/filter |
| `/api/admin/config` | GET/POST | Generic config key-value management |
| `/api/admin/pricing-config` | GET/POST | Plan definitions, features, prices |

### Analytics & System

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/analytics/track` | POST | No | Batch telemetry event ingestion |
| `/api/analytics/live` | GET | Admin | SSE real-time event stream (polls every 3s) |
| `/api/activity/log` | POST | Bearer | Activity event logging |
| `/api/contact` | POST | IP rate-limit | Contact form submission with confirmation email |
| `/api/cron/mine-puzzles` | POST | CRON_SECRET | Automated puzzle mining (Vercel Cron daily 3AM) |
| `/api/seed` | GET | Dev only | CMS content seeder |
| `/api/quota/check` | GET | No | Feature quota availability check |

---

## Shared Components

| Component | File | Purpose |
|---|---|---|
| **BoardView** | `BoardView.tsx` | Interactive chess board — drag-drop, click-to-move, legal move indicators, arrows, 6 themes |
| **Sidebar** | `Sidebar.tsx` | Responsive nav: logo, grouped links, profile/ELO/quota widget, theme toggle, admin links |
| **SidebarShell** | `SidebarShell.tsx` | Full-height layout: sidebar + mobile hamburger + main content |
| **NavigationGuard** | `NavigationGuard.tsx` | Triple-guard (beforeunload, popstate, link clicks) modal for active sessions |
| **SignUpPrompt** | `SignUpPrompt.tsx` | Hydrate-aware auth gate modal |
| **AnalyticsProvider** | `AnalyticsProvider.tsx` | Telemetry SDK init, session tracking, periodic queue flush (30s) |
| **ContactForm** | `ContactForm.tsx` | Validated form (name, email, subject, category, message) with loading/success/error states |
| **GameLineChart** | `GameLineChart.tsx` | Recharts LineChart for evaluation timeline |
| **RichTextEditor** | `RichTextEditor.tsx` | ReactQuill-based editor for CMS content (SSR-disabled) |
| **PageContainer** | `layout/PageContainer.tsx` | Full-height scrollable page wrapper |
| **ContentContainer** | `layout/ContentContainer.tsx` | Centered max-width content wrapper |
| **ResponsiveGrid** | `layout/ResponsiveGrid.tsx` | Responsive CSS grid (1→6 columns) |
| **Card** | `ui/Card.tsx` | Styled card container |
| **ResponsiveTable** | `ui/ResponsiveTable.tsx` | Table-on-desktop, cards-on-mobile responsive data display |
| **PricingTab** | `admin/PricingTab.tsx` | Admin pricing plan editor with RichTextEditor |
| **SettingsTab** | `admin/SettingsTab.tsx` | Admin site content editor |
| **SiteSettingsTab** | `admin/SiteSettingsTab.tsx` | Admin SEO/site config editor with maintenance mode |

---

## Database Schema (18 Tables)

The schema is defined at `apps/web/src/lib/schema/index.ts` and synced at startup via `@core/db-sync`:

| Table | Key Columns | Purpose |
|---|---|---|
| **users** | email, password_hash, plan, role, elo, is_banned | User accounts with plan and role management |
| **sessions** | user_id, refresh_token_hash, expires_at | JWT refresh token storage |
| **profiles** | user_id, elo, accuracy_history, weaknesses | Chess-specific player profiles |
| **games** | user_id, pgn, headers, analysis | Analyzed game storage |
| **content_entries** | slug (unique), content_type, status, published_version_id | CMS content entries with versioning |
| **content_revisions** | entry_id, data (JSON), author_id | CMS content revision history |
| **generated_puzzles** | fen, solution_uci, themes, rating, times_served | Auto-mined puzzles |
| **puzzle_attempts** | user_id, puzzle_id, hints_used, mistakes, elo_change | Solve attempt tracking |
| **learning_cards** | user_id, concept_id, box, due_at | Leitner spaced repetition |
| **usage_events** | user_id, event_type, created_at | Quota consumption tracking |
| **signup_attempts** | ip, created_at | Signup rate limiting |
| **login_attempts** | ip, email, success | Login rate limiting |
| **pending_upgrade_requests** | user_id, requested_plan, verification_details | Upgrade request workflow |
| **system_config** | key (unique), value, updated_by | Key-value configuration store |
| **admin_audit_log** | admin_user_id, action, target_type, details | admin action audit trail |
| **activity_logs** | user_id, activity_type, details | User activity tracking |
| **analytics_events** | event_id, category, event_type, timestamp, platform, properties | Telemetry event store |
| **contact_messages** | name, email, subject, category, message, status | Contact form submissions |
| **contact_replies** | message_id, body, sent_by | Contact message replies |

---

## Zustand Stores

### `useAuthStore` — persisted as `chessinsight-auth`
- `accessToken` / `user` — JWT auth state
- `setAuth(token, user)` / `clearAuth()` — login/logout actions
- Hydration-aware: `onFinishHydration` subscription prevents flash-of-wrong-content

### `useChessStore` — persisted as `chess-insight-settings`
- **Game state:** `game`, `boardFen`, `currentMoveIndex`, `evaluation`, `isAnalyzing`
- **UI state:** `activeTab`, `coachStyle`, `boardOrientation`
- **Settings:** `engineVersion` (17|18), `boardTheme` (6 themes), `theme` (dark/light)
- **Actions:** `setGame`, `setCurrentMoveIndex` (with sound effects), `toggleBoardOrientation`, `setTheme` (toggles dark class on `<html>`)
- **Sound effects:** Move / capture / castle / check / promote via `<audio>` elements
- **Migration:** Auto-migrates removed "green" theme → "classicLight"

---

## Admin Panel Features

The admin panel resides at `/admin/*` with role-based access control (`getAdminUserId`):

| Page | Route | Features |
|---|---|---|
| **Dashboard** | `/admin` | User/game/puzzle counts, MRR, signup/games time-series charts, recent upgrade requests |
| **Analytics** | `/admin/analytics` | 9 sub-dashboards: Overview (ISR 5min), Product, Engine, Player, Learning, Puzzles, Training, Retention, Live SSE Monitor |
| **Users** | `/admin/users` | Search, list, create, edit, ban/unban, delete with cascade, view activity logs |
| **Puzzles** | `/admin/puzzles` | Generated puzzle list, manual mining trigger |
| **Content** | `/admin/content` | CMS editor: rules, openings, lessons (with rich text), terms, pricing plans, site settings (SEO, maintenance mode) |
| **Contact Messages** | `/admin/contact-messages` | Inbox with search/filter, reply, archive, status (New/Read/Replied/Closed) |
| **Activity Logs** | `/admin/activity-logs` | Paginated user activity with type/user filters and detail modal |
| **Audit Log** | `/admin/audit-log` | Admin action audit trail with search |
| **Billing** | `/admin/billing` | Subscription list, extend expiry, set custom dates, cancel |
| **Upgrade Requests** | `/admin/upgrade-requests` | Approve/reject with admin notes and email notification |

### Live Analytics SSE Monitoring

`/admin/analytics/live` connects to `/api/analytics/live` via Server-Sent Events. The endpoint polls the `analytics_events` table every 3 seconds and pushes new events to connected admin clients. Shows connection status and real-time event stream.

---

## Security Architecture

### Authentication
- **JWT dual-token system:** Access tokens (7d expiry) + Refresh tokens (30d expiry, SHA-256 hashed in DB)
- **Token rotation:** Each refresh issues a new token pair, old refresh token is invalidated
- **Refresh token:** Stored in `httpOnly`, `secure` (prod), `SameSite=Lax` cookie
- **Rate limiting:** Progressive backoff — IP (5min), email (5min), email (1hr)
- **Passwords:** Bcrypt with cost factor 10, minimum 8 characters

### Database Security
- **All queries parameterized** — zero string interpolation of user input
- **`@core/db-sync` uses `safeId()`** — regex validation for SQL identifiers
- **No hardcoded secrets** — all secrets read from environment variables with explicit error throwing when missing
- **Dedicated password-reset secret** — separate from JWT signing secrets

### Authorization
- **`getAdminUserId()`** on every admin route — JWT verification + role check
- **`requireAuth()`** on protected user routes — returns 401 if invalid/missing token
- **Middleware disabled** intentionally — JWT verification requires Node.js crypto, unavailable in Edge Runtime

### CMS Content
- Input validation via Zod schemas for all content types
- Rich text editor sanitizes HTML on the frontend
- SQL injection prevention via parameterized queries in `ContentRepository`

---

## Telemetry & Analytics Pipeline

The telemetry system (`@core/telemetry`) provides:

1. **Event Bus** — Synchronous pub/sub for decoupling SDK calls from queue
2. **Zod Validation** — All events validated against strict schemas (eventId, timestamp, platform, category, eventType)
3. **X- Browser** — Supports `product.pageViewed()`, `product.sessionStarted()`, `analysis.started()`, `analysis.completed()`
4. **Offline Queue** — Events enqueued in IndexedDB via Dexie; flushed to server every 30 seconds or on page unload
5. **Server Ingestion** — `/api/analytics/track` accepts batch events, persists to `analytics_events` table in Turso
6. **Business Intelligence** — `TursoIntelligenceRepository` aggregates metrics for admin dashboards with Next.js data cache (`unstable_cache`)

Analytics dashboards use ISR (Incremental Static Regeneration) with `revalidate = 300` (5 minutes) for Overview and Product pages.

---

## ELO System

**Starting ELO:** 1200 — **Minimum:** 100

### ELO change per puzzle:

| Outcome | Hints Used | Mistakes | ELO Change |
|---|---|---|---|
| Solved | 0 | 0 | +10 |
| Solved | 1 | 0 | +2 |
| Solved | 2 | 0 | +0 |
| Solved | 3 | 0 | -5 |
| Solved | any | N | above minus (N × 2) |
| Failed | any | any | -10 |

After every change: `window.dispatchEvent(new Event("profile-updated"))` → sidebar badge updates live.

### Game ELO Estimation

`estimateElo(averageCpl, movesCount)` uses exponential decay:
- Low CPL (~30) → ~1800 ELO
- Medium CPL (~100) → ~1200 ELO  
- High CPL (~300) → ~400 ELO

---

## Persistence & Storage

### 1. Zustand persist — localStorage
- **`chessinsight-auth`**: `accessToken`, `user`
- **`chess-insight-settings`**: `engineVersion`, `boardTheme`, `coachStyle`, `boardOrientation`, `theme`

### 2. Dexie — IndexedDB
Database: `ChessInsightProDb`
- `games`: Full analyzed games with evaluations and narratives
- `profiles`: Player ELO, accuracy history, detected weaknesses
- `learning`: Spaced repetition Leitner card state (concept, box, next review date)
- `telemetry_queue`: Offline event buffer for telemetry

### 3. Turso — Remote SQLite
- `analytics_events`: Central telemetry store with indexed columns
- `system_config`: Application configuration with caching
- All user, game, session, puzzle, and CMS data

### 4. Schema Sync
`ensureDbReady()` in `apps/web/src/lib/db.ts`:
1. Calls `ensureSchema()` from `@core/db-sync` to create/migrate all 18 tables
2. Bootstraps initial admin account if `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD` are set
3. Auto-seeds CMS content (rules, lessons, terms, openings, site settings) via `seedContent()`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Yes | Turso database connection URL |
| `TURSO_AUTH_TOKEN` | Yes | Turso authentication token |
| `JWT_ACCESS_SECRET` | Yes | JWT access token signing secret |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh token signing secret |
| `JWT_PASSWORD_RESET_SECRET` | No | Dedicated password-reset secret (falls back to JWT_ACCESS_SECRET) |
| `CRON_SECRET` | Yes | Vercel cron job authentication |
| `HUGGINGFACE_API_KEY` | No | Hugging Face Inference API for Play Coach |
| `ADMIN_BOOTSTRAP_EMAIL` | No | Auto-create admin on first run |
| `ADMIN_BOOTSTRAP_PASSWORD` | No | Admin account password |
| `SMTP_HOST/PORT/USER/PASS` | No | SMTP/Gmail credentials for emails |
| `RESEND_API_KEY` | No | Resend email API key |
| `RESEND_FROM_EMAIL` | No | From address for Resend |
| `ADMIN_NOTIFICATION_EMAIL` | No | Admin notification recipient |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL for emails |

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

# Install all dependencies (postinstall auto-assembles Stockfish WASM)
pnpm install

# Setup your local environment variables
# Create apps/web/.env.local from the example file
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Turso credentials and secrets

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
| Type check | `pnpm typecheck` | `tsc --noEmit` across all 26 workspaces |
| Engine setup | `pnpm setup-engines` | Assemble Stockfish WASM from split parts |
| Postinstall | (auto) | Runs `setup-engines.js` after `pnpm install` |

### Utility Scripts (`scripts/`)

| Script | Description |
|---|---|
| `setup-engines.js` | Assembles split Stockfish 17 (6 parts) and 18 (10 parts) WASM binaries |
| `split-stockfish-18.js` | Splits WASM binaries into parts for Git-friendly storage |
| `theme-replace.js` | Bulk-migrates Tailwind classes from hardcoded colors to design tokens |

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
# Set Root Directory: apps/web
# Add all environment variables in Vercel dashboard
```

The project includes a Vercel Cron Job definition:
- **`/api/cron/mine-puzzles`** — runs daily at 3:00 AM UTC

### `vercel.json`

```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "crons": [
    { "path": "/api/cron/mine-puzzles", "schedule": "0 3 * * *" }
  ]
}
```

---

Built with chess and care. **ChessInsight Pro v2.0**

*"Every grandmaster was once a beginner who refused to stop analyzing."*
