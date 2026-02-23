---
title: Frame Actions
description: API endpoints for recording and querying individual match events.
---

Base path: `/api/frame-actions`

Frame actions are the granular event log of every match. Each pot, foul, and frame end is recorded as a separate action.

## POST /single — Record one action

Records a single frame action during a match.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `matchId` | string | yes | Match ID |
| `frameNumber` | number | yes | Current frame number (1-based) |
| `playerIndex` | number | yes | 0 = player 1, 1 = player 2 |
| `actionType` | string | yes | Type: "pot", "foul", "frame_end", etc. |
| `points` | number | yes | Points scored |
| `metadata` | string | no | Optional JSON string with extra data |
| `wasUndone` | boolean | no | Whether this action was undone (default: false) |
| `timestamp` | string | yes | ISO timestamp of when the action occurred |

**Response:** `201` with the created action.

## POST / — Bulk create actions

Records multiple frame actions at once. Used when syncing a batch of actions.

**Request body:** Array of action objects (same shape as single).

**Response:** `201` with the count of created actions.

## GET /:matchId — Get actions for a match

Returns all frame actions for a given match, ordered by timestamp.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `matchId` | string | Match ID |

**Response:** `200` with an array of frame action objects.
