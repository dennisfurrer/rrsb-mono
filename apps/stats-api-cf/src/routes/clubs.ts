import { Hono } from "hono";
import type { AppEnv } from "../types";
import { capabilities } from "@rrsb/contracts";

export const clubsRouter = new Hono<AppEnv>();

const DEFAULT_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const matchInclude = {
  players: { orderBy: { playerIndex: "asc" } },
  frames: { orderBy: { frameNumber: "desc" }, take: 1 },
} as const;

type TableMatch = {
  id: string;
  status: string;
  matchType: string;
  matchTypeCode: string;
  schemaVersion: number;
  inputMode: string;
  bestOf: number;
  startedAt: Date;
  finishedAt: Date | null;
  updatedAt: Date;
  players: Array<{
    name: string;
    nationalityIOC: string | null;
    club: string | null;
    framesWon: number;
    highBreaks: unknown;
  }>;
  frames: Array<{ scoreP0: number; scoreP1: number }>;
};

/** Curate a match into the compact shape the live board needs. */
function shapeMatch(m: TableMatch) {
  const latest = m.frames[0];
  return {
    id: m.id,
    status: m.status,
    matchType: m.matchType,
    matchTypeCode: m.matchTypeCode,
    schemaVersion: m.schemaVersion,
    capabilities: capabilities(m.schemaVersion, m.inputMode as "BREAK" | "BALL_BY_BALL"),
    bestOf: m.bestOf,
    startedAt: m.startedAt,
    finishedAt: m.finishedAt,
    updatedAt: m.updatedAt,
    players: m.players.map((p) => ({
      name: p.name,
      nationalityIOC: p.nationalityIOC,
      club: p.club,
      framesWon: p.framesWon,
      highBreaks: p.highBreaks,
    })),
    frameScore: latest ? [latest.scoreP0, latest.scoreP1] : [0, 0],
  };
}

// GET /clubs — list of clubs (locations)
clubsRouter.get("/", async (c) => {
  const prisma = c.get("prisma");
  try {
    const clubs = await prisma.location.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, tableNumbers: true, isDefault: true },
    });
    return c.json({ data: clubs });
  } catch (e) {
    console.error("[v3] Error listing clubs:", e);
    return c.json({ error: "Failed to list clubs" }, 500);
  }
});

// GET /clubs/:id/tables — per-table live-or-most-recent match
clubsRouter.get("/:id/tables", async (c) => {
  const prisma = c.get("prisma");
  try {
    const id = String(c.req.param("id"));
    const club = await prisma.location.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, tableNumbers: true },
    });
    if (!club) {
      return c.json({ error: "Club not found" }, 404);
    }
    // tableNumbers is Json in SQLite/D1 — read as number[].
    const clubTableNumbers = (club.tableNumbers as number[]) ?? [];
    const tableNums =
      clubTableNumbers.length > 0 ? clubTableNumbers : DEFAULT_TABLES;

    const tables = await Promise.all(
      tableNums.map(async (t) => {
        // Prefer an active match on this table; otherwise the most recent one.
        let m = await prisma.v3Match.findFirst({
          where: { locationId: id, tableNumber: t, status: "ACTIVE" },
          orderBy: { updatedAt: "desc" },
          include: matchInclude,
        });
        if (!m) {
          m = await prisma.v3Match.findFirst({
            where: { locationId: id, tableNumber: t, status: { in: ["FINISHED", "ABORTED"] } },
            orderBy: { startedAt: "desc" },
            include: matchInclude,
          });
        }
        return { tableNumber: t, match: m ? shapeMatch(m as TableMatch) : null };
      })
    );

    // Active matches in this club that aren't on one of the known tables
    // (no table number, or a table number outside the club's set).
    const otherRaw = await prisma.v3Match.findMany({
      where: {
        locationId: id,
        status: "ACTIVE",
        OR: [{ tableNumber: null }, { tableNumber: { notIn: tableNums } }],
      },
      orderBy: { updatedAt: "desc" },
      include: matchInclude,
      take: 50,
    });
    const otherMatches = otherRaw.map((m) => ({
      ...shapeMatch(m as TableMatch),
      tableNumber: (m as TableMatch & { tableNumber: number | null }).tableNumber ?? null,
    }));

    return c.json({ data: { club, tables, otherMatches } });
  } catch (e) {
    console.error("[v3] Error fetching club tables:", e);
    return c.json({ error: "Failed to fetch tables" }, 500);
  }
});
