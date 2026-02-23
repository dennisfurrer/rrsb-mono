---
title: Migrations & Seeding
description: How to run database migrations and seed data.
---

## Location

The database package lives at `packages/db/`. It contains:

- `prisma/schema.prisma` — the data model
- `prisma/migrations/` — migration history
- `prisma.config.ts` — Prisma v7 configuration with PostgreSQL adapter
- `scripts/migrate-from-remote.sh` — script to seed from legacy data

## Running migrations

From the repo root:

```bash
# Generate the Prisma client after schema changes
pnpm db:generate

# Create and apply a new migration
pnpm db:migrate

# Push schema changes directly (no migration file, dev only)
pnpm db:push
```

## Connection

The database connection is configured via environment variables in `packages/db/.env`:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://rrsb@localhost:5432/scoreboard-db-v3` | PostgreSQL connection string |

## Seeding from legacy data

The script `scripts/migrate-from-remote.sh` copies match data from the old v1 database into the new schema. This was used during the initial migration and should not need to be run again.

## How Prisma is shared

The `packages/db` package exports a singleton Prisma client. All apps import it:

```typescript
import { prisma } from "@rrsb/db";
```

This ensures every app uses the same database connection and the same generated types. When you change the schema, run `pnpm db:generate` to regenerate the client — all apps pick up the new types automatically.
