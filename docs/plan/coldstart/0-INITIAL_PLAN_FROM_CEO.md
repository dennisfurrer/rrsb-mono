# RRSB Monorepo - Initial Plan from CEO

## Objective

Clean up the existing technical mess of separate snooker club tools into a single **Turborepo monorepo**.

## Target Structure

```
/apps/scoreboard-ui          # Vite SPA - Snooker match scoreboard (replaces /scoreboard/ & /scoreboard-ui/)
/apps/scores-and-stats-api   # Express.js + TypeScript API (replaces /scoreboard-be/)
/apps/statistics-ui           # Vite SPA - Statistics & live scores (replaces /rrsb-breaks-calendar/)
/packages/db                  # Prisma + PostgreSQL shared database package

(Near future)
/apps/scoreboard-admin-ui     # Admin UI (TBD)
/apps/docs                    # Documentation website (German + English)

(Distant future)
/apps/club-website            # Club website (replaces legacy WordPress + CSV/TXT site from the 90s)
```

## Requirements

### 1. `/packages/db` - Database Package

- Use **Prisma** with **PostgreSQL**
- Copy the schema exactly from `../scoreboard-be/prisma/schema.prisma`
- Use a new database name: `scoreboard-db-v3`
- Run the migration against the new database

### 2. `/apps/scores-and-stats-api` - Scores & Stats API

- Starting point: `../scoreboard-be/`
- Tech: **TypeScript + Express.js**
- The existing code contains deprecated routes alongside new routes
- The existing code is described as "terrible, unsafe and not optimal"
- Must understand the `../scoreboard/` codebase to know how data gets pushed in, so the API correctly supports the scoreboard client
- Clean up, make safe, and optimize

### 3. `/apps/scoreboard-ui` - Scoreboard UI

- Must be a **Vite SPA**
- Must be buildable so the served HTML file can be used as a static site
- Must replicate the existing `../scoreboard/` codebase exactly in terms of layout and functionality
- Before development: copy the old scoreboard into `/apps/temp-old-scoreboard-ui` for reference
- Use **Playwright + screenshots** to get a visual understanding of the layout for pixel-perfect replication

### 4. `/apps/statistics-ui` - Statistics UI

- Must be a **Vite SPA**
- Recreate `../rrsb-breaks-calendar/` (the statistics/live scores/player profiles/highlights site)

### 5. `/apps/docs` - Documentation Website (Near Future)

- **Bilingual**: Must be perfect in both **German** and **English**
- Easy to navigate and use for non-technical contributors
- Context: Dennis (developer) and Markus (club manager, German-speaking) both need to work with and understand the codebase
- This has been a 15-year limitation — documentation must bridge the language and technical gap
- Must cover: how to run each app, how the system works, how to contribute, how the data flows, and operational guides for the club
