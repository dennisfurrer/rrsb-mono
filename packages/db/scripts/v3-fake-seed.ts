/**
 * Seed the LOCAL v3 database with a batch of believable fake data, by driving
 * the running scores-and-stats API (so all derivation + aggregates are correct).
 *
 * Usage (API must be running on the same machine):
 *   pnpm --filter @rrsb/db seed:v3-fake
 *   API_URL=http://localhost:7200 MATCHES=30 tsx scripts/v3-fake-seed.ts
 *
 * Safety: refuses to run against a non-local API host. Pair with
 * `pnpm --filter @rrsb/db clear:v3-fake` to remove everything it created.
 */
import {
  SEED_DEVICE_ID,
  SEED_ROOM_PREFIX,
  PLAYER_POOL,
  MATCH_TYPES,
  pick,
  rand,
  chance,
  simulateBallByBallFrame,
  simulateManualFrame,
  type SeedEvent,
  type SeedPlayer,
} from "./v3-fake-data.js";

const API_URL = process.env.API_URL ?? "http://localhost:7200";
const NUM_MATCHES = Number(process.env.MATCHES ?? 26);
const NUM_LIVE = Number(process.env.LIVE ?? 3);

// ---- Local-only guard ----
{
  const host = new URL(API_URL).hostname;
  if (host !== "localhost" && host !== "127.0.0.1" && host !== "::1") {
    console.error(
      `\n✖ Refusing to seed: API_URL host "${host}" is not local.\n` +
        `  This script only seeds a local database. Set API_URL to a localhost API.\n`
    );
    process.exit(1);
  }
}

async function post(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function patch(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Send a long event stream in safe-sized batches. */
async function sendEvents(matchId: string, events: SeedEvent[]) {
  const CHUNK = 40;
  for (let i = 0; i < events.length; i += CHUNK) {
    await post(`/api/v3/matches/${matchId}/events`, { events: events.slice(i, i + CHUNK) });
  }
}

function twoDistinctPlayers(): [SeedPlayer, SeedPlayer] {
  const a = pick(PLAYER_POOL);
  let b = pick(PLAYER_POOL);
  while (b.name === a.name) b = pick(PLAYER_POOL);
  return [a, b];
}

function framesToWin(bestOf: number): number {
  return Math.ceil(bestOf / 2);
}

async function createOneMatch(index: number, opts: { live: boolean }): Promise<void> {
  const [p0, p1] = twoDistinctPlayers();
  const matchType = pick(MATCH_TYPES);
  const ballByBall = !matchType.startsWith("Liga B") && chance(0.78); // most ball-by-ball, some manual
  const reds = matchType === "6-Reds" ? 6 : pick([6, 10, 15, 15, 15]);
  const bestOf = pick([3, 3, 5, 5, 7]);
  const table = 1 + (index % 9);

  // Spread start dates across the last ~35 days for variety.
  const daysAgo = opts.live ? 0 : rand(35);
  const startedAt = new Date(Date.now() - daysAgo * 86_400_000 - rand(8) * 3_600_000).toISOString();
  const room = `${SEED_ROOM_PREFIX}${index}`;

  const created = await post("/api/v3/matches", {
    matchType,
    inputMode: ballByBall ? "BALL_BY_BALL" : "BREAK",
    redsCount: reds,
    bestOf,
    players: [
      { name: p0.name, nationalityIOC: p0.ioc, club: p0.club },
      { name: p1.name, nationalityIOC: p1.ioc, club: p1.club },
    ],
    tableNumber: table,
    deviceId: SEED_DEVICE_ID,
    remoteRoomId: room,
    startedAt,
  });
  const matchId: string = created.data.matchId;

  // Optionally register remote sessions so the remote-control meta is populated.
  if (ballByBall && chance(0.5)) {
    const displayKey = `dk-${index}`;
    await post(`/api/v3/remote/${room}/session`, { displayKey, playerIndex: 0 }).catch(() => {});
    await post(`/api/v3/remote/${room}/session`, { displayKey, playerIndex: 1 }).catch(() => {});
  }

  const target = framesToWin(bestOf);
  const framesWon: [number, number] = [0, 0];
  let frameNumber = 0;
  const remoteShare = ballByBall && chance(0.4) ? 0.25 : 0;

  // For a live match, stop partway; for finished, play until someone reaches target.
  const stopAfter = opts.live ? rand(target) : Infinity;

  while (Math.max(framesWon[0], framesWon[1]) < target) {
    frameNumber += 1;
    const breaker = ((frameNumber - 1) % 2) as 0 | 1;
    const sim = ballByBall
      ? simulateBallByBallFrame(reds, frameNumber, breaker, {
          remoteShare,
          forceBigBreak: reds >= 15 && chance(0.22),
        })
      : simulateManualFrame(frameNumber, breaker);

    if (opts.live && framesWon[0] + framesWon[1] >= stopAfter) {
      // Leave this frame in progress: send everything except the FRAME_END.
      await sendEvents(matchId, sim.events.filter((e) => e.type !== "FRAME_END"));
      return; // match stays ACTIVE
    }

    framesWon[sim.winner] += 1;
    const evs = sim.events.map((e) =>
      e.type === "FRAME_END"
        ? { ...e, state: { ...e.state, framesP0: framesWon[0], framesP1: framesWon[1] } }
        : e
    );
    await sendEvents(matchId, evs);
  }

  const winner = (framesWon[0] > framesWon[1] ? 0 : 1) as 0 | 1;
  await post(`/api/v3/matches/${matchId}/events`, {
    events: [
      {
        type: "MATCH_END",
        frameNumber,
        state: { matchWinnerIndex: winner, framesP0: framesWon[0], framesP1: framesWon[1] },
      },
    ],
  });
  await patch(`/api/v3/matches/${matchId}`, {
    status: "FINISHED",
    winnerPlayerIndex: winner,
    isDraw: false,
    bestOf,
  });
}

async function main() {
  console.log(`Seeding local v3 data via ${API_URL}`);
  // Sanity: API reachable?
  const health = await fetch(`${API_URL}/health`).then((r) => r.ok).catch(() => false);
  if (!health) {
    console.error(`\n✖ API not reachable at ${API_URL}. Start it first (port 7200).\n`);
    process.exit(1);
  }

  let done = 0;
  for (let i = 0; i < NUM_MATCHES; i++) {
    await createOneMatch(i, { live: false });
    process.stdout.write(`\r  finished matches: ${++done}/${NUM_MATCHES}`);
  }
  console.log("");

  for (let i = 0; i < NUM_LIVE; i++) {
    await createOneMatch(1000 + i, { live: true });
    process.stdout.write(`\r  live matches: ${i + 1}/${NUM_LIVE}`);
  }
  console.log("");

  console.log(
    `\n✔ Seeded ${NUM_MATCHES} finished + ${NUM_LIVE} live matches.\n` +
      `  Tag: deviceId="${SEED_DEVICE_ID}". Remove with: pnpm --filter @rrsb/db clear:v3-fake\n`
  );
}

main().catch((e) => {
  console.error("\nSeed failed:", e);
  process.exit(1);
});
