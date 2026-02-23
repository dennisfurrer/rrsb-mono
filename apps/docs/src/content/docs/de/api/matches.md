---
title: Matches
description: API-Endpunkte zum Erstellen und Verwalten von Matches.
---

Basispfad: `/api/matches`

## POST / — Match erstellen

Erstellt ein neues Match und gibt dessen ID zurück.

**Request-Body:**

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `player1Name` | string | ja | Name von Spieler 1 |
| `player2Name` | string | ja | Name von Spieler 2 |
| `player1NationIOC` | string | ja | IOC-Ländercode (z.B. "GER") |
| `player2NationIOC` | string | ja | IOC-Ländercode |
| `bestOf` | number | ja | Anzahl der Frames (z.B. 5 = Best of 5) |
| `tableNumber` | number | nein | Tischnummer |

**Antwort:** `201` mit dem erstellten Match-Objekt inklusive `id`.

## PATCH / — Match-Zustand aktualisieren

Aktualisiert den aktuellen Zustand eines aktiven Matches. Wird vom Scoreboard nach jeder Aktion aufgerufen.

**Request-Body:**

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | string | ja | Match-ID |
| `framesPlayer1` | number | ja | Aktuelle Frames von Spieler 1 |
| `framesPlayer2` | number | ja | Aktuelle Frames von Spieler 2 |
| `breaksPlayer1` | number[] | ja | Alle Breaks von Spieler 1 |
| `breaksPlayer2` | number[] | ja | Alle Breaks von Spieler 2 |
| `active` | boolean | ja | Ob das Match noch läuft |
| `winner` | string | nein | Gewinnername (wird gesetzt wenn das Match endet) |
| `rawGameLog` | string | ja | Serialisierter Spielzustand |

**Antwort:** `200` mit dem aktualisierten Match-Objekt.

## GET /live — Aktive Matches

Gibt alle derzeit aktiven Matches zurück, gruppiert nach Tischnummer.

**Antwort:** `200` mit einem Array von aktiven Match-Objekten. Jedes enthält Spielernamen, aktuelle Punktzahlen und Tischnummer.
