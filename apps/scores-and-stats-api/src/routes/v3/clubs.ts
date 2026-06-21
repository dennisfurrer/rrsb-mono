import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import type { Prisma } from "@rrsb/db";

export const v3ClubsRouter = Router();

const DEFAULT_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const matchInclude = {
  players: { orderBy: { playerIndex: "asc" } },
  frames: { orderBy: { frameNumber: "desc" }, take: 1 },
} satisfies Prisma.V3MatchInclude;

type TableMatch = Prisma.V3MatchGetPayload<{ include: typeof matchInclude }>;

/** Curate a match into the compact shape the live board needs. */
function shapeMatch(m: TableMatch) {
  const latest = m.frames[0];
  return {
    id: m.id,
    status: m.status,
    matchType: m.matchType,
    matchTypeCode: m.matchTypeCode,
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

// GET /api/v3/clubs — list of clubs (locations)
v3ClubsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const clubs = await prisma.location.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, tableNumbers: true, isDefault: true },
    });
    res.json({ data: clubs });
  } catch (e) {
    console.error("[v3] Error listing clubs:", e);
    res.status(500).json({ error: "Failed to list clubs" });
  }
});

// GET /api/v3/clubs/:id/tables — per-table live-or-most-recent match
v3ClubsRouter.get("/:id/tables", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const club = await prisma.location.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, tableNumbers: true },
    });
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const tableNums =
      club.tableNumbers && club.tableNumbers.length > 0 ? club.tableNumbers : DEFAULT_TABLES;

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
        return { tableNumber: t, match: m ? shapeMatch(m) : null };
      })
    );

    res.json({ data: { club, tables } });
  } catch (e) {
    console.error("[v3] Error fetching club tables:", e);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});
