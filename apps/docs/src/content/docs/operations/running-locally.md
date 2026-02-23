---
title: Running Locally
description: How to get the full system running on your machine.
---

## Prerequisites

| Tool | Version | How to install |
|---|---|---|
| **Node.js** | 22.14.0 | `nvm install 22.14.0` |
| **pnpm** | 10.x | `npm install -g pnpm` |
| **PostgreSQL** | 15+ | [postgresql.org/download](https://www.postgresql.org/download/) |

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd rrsb-mono
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up the database

Create the database and configure the connection:

```bash
# Create the database (if it doesn't exist)
createdb scoreboard-db-v3 -U rrsb

# Generate the Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate
```

The database connection is configured in `packages/db/.env`.

### 4. Start everything

```bash
# Start all apps in development mode
pnpm dev
```

This starts:

| App | URL |
|---|---|
| Scoreboard UI | http://localhost:5173 |
| Statistics UI | http://localhost:5174 |
| API Server | http://localhost:7200 |
| Docs site | http://localhost:4321 |

## Starting individual apps

```bash
# Just the API
pnpm --filter @rrsb/scores-and-stats-api dev

# Just the scoreboard
pnpm --filter @rrsb/scoreboard-ui dev

# Just the statistics site
pnpm --filter @rrsb/statistics-ui dev

# Just the docs
pnpm --filter @rrsb/docs dev
```

## Useful commands

```bash
# Type-check everything
pnpm typecheck

# Build everything
pnpm build

# Open Prisma Studio (visual database browser)
pnpm --filter @rrsb/db studio
```
