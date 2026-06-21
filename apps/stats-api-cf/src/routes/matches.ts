import { Hono } from "hono";
import type { AppEnv } from "../types";
import type { PrismaClient } from "../generated/prisma/client";
import { capabilities, SCHEMA_VERSION } from "@rrsb/contracts";
import { z } from "zod";
import {
  ballColorEnum,
  ballTypeEnum,
  bbPhaseEnum,
  eventSourceEnum,
  eventTypeEnum,
  foulTypeEnum,
  inputModeEnum,
  insertHighBreak,
  matchTypeToCode,
  missTypeEnum,
  pocketEnum,
} from "../lib/shared";

export const matchesRouter = new Hono<AppEnv>();
export const eventsRouter = new Hono<AppEnv>();

// ===================== Create match =====================

const playerSchema = z.object({
  name: z.string().min(1),
  nationalityIOC: z.string().optional(),
  club: z.string().optional(),
  startingHandicap: z.number().int().optional(),
});

const createMatchSchema = z.object({
  matchType: z.string().min(1),
  inputMode: inputModeEnum,
  redsCount: z.number().int().min(1).max(15).default(15),
  bestOf: z.number().int().min(1),
  players: z.tuple([playerSchema, playerSchema]),
  tableNumber: z.number().int().nullable().optional(),
  locationId: z.string().nullable().optional(),
  deviceId: z.string().nullable().optional(),
  remoteRoomId: z.string().nullable().optional(),
  startedAt: z.string().optional(),
  // Versioning / provenance — the producer declares the capability level it wrote.
  schemaVersion: z.number().int().optional(),
  producer: z.string().optional(),
  producerVersion: z.string().optional(),
});

