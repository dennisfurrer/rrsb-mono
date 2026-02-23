---
title: Matches
description: API endpoints for creating and managing matches.
---

Base path: `/api/matches`

## POST / — Create match

Creates a new match and returns its ID.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `player1Name` | string | yes | Name of player 1 |
| `player2Name` | string | yes | Name of player 2 |
| `player1NationIOC` | string | yes | IOC country code (e.g. "GER") |
| `player2NationIOC` | string | yes | IOC country code |
| `bestOf` | number | yes | Number of frames (e.g. 5 = first to 3) |
| `tableNumber` | number | no | Table number |

**Response:** `201` with the created match object including its `id`.

## PATCH / — Update match state

Updates the current state of an active match. Called by the scoreboard after every action.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Match ID |
| `framesPlayer1` | number | yes | Current frames for player 1 |
| `framesPlayer2` | number | yes | Current frames for player 2 |
| `breaksPlayer1` | number[] | yes | All breaks by player 1 |
| `breaksPlayer2` | number[] | yes | All breaks by player 2 |
| `active` | boolean | yes | Whether the match is still in progress |
| `winner` | string | no | Winner name (set when match ends) |
| `rawGameLog` | string | yes | Serialised game state |

**Response:** `200` with the updated match object.

## GET /live — Active matches

Returns all currently active matches, grouped by table number.

**Response:** `200` with an array of active match objects. Each includes player names, current scores, and table number.
