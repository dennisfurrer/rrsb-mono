import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { z } from "zod";

export const practiceRouter = Router();
export const practiceStatsRouter = Router();

// ===== Schemas =====
const modeEnum = z.enum(["BREAK", "HITMISS"]);
const kindEnum = z.enum(["BREAK", "CLEARED", "MISSED", "HIT", "MISS"]);
const ballEnum = z.enum([
  "RED",
  "YELLOW",
  "GREEN",
  "BROWN",
  "BLUE",
  "PINK",
  "BLACK",
]);
const missTypeEnum = z.enum(["LONG", "EASY", "DIFFICULT", "POSITION", "FOUL"]);
const foulTypeEnum = z.enum([
  "WHITE_POTTED",
  "WRONG_BALL_HIT",
  "NO_BALL_HIT",
  "WHITE_OFF_TABLE",
  "CLOTHING_FOUL",
  "CUE_FOUL",
]);
const pocketEnum = z.enum([
  "CORNER",
  "MIDDLE",
  "CORNER_YELLOW",
  "CORNER_GREEN",
  "MIDDLE_YELLOW",
  "MIDDLE_GREEN",
  "CORNER_BLACK_YELLOW",
  "CORNER_BLACK_GREEN",
]);

const createSessionSchema = z.object({
  playerName: z.string().min(1),
  routineId: z.string().min(1),
  routineName: z.string().min(1),
  mode: modeEnum,
  redsCount: z.number().int().min(1).max(15).optional(),
  deviceId: z.string().optional(),
  tableNumber: z.number().int().optional(),
  locationId: z.string().optional(),
});

const patchSessionSchema = z.object({
  redsCount: z.number().int().min(1).max(15).optional(),
  finished: z.boolean().optional(),
});

const attemptInputSchema = z.object({
  kind: kindEnum,
  value: z.number().int().min(0).optional(),
  missType: missTypeEnum.optional(),
  foulType: foulTypeEnum.optional(),
  ball: ballEnum.optional(),
  pocket: pocketEnum.optional(),
});

const addAttemptsSchema = z.object({
  attempts: z.array(attemptInputSchema).min(1),
});

// ===== Helpers =====
function mapPrismaAttempt(a: {
  id: string;
  orderIndex: number;
  kind: string;
  value: number | null;
  missType: string | null;
  foulType: string | null;
  ball: string | null;
  pocket: string | null;
  timestamp: Date;
}) {
  return {
    id: a.id,
    orderIndex: a.orderIndex,
    kind: a.kind.toLowerCase(),
    value: a.value,
    missType: a.missType ? a.missType.toLowerCase() : null,
    foulType: a.foulType ? a.foulType.toLowerCase() : null,
    ball: a.ball ? a.ball.toLowerCase() : null,
    pocket: a.pocket ? a.pocket.toLowerCase() : null,
    timestamp: a.timestamp.toISOString(),
  };
}

