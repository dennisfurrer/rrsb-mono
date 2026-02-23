---
title: Migrationen & Seeding
description: Wie man Datenbankmigrationen ausführt und Daten einspeist.
---

## Speicherort

Das Datenbankpaket liegt unter `packages/db/`. Es enthält:

- `prisma/schema.prisma` — das Datenmodell
- `prisma/migrations/` — Migrationshistorie
- `prisma.config.ts` — Prisma v7-Konfiguration mit PostgreSQL-Adapter
- `scripts/migrate-from-remote.sh` — Skript zum Einspeisen von Legacy-Daten

## Migrationen ausführen

Vom Repo-Root:

```bash
# Prisma-Client nach Schema-Änderungen generieren
pnpm db:generate

# Neue Migration erstellen und anwenden
pnpm db:migrate

# Schema-Änderungen direkt pushen (keine Migrationsdatei, nur für Entwicklung)
pnpm db:push
```

## Verbindung

Die Datenbankverbindung wird über Umgebungsvariablen in `packages/db/.env` konfiguriert:

| Variable | Standard | Beschreibung |
|---|---|---|
| `DATABASE_URL` | `postgresql://rrsb@localhost:5432/scoreboard-db-v3` | PostgreSQL-Verbindungsstring |

## Seeding von Legacy-Daten

Das Skript `scripts/migrate-from-remote.sh` kopiert Match-Daten aus der alten v1-Datenbank in das neue Schema. Dies wurde bei der initialen Migration verwendet und sollte nicht erneut ausgeführt werden müssen.

## Wie Prisma geteilt wird

Das `packages/db`-Paket exportiert einen Singleton-Prisma-Client. Alle Apps importieren ihn:

```typescript
import { prisma } from "@rrsb/db";
```

Das stellt sicher, dass jede App die gleiche Datenbankverbindung und die gleichen generierten Typen verwendet. Wenn du das Schema änderst, führe `pnpm db:generate` aus, um den Client neu zu generieren — alle Apps übernehmen die neuen Typen automatisch.
