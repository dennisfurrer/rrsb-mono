---
title: API-Überblick
description: Das Scores-and-Stats-API — was es tut und wie es aufgebaut ist.
---

Das API ist ein **Express.js**-Server unter `apps/scores-and-stats-api/`. Es empfängt Daten vom Scoreboard und liefert sie an die Statistik-Website.

## Basis-URL

```
http://localhost:7200
```

Der Port ist über die Umgebungsvariable `PORT` konfigurierbar.

## Routen-Übersicht

```mermaid
flowchart TB
    ROOT[API Server :7200]
    ROOT --> HEALTH[GET /health]
    ROOT --> MATCHES[/api/matches]
    ROOT --> FA[/api/frame-actions]
    ROOT --> PLAYERS[/players]
    ROOT --> MH[/matches/player]
    ROOT --> BREAKS[/breaks]
    ROOT --> HL[/highlights]
    ROOT --> MISC[Einzelrouten]

    MATCHES --> M1[POST /]
    MATCHES --> M2[PATCH /]
    MATCHES --> M3[GET /live]

    FA --> F1[POST /single]
    FA --> F2[POST /]
    FA --> F3[GET /:matchId]

    PLAYERS --> P1[GET /]
    PLAYERS --> P2[GET /:playerName]

    MH --> MH1[GET /:playerName]

    BREAKS --> B1[GET /leaderboard]
    BREAKS --> B2[GET /year/:year]
    BREAKS --> B3[GET /:date]

    HL --> H1[GET /available-periods]
    HL --> H2[GET /month/:year/:month]
    HL --> H3[GET /year/:year]

    MISC --> X1[GET /breaks-matrix]
    MISC --> X2[GET /data/years]
```

## Architektur

Das API ist in Routen-Module gegliedert, die jeweils einen bestimmten Bereich abdecken:

| Modul | Basispfad | Zweck |
|---|---|---|
| **matches** | `/api/matches` | Matches erstellen, aktualisieren und live abfragen |
| **frame-actions** | `/api/frame-actions` | Granulare Match-Events aufzeichnen und abrufen |
| **players** | `/players` | Spielerliste und individuelle Statistiken |
| **match-history** | `/matches/player` | Paginierte Match-Historie pro Spieler |
| **breaks** | `/breaks` | Break-Ranglisten, nach Datum, nach Jahr |
| **highlights** | `/highlights` | Spieler des Monats/Jahres berechnen |

## Middleware

- **CORS** — offen (`*`), alle Origins erlaubt
- **JSON Body Parser** — Express eingebaut
- **Error Handler** — globaler Catch-All für unbehandelte Ausnahmen

## Validierung

Request-Bodies werden mit **Zod**-Schemas validiert. Ungültige Anfragen geben einen `400`-Fehler mit Details zurück, was falsch ist.
