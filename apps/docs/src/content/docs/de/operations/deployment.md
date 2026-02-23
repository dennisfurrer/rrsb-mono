---
title: Deployment
description: Wie die Apps deployed und gehostet werden.
---

:::note
Deployment ist noch nicht konfiguriert. Diese Seite wird aktualisiert, sobald wir CI/CD und Hosting einrichten.
:::

## Aktueller Stand

Alle Apps laufen lokal im Entwicklungsmodus. Es gibt noch keine Produktions-Deployment-Pipeline.

## Geplantes Setup

| App | Deployment-Ziel | Anmerkungen |
|---|---|---|
| **Scoreboard UI** | Statischer Datei-Upload | Baut zu einer einzelnen HTML-Datei — kann von überall aus bereitgestellt werden |
| **Statistik UI** | Statisches Hosting (Vercel/Netlify) | SPA mit Client-seitigem Routing |
| **API Server** | VPS oder Cloud (TBD) | Braucht einen laufenden Node.js-Prozess und Datenbankzugriff |
| **Docs** | Statisches Hosting (Vercel/Netlify/GitHub Pages) | Mit Astro gebaut, gibt statisches HTML aus |
| **Datenbank** | PostgreSQL auf VPS | Gleicher Server wie das API oder Managed Service |

## Für Produktion bauen

```bash
# Alle Apps bauen
pnpm build

# Eine bestimmte App bauen
pnpm --filter @rrsb/scoreboard-ui build
```

Die Build-Ausgabe des Scoreboard UI liegt in `apps/scoreboard-ui/dist/` — eine einzelne `index.html`-Datei mit eingebettetem CSS und JS.
