---
title: Breaks
description: API-Endpunkte für Break-Ranglisten und Statistiken.
---

Basispfad: `/breaks`

## GET /leaderboard — Top-Breaks

Gibt die 25 höchsten Breaks über alle Matches zurück.

**Antwort:** `200` mit einem Array von Break-Einträgen, jeweils mit:

| Feld | Beschreibung |
|---|---|
| `playerName` | Wer den Break erzielt hat |
| `breakValue` | Erzielte Punkte |
| `matchDate` | Wann das Match gespielt wurde |
| `opponent` | Gegen wen gespielt wurde |

## GET /year/:year — Breaks nach Jahr

Gibt alle Breaks für ein bestimmtes Jahr zurück.

**Parameter:**

| Param | Typ | Beschreibung |
|---|---|---|
| `year` | number | Das Jahr (z.B. 2026) |

**Antwort:** `200` mit einem Array von Break-Einträgen für das Jahr.

## GET /:date — Breaks nach Datum

Gibt alle Breaks für ein bestimmtes Datum zurück.

**Parameter:**

| Param | Typ | Beschreibung |
|---|---|---|
| `date` | string | Datum im Format YYYY-MM-DD |

**Antwort:** `200` mit einem Array von Break-Einträgen für das Datum.

## GET /breaks-matrix (Einzelroute)

Gibt eine Break-Verteilungsmatrix zurück — wie viele Breaks jeder Spieler pro Schwellenwert erzielt hat (20+, 30+, 40+, ... 100+).

**Antwort:** `200` mit einem Matrix-Objekt, in dem die Schlüssel Spielernamen und die Werte Zähler pro Schwellenwert sind.

## GET /data/years (Einzelroute)

Gibt die Liste der Jahre zurück, für die Match-Daten vorhanden sind.

**Antwort:** `200` mit einem Array von Jahreszahlen.