function mapPrismaSession(
  s: {
    id: string;
    playerName: string;
    routineId: string;
    routineName: string;
    mode: string;
    redsCount: number | null;
    deviceId: string | null;
    tableNumber: number | null;
    locationId: string | null;
    startedAt: Date;
    finishedAt: Date | null;
    finalized: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  attempts?: ReturnType<typeof mapPrismaAttempt>[]
) {
  return {
    id: s.id,
    playerName: s.playerName,
    routineId: s.routineId,
    routineName: s.routineName,
    mode: s.mode.toLowerCase(),
    redsCount: s.redsCount,
    deviceId: s.deviceId,
    tableNumber: s.tableNumber,
    locationId: s.locationId,
    startedAt: s.startedAt.toISOString(),
    finishedAt: s.finishedAt ? s.finishedAt.toISOString() : null,
    finalized: s.finalized,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    ...(attempts ? { attempts } : {}),
  };
}

// ===== Write endpoints =====

// POST /api/practice-sessions
practiceRouter.post("/", async (req: Request, res: Response) => {
  try {
    const body = createSessionSchema.parse(req.body);
    const session = await prisma.practiceSession.create({
      data: {
        playerName: body.playerName,
        routineId: body.routineId,
        routineName: body.routineName,
        mode: body.mode,
        redsCount: body.redsCount ?? null,
        deviceId: body.deviceId ?? null,
        tableNumber: body.tableNumber ?? null,
        locationId: body.locationId ?? null,
      },
    });
    res.json({ data: { sessionId: session.id } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: e.errors });
      return;
    }
    console.error("Error creating practice session:", e);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// PATCH /api/practice-sessions/:id
practiceRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const body = patchSessionSchema.parse(req.body);
    const data: Record<string, unknown> = {};
    if (body.redsCount !== undefined) data.redsCount = body.redsCount;
    if (body.finished === true) {
      data.finalized = true;
      data.finishedAt = new Date();
    }
    if (Object.keys(data).length === 0) {
      res.json({ data: { ok: true } });
      return;
    }
    await prisma.practiceSession.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json({ data: { ok: true } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: e.errors });
      return;
    }
    console.error("Error updating practice session:", e);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// POST /api/practice-sessions/:id/attempts — single or batch
practiceRouter.post("/:id/attempts", async (req: Request, res: Response) => {
  try {
    const sessionId: string = String(req.params.id);
    const body = addAttemptsSchema.parse(req.body);

    // Determine starting orderIndex
    const last = await prisma.practiceAttempt.findFirst({
      where: { sessionId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    let nextIdx = last ? last.orderIndex + 1 : 0;

    const created = await prisma.practiceAttempt.createMany({
      data: body.attempts.map((a) => ({
        sessionId,
        orderIndex: nextIdx++,
        kind: a.kind,
        value: a.value ?? null,
        missType: a.missType ?? null,
        foulType: a.foulType ?? null,
        ball: a.ball ?? null,
        pocket: a.pocket ?? null,
      })),
    });

    res.json({ data: { added: created.count } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: e.errors });
      return;
    }
    console.error("Error adding attempts:", e);
    res.status(500).json({ error: "Failed to add attempts" });
  }
});

// DELETE /api/practice-sessions/:id/attempts/last
practiceRouter.delete(
  "/:id/attempts/last",
  async (req: Request, res: Response) => {
    try {
      const sessionId: string = String(req.params.id);
      const last = await prisma.practiceAttempt.findFirst({
        where: { sessionId },
        orderBy: { orderIndex: "desc" },
      });
      if (!last) {
        res.json({ data: { removed: false } });
        return;
      }
      await prisma.practiceAttempt.delete({ where: { id: last.id } });
      res.json({ data: { removed: true } });
    } catch (e) {
      console.error("Error deleting last attempt:", e);
      res.status(500).json({ error: "Failed to delete attempt" });
    }
  }
);

// ===== Read endpoints =====

// GET /api/practice-sessions — list with filters
practiceRouter.get("/", async (req: Request, res: Response) => {
  try {
    const player = typeof req.query.player === "string" ? req.query.player : undefined;
    const routine = typeof req.query.routine === "string" ? req.query.routine : undefined;
    const from = typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === "string" ? new Date(req.query.to) : undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);

    const where: Record<string, unknown> = {};
    if (player) where.playerName = player;
    if (routine) where.routineId = routine;
    if (from || to) {
      const startedAt: Record<string, Date> = {};
      if (from && !isNaN(from.getTime())) startedAt.gte = from;
      if (to && !isNaN(to.getTime())) startedAt.lte = to;
      if (Object.keys(startedAt).length > 0) where.startedAt = startedAt;
    }

    const [total, sessions] = await Promise.all([
      prisma.practiceSession.count({ where }),
      prisma.practiceSession.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { attempts: true } },
        },
      }),
    ]);

    res.json({
      data: sessions.map((s) => ({
        ...mapPrismaSession(s),
        attemptCount: s._count.attempts,
      })),
      metadata: {
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalSessions: total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (e) {
    console.error("Error listing practice sessions:", e);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

// GET /api/practice-sessions/:id — single with attempts
practiceRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const session = await prisma.practiceSession.findUnique({
      where: { id: String(req.params.id) },
      include: {
        attempts: { orderBy: { orderIndex: "asc" } },
      },
    });
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json({
      data: mapPrismaSession(session, session.attempts.map(mapPrismaAttempt)),
    });
  } catch (e) {
    console.error("Error fetching practice session:", e);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// GET /api/practice-stats/player/:name — aggregate per-routine summary
practiceStatsRouter.get(
  "/player/:name",
  async (req: Request, res: Response) => {
    try {
      const playerName = decodeURIComponent(String(req.params.name));

      const sessions = await prisma.practiceSession.findMany({
        where: { playerName },
        orderBy: { startedAt: "desc" },
        include: {
          attempts: { orderBy: { orderIndex: "asc" } },
        },
      });

      // Group by routineId
      type PerRoutine = {
        routineId: string;
        routineName: string;
        mode: string;
        sessionCount: number;
        totalAttempts: number;
        // break-mode aggregates
        highestBreak: number;
        averageBreak: number;
        clearedCount: number;
        missedCount: number;
        // hit/miss aggregates
        hits: number;
        misses: number;
        hitRate: number;
        bestStreak: number;
        lastSessionAt: string;
      };

      const byRoutine = new Map<string, {
        routineId: string;
        routineName: string;
        mode: string;
        sessions: number;
        totalAttempts: number;
        breakSum: number;
        breakCount: number;
        highestBreak: number;
        cleared: number;
        missed: number;
        hits: number;
        misses: number;
        currentStreak: number;
        bestStreak: number;
        lastSessionAt: Date;
      }>();

      for (const s of sessions) {
        const key = s.routineId;
        if (!byRoutine.has(key)) {
          byRoutine.set(key, {
            routineId: s.routineId,
            routineName: s.routineName,
            mode: s.mode.toLowerCase(),
            sessions: 0,
            totalAttempts: 0,
            breakSum: 0,
            breakCount: 0,
            highestBreak: 0,
            cleared: 0,
            missed: 0,
            hits: 0,
            misses: 0,
            currentStreak: 0,
            bestStreak: 0,
            lastSessionAt: s.startedAt,
          });
        }
        const agg = byRoutine.get(key)!;
        agg.sessions += 1;
        agg.totalAttempts += s.attempts.length;
        if (s.startedAt > agg.lastSessionAt) agg.lastSessionAt = s.startedAt;

        for (const a of s.attempts) {
          if (a.kind === "BREAK") {
            const v = a.value ?? 0;
            agg.breakSum += v;
            agg.breakCount += 1;
            if (v > agg.highestBreak) agg.highestBreak = v;
          } else if (a.kind === "CLEARED") {
            const v = a.value ?? 0;
            agg.breakSum += v;
            agg.breakCount += 1;
            if (v > agg.highestBreak) agg.highestBreak = v;
            agg.cleared += 1;
          } else if (a.kind === "MISSED") {
            agg.breakSum += 0;
            agg.breakCount += 1;
            agg.missed += 1;
          } else if (a.kind === "HIT") {
            agg.hits += 1;
            agg.currentStreak += 1;
            if (agg.currentStreak > agg.bestStreak) agg.bestStreak = agg.currentStreak;
          } else if (a.kind === "MISS") {
            agg.misses += 1;
            agg.currentStreak = 0;
          }
        }
      }

      const perRoutine: PerRoutine[] = Array.from(byRoutine.values()).map(
        (a) => {
          const total = a.hits + a.misses;
          return {
            routineId: a.routineId,
            routineName: a.routineName,
            mode: a.mode,
            sessionCount: a.sessions,
            totalAttempts: a.totalAttempts,
            highestBreak: a.highestBreak,
            averageBreak: a.breakCount === 0 ? 0 : a.breakSum / a.breakCount,
            clearedCount: a.cleared,
            missedCount: a.missed,
            hits: a.hits,
            misses: a.misses,
            hitRate: total === 0 ? 0 : a.hits / total,
            bestStreak: a.bestStreak,
            lastSessionAt: a.lastSessionAt.toISOString(),
          };
        }
      );

      res.json({
        data: {
          playerName,
          totalSessions: sessions.length,
          totalAttempts: sessions.reduce((n, s) => n + s.attempts.length, 0),
          perRoutine,
        },
      });
    } catch (e) {
      console.error("Error fetching practice stats:", e);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  }
);
