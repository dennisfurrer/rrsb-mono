---
title: Highlights
description: API-Endpunkte für Spieler des Monats/Jahres.
---

Basispfad: `/highlights`

## GET /available-periods

Gibt alle Jahre und Monate zurück, die abgeschlossene Matches haben. Wird von der Statistik-UI verwendet, um die Periodennavigation zu befüllen.

**Antwort:** `200` mit:

```json
{
  "years": [2024, 2025, 2026],
  "months": {
    "2026": [1, 2]
  }
}
```

## GET /month/:year/:month — Spieler des Monats

Berechnet den Spieler des Monats für einen bestimmten Zeitraum basierend auf Match-Ergebnissen.

**Parameter:**

| Param | Typ | Beschreibung |
|---|---|---|
| `year` | number | Das Jahr |
| `month` | number | Der Monat (1-12) |

**Antwort:** `200` mit Spielerstatistiken für den Monat, sortiert nach Leistung.

## GET /year/:year — Spieler des Jahres

Berechnet den Spieler des Jahres basierend auf der aggregierten Leistung über alle Monate.

**Parameter:**

| Param | Typ | Beschreibung |
|---|---|---|
| `year` | number | Das Jahr |

**Antwort:** `200` mit Spielerstatistiken für das Jahr, sortiert nach Leistung.
