---
title: Players
description: API endpoints for player list and statistics.
---

Base path: `/players`

## GET / — List all players

Returns a list of all distinct player names from match history (excludes test players).

**Response:** `200` with an array of player name strings.

## GET /:playerName — Player statistics

Returns comprehensive statistics for a single player.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `playerName` | string | The player's name |

**Response:** `200` with statistics including:

| Field | Description |
|---|---|
| `name` | Player name |
| `totalMatchesWon` | Lifetime wins |
| `totalMatchesLost` | Lifetime losses |
| `totalFramesWon` | Lifetime frames won |
| `totalFramesLost` | Lifetime frames lost |
| `highBreaks` | Array of notable break values |
| `matchCount` | Total matches played |
| `winRate` | Win percentage |