// POST /api/v3/matches
matchesRouter.post("/", async (c) => {
  const prisma = c.get("prisma");
  try {
    const body = createMatchSchema.parse(await c.req.json());

    // Default a match to the club's default location when none is given, so the
    // live board can group every match under a club without the scoreboard
    // needing to know location ids.
    let locationId = body.locationId ?? null;
    if (!locationId) {
      const def = await prisma.location.findFirst({
        where: { isDefault: true },
        select: { id: true },
      });
      locationId = def?.id ?? null;
    }

    // D1 (Prisma) has no interactive transactions — run the create steps
    // sequentially in the same order. Atomicity loss is acceptable here.
    const created = await prisma.v3Match.create({
      data: {
        matchType: body.matchType,
        matchTypeCode: matchTypeToCode(body.matchType),
        inputMode: body.inputMode,
        redsCount: body.redsCount,
        bestOf: body.bestOf,
        tableNumber: body.tableNumber ?? null,
        locationId,
        deviceId: body.deviceId ?? null,
        remoteRoomId: body.remoteRoomId ?? null,
        startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
        schemaVersion: body.schemaVersion ?? SCHEMA_VERSION,
        producer: body.producer ?? null,
        producerVersion: body.producerVersion ?? null,
      },
    });

    // Upsert canonical players and create the per-side rows.
    for (let i = 0; i < 2; i++) {
      const p = body.players[i];
      const player = await prisma.v3Player.upsert({
        where: { name: p.name },
        create: {
          name: p.name,
          nationalityIOC: p.nationalityIOC ?? null,
          club: p.club ?? null,
        },
        update: {
          nationalityIOC: p.nationalityIOC ?? undefined,
          club: p.club ?? undefined,
        },
      });
      await prisma.v3MatchPlayer.create({
        data: {
          matchId: created.id,
          playerIndex: i,
          playerId: player.id,
          name: p.name,
          nationalityIOC: p.nationalityIOC ?? null,
          club: p.club ?? null,
          startingHandicap: p.startingHandicap ?? 0,
          pointsFor: p.startingHandicap ?? 0,
        },
      });
    }

    // Open frame 1.
    await prisma.v3Frame.create({
      data: {
        matchId: created.id,
        frameNumber: 1,
        redsCount: body.redsCount,
        inputMode: body.inputMode,
        scoreP0: body.players[0].startingHandicap ?? 0,
        scoreP1: body.players[1].startingHandicap ?? 0,
      },
    });

    return c.json({ data: { matchId: created.id } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json({ error: "Invalid request", details: e.errors }, 400);
    }
    console.error("[v3] Error creating match:", e);
    return c.json({ error: "Failed to create match" }, 500);
  }
});

// ===================== Append events (the firehose) =====================

const stateSchema = z
  .object({
    scoreP0: z.number().int().optional(),
    scoreP1: z.number().int().optional(),
    activePlayerIndex: z.number().int().min(0).max(1).optional(),
    breakerIndex: z.number().int().min(0).max(1).optional(),
    frameWinnerIndex: z.number().int().min(0).max(1).nullable().optional(),
    matchWinnerIndex: z.number().int().min(0).max(1).nullable().optional(),
    framesP0: z.number().int().optional(),
    framesP1: z.number().int().optional(),
  })
  .optional();

const eventSchema = z.object({
  type: eventTypeEnum,
  frameNumber: z.number().int().min(1),
  playerIndex: z.number().int().min(0).max(1).optional(),
  ballType: ballTypeEnum.optional(),
  ball: ballColorEnum.optional(),
  points: z.number().int().optional(),
  missType: missTypeEnum.optional(),
  foulType: foulTypeEnum.optional(),
  pocket: pocketEnum.optional(),
  isFreeBall: z.boolean().optional(),
  freeBallGranted: z.boolean().optional(),
  isClearance: z.boolean().optional(),
  phase: bbPhaseEnum.optional(),
  redsRemaining: z.number().int().optional(),
  oldReds: z.number().int().optional(),
  newReds: z.number().int().optional(),
  breakTotal: z.number().int().optional(),
  source: eventSourceEnum.optional(),
  remotePlayerIndex: z.number().int().min(0).max(1).optional(),
  label: z.string().optional(),
  clientTs: z.string().optional(),
  state: stateSchema,
  payload: z.unknown().optional(),
});

const appendEventsSchema = z.object({
  events: z.array(eventSchema).min(1),
});

type EventInput = z.infer<typeof eventSchema>;

// POST /api/v3/matches/:id/events
matchesRouter.post("/:id/events", async (c) => {
  const prisma = c.get("prisma");
  try {
    const matchId = String(c.req.param("id"));
    const body = appendEventsSchema.parse(await c.req.json());

    // D1 (Prisma) has no interactive transactions — run the firehose steps
    // sequentially in the same order. Atomicity loss is acceptable here.
    const match = await prisma.v3Match.findUnique({ where: { id: matchId } });
    if (!match) {
      return c.json({ error: "Match not found" }, 404);
    }

    const last = await prisma.v3Event.findFirst({
      where: { matchId },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });
    let seq = last ? last.seq + 1 : 1;

    const ids: string[] = [];
    for (const ev of body.events) {
      const created = await processEvent(prisma, match, ev, seq);
      ids.push(created);
      seq += 1;
    }

    return c.json({ data: { count: ids.length, eventIds: ids } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json({ error: "Invalid request", details: e.errors }, 400);
    }
    console.error("[v3] Error appending events:", e);
    return c.json({ error: "Failed to append events" }, 500);
  }
});

type V3MatchRow = Awaited<ReturnType<PrismaClient["v3Match"]["findUnique"]>>;

async function getOrCreateFrame(
  prisma: PrismaClient,
  match: NonNullable<V3MatchRow>,
  ev: EventInput
) {
  const existing = await prisma.v3Frame.findUnique({
    where: { matchId_frameNumber: { matchId: match.id, frameNumber: ev.frameNumber } },
  });
  if (existing) return existing;
  return prisma.v3Frame.create({
    data: {
      matchId: match.id,
      frameNumber: ev.frameNumber,
      redsCount: ev.newReds ?? match.redsCount,
      inputMode: match.inputMode,
      breakerPlayerIndex: ev.state?.breakerIndex ?? null,
    },
  });
}

async function applyFrameScores(prisma: PrismaClient, frameId: string, ev: EventInput) {
  if (ev.state?.scoreP0 === undefined && ev.state?.scoreP1 === undefined) return;
  await prisma.v3Frame.update({
    where: { id: frameId },
    data: {
      scoreP0: ev.state?.scoreP0 ?? undefined,
      scoreP1: ev.state?.scoreP1 ?? undefined,
    },
  });
}

async function bumpMatchPlayerHighBreak(
  prisma: PrismaClient,
  matchId: string,
  playerIndex: number,
  value: number
) {
  if (value <= 7) return;
  const mp = await prisma.v3MatchPlayer.findUnique({
    where: { matchId_playerIndex: { matchId, playerIndex } },
    select: { id: true, highBreak: true, highBreaks: true },
  });
  if (!mp) return;
  await prisma.v3MatchPlayer.update({
    where: { id: mp.id },
    data: {
      highBreak: Math.max(mp.highBreak, value),
      highBreaks: insertHighBreak(mp.highBreaks as number[], value),
    },
  });
}

/** Find the active (unfinished) break for a player in a frame. */
function findOpenBreak(prisma: PrismaClient, frameId: string, playerIndex: number) {
  return prisma.v3Break.findFirst({
    where: { frameId, playerIndex, endedAt: null },
    orderBy: { sequence: "desc" },
  });
}

async function nextBreakSequence(prisma: PrismaClient, frameId: string): Promise<number> {
  const count = await prisma.v3Break.count({ where: { frameId } });
  return count + 1;
}

/** Close a player's open break, recording its high break. */
async function closePlayerBreak(
  prisma: PrismaClient,
  matchId: string,
  frameId: string,
  playerIndex: number,
  endReason: string,
  isClearance?: boolean
) {
  const brk = await findOpenBreak(prisma, frameId, playerIndex);
  if (!brk) return;
  await bumpMatchPlayerHighBreak(prisma, matchId, playerIndex, brk.totalPoints);
  await prisma.v3Break.update({
    where: { id: brk.id },
    data: {
      endedAt: new Date(),
      endReason: endReason,
      isClearance: isClearance ?? brk.isClearance,
    },
  });
}

async function processEvent(
  prisma: PrismaClient,
  match: NonNullable<V3MatchRow>,
  ev: EventInput,
  seq: number
): Promise<string> {
  const frame = await getOrCreateFrame(prisma, match, ev);
  let breakId: string | null = null;

  switch (ev.type) {
    case "POT": {
      const pi = ev.playerIndex ?? 0;
      let brk = await findOpenBreak(prisma, frame.id, pi);
      if (!brk) {
        brk = await prisma.v3Break.create({
          data: {
            matchId: match.id,
            frameId: frame.id,
            playerIndex: pi,
            sequence: await nextBreakSequence(prisma, frame.id),
          },
        });
      }
      await prisma.v3Ball.create({
        data: {
          breakId: brk.id,
          frameId: frame.id,
          sequence: brk.ballCount + 1,
          ballType: ev.ballType ?? "RED",
          points: ev.points ?? 0,
          isFreeBall: ev.isFreeBall ?? ev.ballType === "FREE_BALL",
          phase: ev.phase ?? "RED",
          redsRemainingAfter: ev.redsRemaining ?? null,
        },
      });
      brk = await prisma.v3Break.update({
        where: { id: brk.id },
        data: { totalPoints: brk.totalPoints + (ev.points ?? 0), ballCount: brk.ballCount + 1 },
      });
      breakId = brk.id;
      await applyFrameScores(prisma, frame.id, ev);
      break;
    }

    case "MANUAL_BREAK": {
      const pi = ev.playerIndex ?? 0;
      const brk = await prisma.v3Break.create({
        data: {
          matchId: match.id,
          frameId: frame.id,
          playerIndex: pi,
          sequence: await nextBreakSequence(prisma, frame.id),
          totalPoints: ev.points ?? 0,
          isManualEntry: true,
          isClearance: ev.isClearance ?? false,
          missType: ev.missType ?? null,
          foulType: ev.foulType ?? null,
          ball: ev.ball ?? null,
          pocket: ev.pocket ?? null,
          endedAt: new Date(),
        },
      });
      breakId = brk.id;
      await bumpMatchPlayerHighBreak(prisma, match.id, pi, ev.points ?? 0);
      await applyFrameScores(prisma, frame.id, ev);
      break;
    }

    case "FOUL": {
      if (ev.playerIndex !== undefined) {
        await closePlayerBreak(prisma, match.id, frame.id, ev.playerIndex, "FOUL");
      }
      await applyFrameScores(prisma, frame.id, ev);
      break;
    }

    case "MISS": {
      if (ev.playerIndex !== undefined) {
        await closePlayerBreak(prisma, match.id, frame.id, ev.playerIndex, "MISS", ev.isClearance);
      }
      await applyFrameScores(prisma, frame.id, ev);
      break;
    }

    case "HANDICAP": {
      await applyFrameScores(prisma, frame.id, ev);
      break;
    }

    case "CORRECT_REDS": {
      if (ev.newReds !== undefined) {
        await prisma.v3Frame.update({ where: { id: frame.id }, data: { redsCount: ev.newReds } });
      }
      break;
    }

    case "SWITCH_PLAYER": {
      break;
    }

    case "RERACK": {
      await prisma.v3Frame.update({
        where: { id: frame.id },
        data: { rerackCount: { increment: 1 } },
      });
      // Abandon any in-progress breaks for this (re-racked) frame.
      await prisma.v3Break.updateMany({
        where: { frameId: frame.id, endedAt: null },
        data: { endedAt: new Date() },
      });
      await applyFrameScores(prisma, frame.id, ev);
      break;
    }

    case "RESPOTTED_BLACK": {
      await prisma.v3Frame.update({ where: { id: frame.id }, data: { respottedBlack: true } });
      await applyFrameScores(prisma, frame.id, ev);
      break;
    }

    case "FRAME_END": {
      await closePlayerBreak(prisma, match.id, frame.id, 0, "FRAME_END");
      await closePlayerBreak(prisma, match.id, frame.id, 1, "FRAME_END");
      const winner = ev.state?.frameWinnerIndex ?? null;
      const s0 = ev.state?.scoreP0 ?? frame.scoreP0;
      const s1 = ev.state?.scoreP1 ?? frame.scoreP1;
      await prisma.v3Frame.update({
        where: { id: frame.id },
        data: {
          status: "COMPLETED",
          winnerPlayerIndex: winner,
          scoreP0: s0,
          scoreP1: s1,
          endedAt: new Date(),
        },
      });
      // Per-side running totals + frames won.
      await prisma.v3MatchPlayer.update({
        where: { matchId_playerIndex: { matchId: match.id, playerIndex: 0 } },
        data: {
          pointsFor: { increment: s0 },
          pointsAgainst: { increment: s1 },
          framesWon: winner === 0 ? { increment: 1 } : undefined,
        },
      });
      await prisma.v3MatchPlayer.update({
        where: { matchId_playerIndex: { matchId: match.id, playerIndex: 1 } },
        data: {
          pointsFor: { increment: s1 },
          pointsAgainst: { increment: s0 },
          framesWon: winner === 1 ? { increment: 1 } : undefined,
        },
      });
      break;
    }

    case "MATCH_END": {
      const winner = ev.state?.matchWinnerIndex ?? null;
      await prisma.v3Match.update({
        where: { id: match.id },
        data: {
          status: "FINISHED",
          isDraw: winner === null,
          winnerPlayerIndex: winner,
          finishedAt: new Date(),
        },
      });
      if (winner !== null) {
        await prisma.v3MatchPlayer.update({
          where: { matchId_playerIndex: { matchId: match.id, playerIndex: winner } },
          data: { isWinner: true },
        });
      }
      await applyAggregates(prisma, match.id);
      break;
    }

    case "UNDO": {
      // Mark the most recent still-standing scoring event as undone.
      const target = await prisma.v3Event.findFirst({
        where: {
          matchId: match.id,
          wasUndone: false,
          type: { in: ["POT", "MANUAL_BREAK", "FOUL", "MISS", "HANDICAP"] },
        },
        orderBy: { seq: "desc" },
      });
      if (target) {
        await prisma.v3Event.update({ where: { id: target.id }, data: { wasUndone: true } });
        // For ball-by-ball, drop the last ball of the open break to keep it consistent.
        if (target.type === "POT" && target.playerIndex !== null) {
          const brk = await findOpenBreak(prisma, frame.id, target.playerIndex);
          if (brk && brk.ballCount > 0) {
            const lastBall = await prisma.v3Ball.findFirst({
              where: { breakId: brk.id },
              orderBy: { sequence: "desc" },
            });
            if (lastBall) {
              await prisma.v3Ball.delete({ where: { id: lastBall.id } });
              await prisma.v3Break.update({
                where: { id: brk.id },
                data: {
                  totalPoints: brk.totalPoints - lastBall.points,
                  ballCount: brk.ballCount - 1,
                },
              });
            }
          }
        }
      }
      await applyFrameScores(prisma, frame.id, ev);
      break;
    }

    case "REDO":
    case "EDIT_LAST_BREAK":
    case "DELETE_BREAK": {
      // Pure record of a destructive/edit action — keep the firehose complete.
      await applyFrameScores(prisma, frame.id, ev);
      break;
    }

    case "MATCH_ABANDONED": {
      // "New game" on an unfinished match: record it and stop the match.
      await prisma.v3Match.update({
        where: { id: match.id },
        data: { status: "ABORTED", finishedAt: new Date() },
      });
      break;
    }
  }

  const created = await prisma.v3Event.create({
    data: {
      matchId: match.id,
      frameId: frame.id,
      breakId,
      seq,
      type: ev.type,
      playerIndex: ev.playerIndex ?? null,
      ballType: ev.ballType ?? null,
      points: ev.points ?? 0,
      missType: ev.missType ?? null,
      foulType: ev.foulType ?? null,
      pocket: ev.pocket ?? null,
      isFreeBall: ev.isFreeBall ?? false,
      freeBallGranted: ev.freeBallGranted ?? null,
      phase: ev.phase ?? null,
      redsRemaining: ev.redsRemaining ?? null,
      oldReds: ev.oldReds ?? null,
      newReds: ev.newReds ?? null,
      source: ev.source ?? "DISPLAY",
      remotePlayerIndex: ev.remotePlayerIndex ?? null,
      label: ev.label ?? null,
      payload: (ev.payload ?? undefined) as never,
      clientTs: ev.clientTs ? new Date(ev.clientTs) : null,
    },
    select: { id: true },
  });
  return created.id;
}

/** Roll the finished match into lifetime + per-match-type player aggregates. */
async function applyAggregates(prisma: PrismaClient, matchId: string) {
  const match = await prisma.v3Match.findUnique({
    where: { id: matchId },
    include: { players: true },
  });
  if (!match) return;

  for (const mp of match.players) {
    if (!mp.playerId) continue;
    const opp = match.players.find((p) => p.playerIndex !== mp.playerIndex);
    const framesLost = opp?.framesWon ?? 0;
    const won = match.winnerPlayerIndex === mp.playerIndex;
    const lost = match.winnerPlayerIndex !== null && !won;
    const drawn = match.isDraw;

    // Break-derived counts for this match/side.
    const breaks = await prisma.v3Break.findMany({
      where: { matchId, playerIndex: mp.playerIndex },
      select: { totalPoints: true },
    });
    const breaksOver7 = breaks.filter((b) => b.totalPoints > 7).length;
    const centuries = breaks.filter((b) => b.totalPoints >= 100).length;

    const fouls = await prisma.v3Event.findMany({
      where: { matchId, playerIndex: mp.playerIndex, type: "FOUL", wasUndone: false },
      select: { points: true },
    });
    const foulsCommitted = fouls.length;
    const foulPointsConceded = fouls.reduce((s, f) => s + f.points, 0);

    const player = await prisma.v3Player.findUnique({
      where: { id: mp.playerId },
      select: { highBreak: true, highBreaks: true },
    });
    let mergedHighBreaks = (player?.highBreaks as number[]) ?? [];
    for (const v of mp.highBreaks as number[]) mergedHighBreaks = insertHighBreak(mergedHighBreaks, v);

    await prisma.v3Player.update({
      where: { id: mp.playerId },
      data: {
        matchesPlayed: { increment: 1 },
        matchesWon: won ? { increment: 1 } : undefined,
        matchesLost: lost ? { increment: 1 } : undefined,
        matchesDrawn: drawn ? { increment: 1 } : undefined,
        framesWon: { increment: mp.framesWon },
        framesLost: { increment: framesLost },
        pointsFor: { increment: mp.pointsFor },
        pointsAgainst: { increment: mp.pointsAgainst },
        breaksOver7: { increment: breaksOver7 },
        centuries: { increment: centuries },
        foulsCommitted: { increment: foulsCommitted },
        foulPointsConceded: { increment: foulPointsConceded },
        highBreak: Math.max(player?.highBreak ?? 0, mp.highBreak),
        highBreaks: mergedHighBreaks,
      },
    });

    await prisma.v3PlayerMatchTypeStat.upsert({
      where: { playerId_matchType: { playerId: mp.playerId, matchType: match.matchTypeCode } },
      create: {
        playerId: mp.playerId,
        matchType: match.matchTypeCode,
        matchesPlayed: 1,
        matchesWon: won ? 1 : 0,
        matchesLost: lost ? 1 : 0,
        matchesDrawn: drawn ? 1 : 0,
        framesWon: mp.framesWon,
        framesLost,
        highBreak: mp.highBreak,
      },
      update: {
        matchesPlayed: { increment: 1 },
        matchesWon: won ? { increment: 1 } : undefined,
        matchesLost: lost ? { increment: 1 } : undefined,
        matchesDrawn: drawn ? { increment: 1 } : undefined,
        framesWon: { increment: mp.framesWon },
        framesLost: { increment: framesLost },
      },
    });
  }
}

// ===================== Patch match (status / winner / bestOf) =====================

const patchMatchSchema = z.object({
  status: z.enum(["ACTIVE", "FINISHED", "ABORTED"]).optional(),
  winnerPlayerIndex: z.number().int().min(0).max(1).nullable().optional(),
  isDraw: z.boolean().optional(),
  bestOf: z.number().int().min(1).optional(),
});

matchesRouter.patch("/:id", async (c) => {
  const prisma = c.get("prisma");
  try {
    const body = patchMatchSchema.parse(await c.req.json());
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "FINISHED" || body.status === "ABORTED") data.finishedAt = new Date();
    }
    if (body.winnerPlayerIndex !== undefined) data.winnerPlayerIndex = body.winnerPlayerIndex;
    if (body.isDraw !== undefined) data.isDraw = body.isDraw;
    if (body.bestOf !== undefined) data.bestOf = body.bestOf;
    await prisma.v3Match.update({ where: { id: String(c.req.param("id")) }, data });
    return c.json({ data: { ok: true } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json({ error: "Invalid request", details: e.errors }, 400);
    }
    console.error("[v3] Error patching match:", e);
    return c.json({ error: "Failed to patch match" }, 500);
  }
});

// ===================== Reads =====================

// GET /api/v3/matches/live — current match per table
matchesRouter.get("/live", async (c) => {
  const prisma = c.get("prisma");
  try {
    const matches = await prisma.v3Match.findMany({
      where: { status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: { players: { orderBy: { playerIndex: "asc" } } },
    });
    return c.json({
      data: matches.map((m) => ({ ...m, capabilities: capabilities(m.schemaVersion, m.inputMode as "BREAK" | "BALL_BY_BALL") })),
    });
  } catch (e) {
    console.error("[v3] Error fetching live matches:", e);
    return c.json({ error: "Failed to fetch live matches" }, 500);
  }
});

// GET /api/v3/matches — filterable, paginated list (finished/aborted/active)
matchesRouter.get("/", async (c) => {
  const prisma = c.get("prisma");
  try {
    const statusQ = c.req.query("status");
    const status = typeof statusQ === "string" ? statusQ : undefined;
    const matchTypeQ = c.req.query("matchType");
    const matchType = typeof matchTypeQ === "string" ? matchTypeQ : undefined;
    const playerQ = c.req.query("player");
    const player = typeof playerQ === "string" ? playerQ : undefined;
    const fromQ = c.req.query("from");
    const from = typeof fromQ === "string" ? new Date(fromQ) : undefined;
    const toQ = c.req.query("to");
    const to = typeof toQ === "string" ? new Date(toQ) : undefined;
    const limit = Math.min(parseInt(String(c.req.query("limit") ?? "20"), 10) || 20, 100);
    const page = Math.max(parseInt(String(c.req.query("page") ?? "1"), 10) || 1, 1);

    const where: Record<string, unknown> = {};
    if (status === "ACTIVE" || status === "FINISHED" || status === "ABORTED") where.status = status;
    if (matchType) where.matchTypeCode = matchType;
    if (player) where.players = { some: { name: player } };
    if (from || to) {
      const startedAt: Record<string, Date> = {};
      if (from && !isNaN(from.getTime())) startedAt.gte = from;
      if (to && !isNaN(to.getTime())) startedAt.lte = to;
      if (Object.keys(startedAt).length > 0) where.startedAt = startedAt;
    }

    const [total, matches] = await Promise.all([
      prisma.v3Match.count({ where }),
      prisma.v3Match.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { players: { orderBy: { playerIndex: "asc" } } },
      }),
    ]);

    return c.json({
      data: matches.map((m) => ({ ...m, capabilities: capabilities(m.schemaVersion, m.inputMode as "BREAK" | "BALL_BY_BALL") })),
      metadata: {
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalMatches: total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (e) {
    console.error("[v3] Error listing matches:", e);
    return c.json({ error: "Failed to list matches" }, 500);
  }
});

// GET /api/v3/matches/:id — full tree
matchesRouter.get("/:id", async (c) => {
  const prisma = c.get("prisma");
  try {
    const match = await prisma.v3Match.findUnique({
      where: { id: String(c.req.param("id")) },
      include: {
        players: { orderBy: { playerIndex: "asc" } },
        frames: {
          orderBy: { frameNumber: "asc" },
          include: {
            breaks: {
              orderBy: { sequence: "asc" },
              include: { balls: { orderBy: { sequence: "asc" } } },
            },
          },
        },
        events: { orderBy: { seq: "asc" } },
        remoteSessions: true,
        remoteEvents: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!match) {
      return c.json({ error: "Match not found" }, 404);
    }
    return c.json({
      data: { ...match, capabilities: capabilities(match.schemaVersion, match.inputMode as "BREAK" | "BALL_BY_BALL") },
    });
  } catch (e) {
    console.error("[v3] Error fetching match:", e);
    return c.json({ error: "Failed to fetch match" }, 500);
  }
});

// PATCH /api/v3/events/:id/flag — toggle break-leaderboard exclusion
eventsRouter.patch("/:id/flag", async (c) => {
  const prisma = c.get("prisma");
  try {
    const ev = await prisma.v3Event.findUnique({ where: { id: String(c.req.param("id")) } });
    if (!ev) {
      return c.json({ error: "Event not found" }, 404);
    }
    const updated = await prisma.v3Event.update({
      where: { id: ev.id },
      data: { manualFlagToIgnore: !ev.manualFlagToIgnore },
    });
    return c.json({ data: { manualFlagToIgnore: updated.manualFlagToIgnore } });
  } catch (e) {
    console.error("[v3] Error toggling event flag:", e);
    return c.json({ error: "Failed to toggle flag" }, 500);
  }
});
