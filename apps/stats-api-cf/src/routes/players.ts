import { Hono } from "hono";
import type { AppEnv } from "../types";

export const playersRouter = new Hono<AppEnv>();
export const breaksRouter = new Hono<AppEnv>();

// GET /api/v3/players — list with lifetime aggregates
playersRouter.get("/", async (c) => {
  try {
    const prisma = c.get("prisma");
    const players = await prisma.v3Player.findMany({ orderBy: { name: "asc" } });
    return c.json({ data: players, metadata: { totalPlayers: players.length } });
  } catch (e) {
    console.error("[v3] Error listing players:", e);
    return c.json({ error: "Failed to list players" }, 500);
  }
});

// GET /api/v3/players/:name — full profile + per-match-type breakdown + recent matches
playersRouter.get("/:name", async (c) => {
  try {
    const prisma = c.get("prisma");
    const name = decodeURIComponent(String(c.req.param("name")));
    const player = await prisma.v3Player.findUnique({
      where: { name },
      include: {
        matchTypeStats: true,
        matchPlayers: {
          orderBy: { match: { startedAt: "desc" } },
          take: 50,
          include: {
            match: {
              include: { players: { orderBy: { playerIndex: "asc" } } },
            },
          },
        },
      },
    });
    if (!player) {
      return c.json({ error: "Player not found" }, 404);
    }

    const recentMatches = player.matchPlayers.map((mp) => {
      const opp = mp.match.players.find((p) => p.playerIndex !== mp.playerIndex);
      return {
        matchId: mp.match.id,
        matchType: mp.match.matchType,
        startedAt: mp.match.startedAt,
        finishedAt: mp.match.finishedAt,
        status: mp.match.status,
        bestOf: mp.match.bestOf,
        framesWon: mp.framesWon,
        framesLost: opp?.framesWon ?? 0,
        isWinner: mp.isWinner,
        highBreak: mp.highBreak,
        highBreaks: mp.highBreaks as number[],
        opponent: opp?.name ?? null,
      };
    });

    return c.json({
      data: {
        id: player.id,
        name: player.name,
        nationalityIOC: player.nationalityIOC,
        club: player.club,
        lifetime: {
          matchesPlayed: player.matchesPlayed,
          matchesWon: player.matchesWon,
          matchesLost: player.matchesLost,
          matchesDrawn: player.matchesDrawn,
          framesWon: player.framesWon,
          framesLost: player.framesLost,
          pointsFor: player.pointsFor,
          pointsAgainst: player.pointsAgainst,
          breaksOver7: player.breaksOver7,
          highBreak: player.highBreak,
          highBreaks: player.highBreaks as number[],
          centuries: player.centuries,
          foulsCommitted: player.foulsCommitted,
          foulPointsConceded: player.foulPointsConceded,
        },
        byMatchType: player.matchTypeStats,
        recentMatches,
      },
    });
  } catch (e) {
    console.error("[v3] Error fetching player:", e);
    return c.json({ error: "Failed to fetch player" }, 500);
  }
});

// GET /api/v3/breaks/leaderboard — top breaks per player (lifetime)
breaksRouter.get("/leaderboard", async (c) => {
  try {
    const prisma = c.get("prisma");
    const players = await prisma.v3Player.findMany({
      where: { highBreak: { gt: 7 } },
      orderBy: { highBreak: "desc" },
      take: 50,
      select: { name: true, nationalityIOC: true, highBreak: true, highBreaks: true },
    });
    return c.json({ data: players });
  } catch (e) {
    console.error("[v3] Error fetching break leaderboard:", e);
    return c.json({ error: "Failed to fetch leaderboard" }, 500);
  }
});
