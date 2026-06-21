import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";

export const v3PlayersRouter = Router();
export const v3BreaksRouter = Router();

// GET /api/v3/players — list with lifetime aggregates
v3PlayersRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const players = await prisma.v3Player.findMany({ orderBy: { name: "asc" } });
    res.json({ data: players, metadata: { totalPlayers: players.length } });
  } catch (e) {
    console.error("[v3] Error listing players:", e);
    res.status(500).json({ error: "Failed to list players" });
  }
});

// GET /api/v3/players/:name — full profile + per-match-type breakdown + recent matches
v3PlayersRouter.get("/:name", async (req: Request, res: Response) => {
  try {
    const name = decodeURIComponent(String(req.params.name));
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
      res.status(404).json({ error: "Player not found" });
      return;
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
        highBreaks: mp.highBreaks,
        opponent: opp?.name ?? null,
      };
    });

    res.json({
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
          highBreaks: player.highBreaks,
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
    res.status(500).json({ error: "Failed to fetch player" });
  }
});

// GET /api/v3/breaks/leaderboard — top breaks per player (lifetime)
v3BreaksRouter.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const players = await prisma.v3Player.findMany({
      where: { highBreak: { gt: 7 } },
      orderBy: { highBreak: "desc" },
      take: 50,
      select: { name: true, nationalityIOC: true, highBreak: true, highBreaks: true },
    });
    res.json({ data: players });
  } catch (e) {
    console.error("[v3] Error fetching break leaderboard:", e);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
