---
title: "Tech Stack: Alt vs Neu"
description: Was wir vorher hatten und wodurch wir es ersetzen.
---

## Architekturvergleich

```mermaid
flowchart TB
    subgraph old ["Alt: 3 separate Repos"]
        direction TB
        O1["scoreboard/\nJS + jQuery + PHP + CSS"]
        O2["scoreboard-be/\nExpress + Prisma\n(chaotisch)"]
        O3["rrsb-breaks-calendar/\n1 HTML-Datei, 6555 Zeilen"]
        O1 -. "kein gemeinsamer Code" .- O2
        O2 -. "kein gemeinsamer Code" .- O3
    end

    subgraph new ["Neu: 1 Monorepo"]
        direction TB
        N1["scoreboard-ui\nReact 19 + Vite + TS"]
        N2["scores-and-stats-api\nExpress + Zod + Prisma v7"]
        N3["statistics-ui\nReact 19 + Vite + Chart.js"]
        DB["packages/db\nPrisma v7 + PostgreSQL"]
        N1 --> DB
        N2 --> DB
        N3 --> N2
    end

    old -- "Neuschreiben" --> new

    style old fill:#fef2f2,stroke:#dc2626
    style new fill:#f0fdf4,stroke:#16a34a
```

## Das alte Setup

Jedes System wurde über die Jahre hinweg unabhängig mit dem gebaut, was gerade verfügbar war.

### Statistik-Website (rrsb-breaks-calendar)

| | |
|---|---|
| **Was** | Breaks-Kalender, Ranglisten, Spielerprofile, Live-Ergebnisse, Highlights |
| **Technik** | HTML, CSS, Vanilla-JavaScript mit CSS-Transform-Animationen |
| **Struktur** | Alles in **einer einzigen Datei** — 6.555 Zeilen Code |
| **Probleme** | Unmöglich zu warten, keine Trennung der Zuständigkeiten, kein Build-Schritt, extrem fragil |

### Stats-Backend (scoreboard-be)

| | |
|---|---|
| **Was** | API, das Match-Daten speichert und bereitstellt |
| **Technik** | Express.js, TypeScript, Prisma |
| **Probleme** | Schlecht strukturierter Code, viel toter/ungenutzter Code, unsichere Datenbankabfragen, veraltete Routen gemischt mit aktiven |

### Scoreboard-UI (scoreboard)

| | |
|---|---|
| **Was** | Das Match-Scoreboard, das auf Bildschirmen im Club angezeigt wird |
| **Technik** | Vanilla-JavaScript, HTML, jQuery, PHP, CSS |
| **Probleme** | Schreckliche Codequalität, schwer zu verstehen, schwer zu ändern, PHP-Abhängigkeit ohne guten Grund |

---

## Das neue Setup

Alles lebt in einem Monorepo mit gemeinsamen Tools.

### Gemeinsame Grundlage

| Tool | Zweck |
|---|---|
| **Turborepo** | Führt Builds/Tasks über alle Apps hinweg effizient aus |
| **pnpm** | Paketmanager (wie npm, aber schneller und verbraucht weniger Speicherplatz) |
| **TypeScript** | Typsicheres JavaScript — findet Fehler, bevor der Code ausgeführt wird |
| **Prisma v7** | Datenbank-Toolkit — definiert das Datenmodell, generiert typsichere Abfragen |
| **PostgreSQL** | Die Datenbank-Engine, die alles speichert |

### Scoreboard-UI → `apps/scoreboard-ui` ✅

| | |
|---|---|
| **Technik** | React 19, Vite 6, TypeScript |
| **Struktur** | Saubere Komponentenarchitektur — Scoreboard, SetupDialog, CalculatorDialog, MenuDialog |
| **Ausgabe** | Wird immer noch zu einer einzelnen HTML-Datei gebaut, überall einsetzbar |
| **Verbesserung** | Lesbar, wartbar, typsicher. Einfach neue Features hinzuzufügen |

### Stats-Backend → `apps/scores-and-stats-api`

| | |
|---|---|
| **Technik** | Express.js, TypeScript, Zod-Validierung, Prisma v7 |
| **Struktur** | Routen-Module (Matches, Spieler, Breaks, Highlights, Frame-Aktionen, Match-Verlauf) |
| **Verbesserung** | Eingabevalidierung, sichere Datenbankabfragen, kein toter Code, saubere Trennung |

### Statistik-Website → `apps/statistics-ui`

| | |
|---|---|
| **Technik** | React 19, Vite 6, Chart.js, React Router |
| **Struktur** | Seiten (Breaks, Live-Ergebnisse, Spielerprofil, Match-Verlauf, Highlights) mit gemeinsamem Layout |
| **Verbesserung** | Von 6.555 Zeilen in einer Datei zu sauberen, getrennten Komponenten |

### Datenbank → `packages/db`

| | |
|---|---|
| **Technik** | Prisma v7 mit PostgreSQL-Adapter |
| **Was sich geändert hat** | In ein gemeinsames Paket extrahiert, damit alle Apps denselben Datenbank-Client und dasselbe Schema verwenden |
