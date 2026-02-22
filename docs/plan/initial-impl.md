# Initial Implementation

## Timeline

| Phase | Start | End | Duration |
|---|---|---|---|
| Planning & prompt writing | 22:37 | 23:24 | ~47 min |
| Implementation (Claude Code) | 23:24:23 | 23:44:00 | 19m 37s |
| **Total** | **22:37** | **23:44** | **~1h 7m** |

Date: **22 February 2026**

## Scope

Consolidate four separate snooker club tools into a single Turborepo pnpm monorepo:

- **`scoreboard-be/`** (Express + Prisma API) → `apps/scores-and-stats-api` + `packages/db`
- **`scoreboard/`** (jQuery scoreboard UI) → `apps/scoreboard-ui` (Vite + React)
- **`rrsb-breaks-calendar/`** (6,555-line single HTML statistics site) → `apps/statistics-ui` (Vite + React + Chart.js)
- Shared Prisma v7 database package extracted to `packages/db`
- Shared TypeScript config in `packages/typescript-config`

### What was built

- Turborepo scaffolding with pnpm workspaces
- Prisma v7 with `@prisma/adapter-pg`, `prisma.config.ts`, and initial migration
- Express v5 API refactored from monolithic `index.ts` into 6 route modules with Zod validation
- Scoreboard UI rewritten from jQuery to React 19 (setup dialog, calculator, menu, auto-font-sizing)
- Statistics UI rewritten from vanilla JS to React 19 (5 pages, Chart.js, glassmorphism design, 3D card flip)

### What was NOT built (future)

- `apps/scoreboard-admin-ui` — Admin panel
- `apps/docs` — Bilingual documentation site (DE/EN)
- `apps/club-website` — WordPress migration
- Tests, CI/CD, linting, formatting configs

## File Tree

```
rrsb-mono/
├── .gitignore
├── .nvmrc                                          # Node 22.14.0
├── CLAUDE.md
├── README.md
├── package.json                                    # Turborepo root
├── pnpm-workspace.yaml
├── turbo.json
│
├── packages/
│   ├── typescript-config/
│   │   ├── package.json
│   │   ├── base.json
│   │   ├── node.json
│   │   └── vite.json
│   │
│   └── db/
│       ├── package.json                            # @prisma/client ^7, @prisma/adapter-pg ^7
│       ├── tsconfig.json
│       ├── prisma.config.ts                        # Prisma v7 defineConfig
│       ├── .env
│       ├── prisma/
│       │   ├── schema.prisma                       # Player, Match, FrameAction
│       │   └── migrations/
│       │       └── 20260222222632_init/
│       │           └── migration.sql
│       ├── scripts/
│       │   └── migrate-from-remote.sh
│       └── src/
│           ├── index.ts                            # PrismaClient singleton w/ PrismaPg adapter
│           └── generated/prisma/                   # Generated client (gitignored)
│
├── apps/
│   ├── scores-and-stats-api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                            # Express app entry, route mounts
│   │       ├── lib/
│   │       │   ├── constants.ts                    # TEST_PLAYERS filter
│   │       │   └── utils.ts                        # normaliseBigInts, getMonthName
│   │       └── routes/
│   │           ├── matches.ts                      # POST, PATCH, GET /live
│   │           ├── frame-actions.ts                # POST /single, POST /, GET /:matchId
│   │           ├── players.ts                      # GET /, GET /:playerName
│   │           ├── match-history.ts                # GET /:playerName (paginated)
│   │           ├── breaks.ts                       # leaderboard, by-date, by-year, matrix
│   │           └── highlights.ts                   # available-periods, month, year
│   │
│   ├── scoreboard-ui/
│   │   ├── package.json                            # React 19, Vite 6
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts                          # Port 5173
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx                             # Game logic, state machine
│   │       ├── lib/
│   │       │   ├── api.ts                          # createMatch, updateMatch, sendFrameAction
│   │       │   └── model.ts                        # Player, MatchState, helpers
│   │       ├── hooks/
│   │       │   └── useAutoFontSize.ts              # Binary search font sizing
│   │       ├── components/
│   │       │   ├── Scoreboard.tsx                  # Three-column score display
│   │       │   ├── SetupDialog.tsx                 # Player names, IOC, best-of
│   │       │   ├── CalculatorDialog.tsx            # Numpad with foul/handicap modes
│   │       │   └── MenuDialog.tsx                  # Undo, frame end, rerack, etc.
│   │       └── styles/
│   │           └── global.css                      # Black scoreboard theme
│   │
│   ├── statistics-ui/
│   │   ├── package.json                            # React 19, Vite 6, Chart.js, react-router-dom
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts                          # Port 5174
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx                             # Routes: breaks, live, profile, matches, highlights
│   │       ├── lib/
│   │       │   └── api.ts                          # Typed API client, all endpoints
│   │       ├── components/
│   │       │   └── Layout.tsx                      # Nav bar, theme toggle, mobile menu
│   │       ├── pages/
│   │       │   ├── BreaksPage.tsx                  # Daily breaks + chart + historical leaderboard + matrix
│   │       │   ├── LiveScoresPage.tsx              # 9-table grid, 5s refresh, match detail modal
│   │       │   ├── PlayerProfilePage.tsx           # Stats dashboard, doughnut chart, animated counters
│   │       │   ├── MatchHistoryPage.tsx            # Paginated table, opponent filter, frame breakdown
│   │       │   └── HighlightsPage.tsx              # POTM/POTY, period nav, 3D card flip reveal
│   │       └── styles/
│   │           └── global.css                      # Glassmorphism design, dark/light themes
│   │
│   └── temp-old-scoreboard-ui/                     # Copy of legacy jQuery scoreboard (reference only)
│
└── docs/
    └── plan/
        ├── coldstart/
        │   ├── 0-INITIAL_PLAN_FROM_CEO.md
        │   └── 1-INITIAL_RESPONSE_FOR_PROJECT_PLANNING.md
        └── initial-impl.md                         # This file
```
