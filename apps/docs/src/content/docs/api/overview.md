---
title: API Overview
description: The scores and stats API — what it does and how it's structured.
---

The API is an **Express.js** server at `apps/scores-and-stats-api/`. It receives data from the scoreboard and serves it to the statistics site.

## Base URL

```
http://localhost:7200
```

Port is configurable via the `PORT` environment variable.

## Route map

```mermaid
flowchart TB
    ROOT[API Server :7200]
    ROOT --> HEALTH[GET /health]
    ROOT --> MATCHES[/api/matches]
    ROOT --> FA[/api/frame-actions]
    ROOT --> PLAYERS[/players]
    ROOT --> MH[/matches/player]
    ROOT --> BREAKS[/breaks]
    ROOT --> HL[/highlights]
    ROOT --> MISC[standalone routes]

    MATCHES --> M1[POST /]
    MATCHES --> M2[PATCH /]
    MATCHES --> M3[GET /live]

    FA --> F1[POST /single]
    FA --> F2[POST /]
    FA --> F3[GET /:matchId]

    PLAYERS --> P1[GET /]
    PLAYERS --> P2[GET /:playerName]

    MH --> MH1[GET /:playerName]

    BREAKS --> B1[GET /leaderboard]
    BREAKS --> B2[GET /year/:year]
    BREAKS --> B3[GET /:date]

    HL --> H1[GET /available-periods]
    HL --> H2[GET /month/:year/:month]
    HL --> H3[GET /year/:year]

    MISC --> X1[GET /breaks-matrix]
    MISC --> X2[GET /data/years]
```

## Architecture

The API is structured into route modules, each handling a specific domain:

| Module | Base path | Purpose |
|---|---|---|
| **matches** | `/api/matches` | Create, update, and query live matches |
| **frame-actions** | `/api/frame-actions` | Record and retrieve granular match events |
| **players** | `/players` | Player list and individual statistics |
| **match-history** | `/matches/player` | Paginated match history per player |
| **breaks** | `/breaks` | Break leaderboards, by date, by year |
| **highlights** | `/highlights` | Player of the month/year calculations |

## Middleware

- **CORS** — open (`*`), all origins allowed
- **JSON body parser** — Express built-in
- **Error handler** — global catch-all for unhandled exceptions

## Validation

Request bodies are validated with **Zod** schemas. Invalid requests return a `400` with details about what's wrong.
