---
title: Breaks
description: API endpoints for break leaderboards and statistics.
---

Base path: `/breaks`

## GET /leaderboard — Top breaks

Returns the top 25 highest breaks across all matches.

**Response:** `200` with an array of break entries, each including:

| Field | Description |
|---|---|
| `playerName` | Who scored the break |
| `breakValue` | Points scored |
| `matchDate` | When the match was played |
| `opponent` | Who they were playing against |

## GET /year/:year — Breaks by year

Returns all breaks for a given year.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `year` | number | The year (e.g. 2026) |

**Response:** `200` with an array of break entries for that year.

## GET /:date — Breaks by date

Returns all breaks for a specific date.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `date` | string | Date in YYYY-MM-DD format |

**Response:** `200` with an array of break entries for that date.

## GET /breaks-matrix (standalone)

Returns a break distribution matrix — how many breaks each player has scored at each threshold (20+, 30+, 40+, ... 100+).

**Response:** `200` with a matrix object where keys are player names and values are counts per threshold.

## GET /data/years (standalone)

Returns the list of years that have match data.

**Response:** `200` with an array of year numbers.
