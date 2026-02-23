---
title: Data Model
description: The database schema — what data we store and how it's structured.
---

The database uses **Prisma v7** with **PostgreSQL**. The schema lives in `packages/db/prisma/schema.prisma`.

## Entity relationship diagram

```mermaid
erDiagram
    Player {
        string playerId PK
        string name UK
        int totalMatchesWon
        int totalMatchesLost
        int totalFramesWon
        int totalFramesLost
        int[] highBreaks
    }

    Match {
        string id PK
        string player1Name
        string player2Name
        string player1NationIOC
        string player2NationIOC
        bool active
        int bestOf
        int framesPlayer1
        int framesPlayer2
        int[] breaksPlayer1
        int[] breaksPlayer2
        string winner
        string rawGameLog
        int tableNumber
    }

    FrameAction {
        string id PK
        string matchId FK
        int frameNumber
        int playerIndex
        string actionType
        int points
        string metadata
        bool wasUndone
    }

    Match ||--o{ FrameAction : "has many"
```

## Models

### Player

Stores aggregate statistics for each player. Updated when matches complete.

| Field | Type | Description |
|---|---|---|
| `playerId` | string | Primary key (cuid) |
| `name` | string | Unique player name |
| `totalMatchesWon` | int | Lifetime matches won |
| `totalMatchesLost` | int | Lifetime matches lost |
| `totalFramesWon` | int | Lifetime frames won |
| `totalFramesLost` | int | Lifetime frames lost |
| `highBreaks` | int[] | Array of notable break values |
| `createdAt` | datetime | When the player record was created |
| `updatedAt` | datetime | Last update timestamp |

### Match

One record per match. Stores the current state (if active) or final result (if complete).

| Field | Type | Description |
|---|---|---|
| `id` | string | Primary key (cuid) |
| `player1Name` | string | Name of player 1 |
| `player2Name` | string | Name of player 2 |
| `player1NationIOC` | string | IOC country code for player 1 (e.g. "GER", "ENG") |
| `player2NationIOC` | string | IOC country code for player 2 |
| `active` | bool | `true` while the match is in progress |
| `bestOf` | int | Number of frames (e.g. 5 = first to 3) |
| `framesPlayer1` | int | Frames won by player 1 |
| `framesPlayer2` | int | Frames won by player 2 |
| `breaksPlayer1` | int[] | Array of break values scored by player 1 |
| `breaksPlayer2` | int[] | Array of break values scored by player 2 |
| `winner` | string? | Name of the winner (null while active) |
| `rawGameLog` | string | Serialised game state from the scoreboard |
| `tableNumber` | int? | Which table the match is being played on |
| `createdAt` | datetime | When the match started |
| `updatedAt` | datetime | Last state update |

### FrameAction

Granular log of every action in every frame. This is the raw event stream from the scoreboard.

| Field | Type | Description |
|---|---|---|
| `id` | string | Primary key (cuid) |
| `matchId` | string | Foreign key to Match |
| `frameNumber` | int | Which frame this action belongs to |
| `playerIndex` | int | 0 = player 1, 1 = player 2 |
| `actionType` | string | Type of action (e.g. "pot", "foul", "frame_end") |
| `points` | int | Points scored in this action |
| `metadata` | string? | Optional JSON with extra data |
| `wasUndone` | bool | Whether this action was later undone |
| `timestamp` | datetime | When the action happened |
| `createdAt` | datetime | When the record was created |

## Data flow

```mermaid
flowchart LR
    SB[Scoreboard UI] -- POST match --> API[API Server]
    API -- create --> M[(Match)]
    SB -- POST frame actions --> API
    API -- create --> FA[(FrameAction)]
    SB -- PATCH match state --> API
    API -- update --> M
    API -- on match end --> P[(Player stats)]
```

1. Scoreboard creates a match via `POST /api/matches`
2. During play, every pot/foul/action is sent via `POST /api/frame-actions/single`
3. Match state (scores, frames) is updated via `PATCH /api/matches`
4. When a match completes, player aggregate statistics are updated
