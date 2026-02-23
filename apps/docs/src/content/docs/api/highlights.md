---
title: Highlights
description: API endpoints for player of the month/year awards.
---

Base path: `/highlights`

## GET /available-periods

Returns all years and months that have completed matches. Used by the statistics UI to populate period navigation.

**Response:** `200` with:

```json
{
  "years": [2024, 2025, 2026],
  "months": {
    "2026": [1, 2]
  }
}
```

## GET /month/:year/:month — Player of the month

Calculates the player of the month for a given period based on match results.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `year` | number | The year |
| `month` | number | The month (1-12) |

**Response:** `200` with player statistics for that month, sorted by performance.

## GET /year/:year — Player of the year

Calculates the player of the year based on aggregate performance across all months.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `year` | number | The year |

**Response:** `200` with player statistics for that year, sorted by performance.
