---
title: Lokal starten
description: Wie man das gesamte System auf dem eigenen Rechner zum Laufen bringt.
---

## Voraussetzungen

| Tool | Version | Installation |
|---|---|---|
| **Node.js** | 22.14.0 | `nvm install 22.14.0` |
| **pnpm** | 10.x | `npm install -g pnpm` |
| **PostgreSQL** | 15+ | [postgresql.org/download](https://www.postgresql.org/download/) |

## Einrichtung

### 1. Repo klonen

```bash
git clone <repo-url>
cd rrsb-mono
```

### 2. Abhängigkeiten installieren

```bash
pnpm install
```

### 3. Datenbank einrichten

Datenbank erstellen und Verbindung konfigurieren:

```bash
# Datenbank erstellen (falls noch nicht vorhanden)
createdb scoreboard-db-v3 -U rrsb

# Prisma-Client generieren
pnpm db:generate

# Migrationen ausführen
pnpm db:migrate
```

Die Datenbankverbindung wird in `packages/db/.env` konfiguriert.

### 4. Alles starten

```bash
# Alle Apps im Entwicklungsmodus starten
pnpm dev
```

Das startet:

| App | URL |
|---|---|
| Scoreboard UI | http://localhost:5173 |
| Statistik UI | http://localhost:5174 |
| API Server | http://localhost:7200 |
| Dokumentation | http://localhost:4321 |

## Einzelne Apps starten

```bash
# Nur das API
pnpm --filter @rrsb/scores-and-stats-api dev

# Nur das Scoreboard
pnpm --filter @rrsb/scoreboard-ui dev

# Nur die Statistik-Seite
pnpm --filter @rrsb/statistics-ui dev

# Nur die Dokumentation
pnpm --filter @rrsb/docs dev
```

## Nützliche Befehle

```bash
# Alles type-checken
pnpm typecheck

# Alles bauen
pnpm build

# Prisma Studio öffnen (visueller Datenbank-Browser)
pnpm --filter @rrsb/db studio
```
