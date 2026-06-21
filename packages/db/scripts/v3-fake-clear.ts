/**
 * Remove everything created by v3-fake-seed.ts from the LOCAL v3 database.
 * Matches deleted by their seed tag cascade to frames/breaks/balls/events/
 * match-players; remote + practice rows and the fake players are removed too.
 *
 * Usage:
 *   pnpm --filter @rrsb/db clear:v3-fake
 *   POSTGRES_URL=postgres://rrsb@localhost:5432/scoreboard-db-v3 tsx scripts/v3-fake-clear.ts
 *
 * Safety: refuses to run unless the database host is local.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { SEED_DEVICE_ID, SEED_ROOM_PREFIX, PLAYER_POOL } from "./v3-fake-data.js";

const dbIdx = process.argv.indexOf("--db");
const connectionString =
  (dbIdx !== -1 ? process.argv[dbIdx + 1] : undefined) ??
  process.env.POSTGRES_URL ??
  "postgres://rrsb@localhost:5432/scoreboard-db-v3";

// ---- Local-only guard ----
{
  const host = new URL(connectionString.replace(/^postgres(ql)?:\/\//, "http://")).hostname;
  if (host !== "localhost" && host !== "127.0.0.1" && host !== "::1") {
    console.error(
      `\n✖ Refusing to clear: database host "${host}" is not local.\n` +
        `  This script only touches a local database.\n`
    );
    process.exit(1);
  }
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  console.log(`Clearing fake v3 data from ${connectionString}`);
  const names = PLAYER_POOL.map((p) => p.name);

  // Remote rows first (their match link is SetNull, so they don't cascade).
  const remoteEvents = await prisma.v3RemoteEvent.deleteMany({
    where: { roomId: { startsWith: SEED_ROOM_PREFIX } },
  });
  const remoteSessions = await prisma.v3RemoteSession.deleteMany({
    where: { roomId: { startsWith: SEED_ROOM_PREFIX } },
  });

  // Matches cascade to players-join, frames, breaks, balls, events.
  const matches = await prisma.v3Match.deleteMany({ where: { deviceId: SEED_DEVICE_ID } });

  // Finally the fake players (match-type stats cascade with them).
  const players = await prisma.v3Player.deleteMany({ where: { name: { in: names } } });

  console.log(
    `\n✔ Removed:\n` +
      `   ${matches.count} matches (+ their frames/breaks/balls/events/players-join)\n` +
      `   ${remoteSessions.count} remote sessions, ${remoteEvents.count} remote events\n` +
      `   ${players.count} fake players\n`
  );

  const left = await prisma.v3Match.count();
  console.log(`   v3_match rows remaining in DB: ${left}\n`);
}

main()
  .catch((e) => {
    console.error("\nClear failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
