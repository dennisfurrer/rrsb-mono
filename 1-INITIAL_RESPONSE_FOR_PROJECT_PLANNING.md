# RRSB Monorepo - Project Planning Response

## Codebase Analysis Summary

I've done a deep-dive into all four existing codebases. Here's what I'm working with:

### Existing `scoreboard-be/` (→ becomes `scores-and-stats-api`)

- **Tech**: Express.js + TypeScript + Prisma + PostgreSQL
- **Architecture**: Monolithic single-file API (`src/index.ts`) with ~800 lines, all routes + helpers in one file
- **Models**: `Player`, `Match`, `FrameAction` (3 Prisma models)
- **Endpoints** (14 total):
  - `POST /api/matches` - Create match
  - `PATCH /api/matches` - Update/upsert match state
  - `GET /api/matches/live` - Live matches across 9 tables
  - `POST /api/frame-actions/single` - Log single frame action (with undo logic)
  - `POST /api/frame-actions` - Bulk frame actions
  - `GET /api/frame-actions/:matchId` - Get actions for match
  - `GET /players` - List all players
  - `GET /players/:playerName` - Full player stats profile
  - `GET /matches/player/:playerName` - Paginated match history
  - `GET /breaks/leaderboard` - Top breaks all-time
  - `GET /breaks/:date` - Breaks for specific date
  - `GET /breaks/year/:year` - Breaks for specific year
  - `GET /breaks-matrix` - Break distribution matrix
  - `GET /data/years` - Available years
  - `GET /highlights/available-periods` - Available months/years
  - `GET /highlights/month/:year/:month` - Player of the month
  - `GET /highlights/year/:year` - Player of the year
- **Issues**: Heavy use of `$queryRawUnsafe()`, no input validation, no auth, no error middleware, test player filtering scattered everywhere, duplicate deduplication logic in memory

### Existing `scoreboard/` + `scoreboard-ui/` (→ becomes `scoreboard-ui`)

- **Tech**: Vanilla JS (ES5) + jQuery 1.12.1 + jQuery Mobile 1.4.5 — zero build step
- **Architecture**: 4 core files — `scoreboard_lite_neu.php/.html`, `snk-model.js`, `snk-controller.js`, `spielerNamen.js`
- **Layout**: Three-column scoreboard (Player 1 | Center | Player 2) with modal dialogs for setup, calculator, and menu
- **Features**: Break entry via numpad, foul mode, handicap, undo, re-rack, frame/match end, session persistence, fire-and-forget API calls
- **Player data**: Loaded from a CSV file (`spielerliste.csv`) with 135+ players
- **Styling**: Black background, yellow frames, responsive font scaling via canvas text measurement
- **API calls**: `POST /api/matches`, `PATCH /api/matches`, `POST /api/frame-actions/single`

### Existing `rrsb-breaks-calendar/` (→ becomes `statistics-ui`)

- **Tech**: Single 6,555-line HTML file with inline CSS/JS — no framework, no build step
- **Architecture**: SPA using URL query params for routing (`?tab=breaks|livescores|profile|matches|highlights`)
- **Libraries**: Chart.js 4.4.0, Anime.js, Three.js (for 3D break-off animation)
- **Pages**: Daily Breaks, Live Scores (9-table grid, 5s auto-refresh), Player Profile, Match History, Highlights (POTM/POTY)
- **Design**: Glass-morphism design system, dark/light theme toggle, responsive grid layouts
- **API calls**: All `GET` endpoints from the backend

---

## Implementation Plan

### Phase 0: Monorepo Scaffolding

1. Initialize Turborepo at project root
2. Configure `turbo.json` with build/dev/lint pipelines
3. Set up root `package.json` with workspaces
4. Set up shared TypeScript config in `/packages/typescript-config`

### Phase 1: `/packages/db`

1. Create package with Prisma setup
2. Copy schema from `scoreboard-be/prisma/schema.prisma` verbatim
3. Update datasource to use `scoreboard-db-v3` database name
4. Generate Prisma client
5. Run `prisma migrate dev` to create tables in new database
6. Export PrismaClient singleton for consumption by other packages

### Phase 2: `/apps/scores-and-stats-api`

