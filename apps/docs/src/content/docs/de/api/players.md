---
title: Spieler
description: API-Endpunkte für Spielerliste und Statistiken.
---

Basispfad: `/players`

## GET / — Alle Spieler auflisten

Gibt eine Liste aller eindeutigen Spielernamen aus der Match-Historie zurück (ohne Testspieler).

**Antwort:** `200` mit einem Array von Spielernamen-Strings.

## GET /:playerName — Spielerstatistiken

Gibt umfassende Statistiken für einen einzelnen Spieler zurück.

**Parameter:**

| Param | Typ | Beschreibung |
|---|---|---|
| `playerName` | string | Der Name des Spielers |

**Antwort:** `200` mit Statistiken einschließlich:

| Feld | Beschreibung |
|---|---|
| `name` | Spielername |
| `totalMatchesWon` | Gewonnene Matches insgesamt |
| `totalMatchesLost` | Verlorene Matches insgesamt |
| `totalFramesWon` | Gewonnene Frames insgesamt |
| `totalFramesLost` | Verlorene Frames insgesamt |
| `highBreaks` | Array von bemerkenswerten Break-Werten |
| `matchCount` | Gesamtzahl gespielter Matches |
| `winRate` | Gewinnprozentsatz |
