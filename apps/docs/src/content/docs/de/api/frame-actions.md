---
title: Frame-Aktionen
description: API-Endpunkte zum Aufzeichnen und Abfragen einzelner Match-Events.
---

Basispfad: `/api/frame-actions`

Frame-Aktionen sind das detaillierte Event-Protokoll jedes Matches. Jeder Pot, jedes Foul und jedes Frame-Ende wird als separate Aktion aufgezeichnet.

## POST /single — Eine Aktion aufzeichnen

Zeichnet eine einzelne Frame-Aktion während eines Matches auf.

**Request-Body:**

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `matchId` | string | ja | Match-ID |
| `frameNumber` | number | ja | Aktuelle Frame-Nummer (ab 1) |
| `playerIndex` | number | ja | 0 = Spieler 1, 1 = Spieler 2 |
| `actionType` | string | ja | Typ: "pot", "foul", "frame_end", usw. |
| `points` | number | ja | Erzielte Punkte |
| `metadata` | string | nein | Optionaler JSON-String mit Zusatzdaten |
| `wasUndone` | boolean | nein | Ob die Aktion rückgängig gemacht wurde (Standard: false) |
| `timestamp` | string | ja | ISO-Zeitstempel, wann die Aktion stattfand |

**Antwort:** `201` mit der erstellten Aktion.

## POST / — Mehrere Aktionen erstellen

Zeichnet mehrere Frame-Aktionen auf einmal auf. Wird beim Synchronisieren eines Aktionsbündels verwendet.

**Request-Body:** Array von Aktionsobjekten (gleiche Form wie Einzelaktion).

**Antwort:** `201` mit der Anzahl der erstellten Aktionen.

## GET /:matchId — Aktionen für ein Match abrufen

Gibt alle Frame-Aktionen für ein bestimmtes Match zurück, sortiert nach Zeitstempel.

**Parameter:**

| Param | Typ | Beschreibung |
|---|---|---|
| `matchId` | string | Match-ID |

**Antwort:** `200` mit einem Array von Frame-Aktionsobjekten.