**Refactoring strategy** — keep every existing endpoint's contract identical (same request/response shapes) so both old and new frontends work during migration. Clean up internals:

1. **Project setup**: Express.js + TypeScript, import `@rrsb/db` from packages
2. **Route organization**: Split monolithic file into route modules:
   - `routes/matches.ts` — match CRUD + live
   - `routes/frame-actions.ts` — frame action logging
   - `routes/players.ts` — player listing + stats
   - `routes/breaks.ts` — break leaderboards + matrix + by-date/year
   - `routes/highlights.ts` — POTM/POTY
3. **Input validation**: Add Zod schemas for all request bodies and params
4. **Error handling**: Global error middleware, proper HTTP status codes
5. **Query safety**: Replace all `$queryRawUnsafe()` with `$queryRaw` using tagged template literals (parameterized queries)
6. **Test player filtering**: Centralize the filter list, apply consistently
7. **Helper functions**: Extract into `/src/services/` or `/src/utils/`
8. **CORS**: Keep permissive for now (same as original)
9. **Health check**: Keep `/health` endpoint

### Phase 3: `/apps/scoreboard-ui`

1. **Reference capture**: Copy `../scoreboard/` into `/apps/temp-old-scoreboard-ui/`
2. **Visual capture**: Use Playwright to screenshot the old scoreboard in all states (setup dialog, active match, calculator open, foul mode, menu open, match end with trophy)
3. **Vite SPA setup**: React + TypeScript + Vite (or vanilla TS if preferred — see question below)
4. **Replicate layout**: Three-column design, black background, yellow frames, responsive font scaling
5. **Replicate functionality**:
   - Player selection (dropdown from API or manual entry)
   - Break entry calculator (numpad 0-9, clear, OK)
   - Foul mode toggle
   - Handicap support
   - Undo system
   - Frame end / Re-rack / Match end
   - Session persistence (sessionStorage/localStorage)
   - Fire-and-forget API calls to backend
6. **Build output**: Configure Vite for static HTML serving (`vite build` → `dist/index.html`)
7. **Player data**: Move CSV loading to an API endpoint or embed at build time

### Phase 4: `/apps/statistics-ui`

1. **Vite SPA setup**: React + TypeScript + Vite
2. **Recreate pages**:
   - Daily Breaks (date picker, player cards, break chart)
   - Live Scores (9-table grid, 5s auto-refresh, match detail modal)
   - Player Profile (stats dashboard, win rate chart, top breaks)
   - Match History (paginated table, opponent filter, frame-by-frame modal)
   - Highlights (POTM/POTY with period navigation)
3. **Design system**: Recreate glass-morphism design with CSS modules or Tailwind
4. **Charts**: Chart.js integration (break distribution bar chart, win rate doughnut)
5. **3D animation**: Evaluate whether to port Three.js break-off animation or simplify
6. **Routing**: React Router with same URL param structure for backwards compatibility
7. **Theme**: Dark/light toggle with CSS variables

---

## Key Decisions & Questions I've Already Resolved

Based on my analysis, I'm making these decisions unless overridden:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework for both UIs | **React + TypeScript** | Modern, strong ecosystem, component reuse potential between scoreboard-ui and statistics-ui |
| Styling approach | **Tailwind CSS** | Fast development, consistent design tokens, works well with Vite |
| API validation | **Zod** | TypeScript-native, lightweight, can share schemas with frontend |
| Package manager | **pnpm** | Turborepo's recommended package manager, fast, disk-efficient |
| Node version | **20 LTS** | Stable, widely supported |
| Player CSV loading | **Move to API endpoint** | Eliminates static file dependency, single source of truth |

---

## Permissions I Need

To execute this plan end-to-end without interruption, I need the following pre-authorized:

### Shell / System

- **Install packages**: `pnpm install`, `pnpm add <package>`, `npx create-turbo`
- **Run builds**: `pnpm build`, `pnpm dev`, `turbo build`
- **Run Prisma commands**: `prisma generate`, `prisma migrate dev`, `prisma db push`
- **Run Playwright**: `npx playwright install`, `npx playwright test` (for screenshot capture)
- **Git operations**: creating branches, committing (no push without explicit ask)
- **Start dev servers**: `pnpm dev` on various ports for testing
- **Create PostgreSQL database**: The new `scoreboard-db-v3` database needs to exist — I'll need `createdb` or Prisma will attempt to create it

### File System

- **Create directories and files** throughout the monorepo structure
- **Copy files** from existing codebases into the monorepo
- **Read all files** in `../scoreboard-be/`, `../scoreboard/`, `../scoreboard-ui/`, `../rrsb-breaks-calendar/`

### Database

- **PostgreSQL connection**: I need the connection string format. I'll default to `postgresql://rrsb@localhost:5432/scoreboard-db-v3` based on the existing `.env` file pattern. If this is wrong, I need the correct credentials.

### Network

- **npm registry access**: For installing packages
- **CDN access**: For any assets referenced by the old codebase (flags from roundrobin.ch, Google Fonts, etc.)

---

## Execution Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 (with Playwright screenshots first) → Phase 4
```

Each phase is sequential because later phases depend on earlier ones (API depends on DB package, UIs depend on API contracts). Within each phase, I'll work file-by-file and commit logical units.

---

## Phase 5 (Near Future): `/apps/docs` - Documentation Website

This is a critical addition. The 15-year language barrier between Dennis (developer, English) and Markus (club manager, German) needs to be solved properly.

**Approach:**
- **Framework**: Starlight (Astro-based docs framework) — supports i18n out of the box, generates static sites, markdown-driven
- **Languages**: German (primary for Markus) + English (primary for Dennis/development)
- **Content tiers**:
  - **For Markus (Operator)**: How to start/stop the scoreboard, how the tables work, troubleshooting common issues, what the stats mean — written in clear, non-technical German
  - **For Dennis (Developer)**: Architecture overview, API reference, data models, how to add features, deployment guides — in English
  - **Shared**: System overview diagram, data flow, glossary of snooker/system terms in both languages
- **Navigation**: Sidebar with clear categories, search, language switcher
- **Hosting**: Static site, can be deployed alongside the other apps or separately

This will be planned in detail when we reach it, but the monorepo structure will accommodate it from day one.

---

## Future-Proofing: Legacy Club Website Migration

There's an existing WordPress club website held together with CSV and TXT files instead of a database (built in the 90s). This may eventually migrate into the monorepo as `/apps/club-website`.

**What this means for our architecture decisions today:**
- **Database schema**: Design `packages/db` to be extensible — the Prisma schema should be easy to add new models to (club members, events, news, etc.) without breaking existing models
- **API structure**: The `scores-and-stats-api` should be structured so adding new route domains (club management, content, etc.) is trivial — or we create a second API app when the time comes
- **Shared packages**: Any utilities we build (date formatting, i18n helpers, design tokens) should live in `/packages/` so the future club website can reuse them
- **Auth**: When we eventually add auth (admin UI, club website), it should be a shared package, not baked into one app
- **Don't**: Hard-code assumptions that "the only data is snooker matches" — keep naming generic where it makes sense (e.g., `packages/db` not `packages/snooker-db`)

We won't do any work on this now, but these guardrails prevent us from setting traps for ourselves.

---

## Risk Callouts

1. **Database credentials**: I'm assuming `postgresql://rrsb@localhost:5432/scoreboard-db-v3` works. If Postgres requires a password or different user, this will fail at Phase 1.
2. **Playwright screenshots**: The old scoreboard needs to be served locally to capture screenshots. It's a PHP file (`scoreboard_lite_neu.php`) — I may need to serve it via a simple HTTP server using the `.html` variant instead.
3. **Player CSV**: The CSV file contains 135+ players with German characters. Encoding needs to be preserved.
4. **Raw SQL queries**: The backend uses ~10 raw SQL queries. Converting them all to safe parameterized queries requires careful testing to ensure identical results.
5. **3D animation**: The Three.js break-off animation in `rrsb-breaks-calendar` is a nice-to-have. I'll implement it last and can skip if it becomes a time sink.
6. **API backward compatibility**: During migration, both old and new frontends may hit the API. I'll keep all endpoint contracts identical.
