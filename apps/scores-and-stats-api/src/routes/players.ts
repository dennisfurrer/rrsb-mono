import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { normaliseBigInts } from "../lib/utils.js";
import { fetchPlayerHighBreaks } from "./breaks.js";

export const playersRouter = Router();

// GET /players
playersRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const players = await prisma.$queryRaw<{ name: string }[]>`
      SELECT DISTINCT name
      FROM (
        SELECT "player1Name" as name
        FROM "Match"
        WHERE "player1Name" NOT IN ('Spieler A', 'Spieler B', 'Player1', 'Player2', '1', '2')
        AND "player1Name" NOT LIKE '@Neuer Spieler%'
        UNION
        SELECT "player2Name" as name
        FROM "Match"
        WHERE "player2Name" NOT IN ('Spieler A', 'Spieler B', 'Player1', 'Player2', '1', '2')
        AND "player2Name" NOT LIKE '@Neuer Spieler%'
      ) as players
      ORDER BY name ASC
    `;

    const playerNames = players.map((p) => p.name);

    res.json({
      data: playerNames,
      metadata: { totalPlayers: playerNames.length },
    });
  } catch (e) {
    console.error("Error fetching players:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /players/:playerName
playersRouter.get("/:playerName", async (req: Request, res: Response) => {
  try {
    const playerName = String(req.params.playerName);

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ player1Name: playerName }, { player2Name: playerName }],
      },
      orderBy: { createdAt: "asc" },
    });

    let nationality: string | null = null;
    for (const match of matches) {
      if (match.player1Name === playerName && match.player1NationIOC) {
        nationality = match.player1NationIOC;
        break;
      } else if (match.player2Name === playerName && match.player2NationIOC) {
        nationality = match.player2NationIOC;
        break;
      }
    }

    const breaksListPlayer = (await fetchPlayerHighBreaks(playerName, 10)) as {
      name: string;
      highbreaks: number[];
    }[];

    const highestBreakPerMatch: number[] = [];
    for (const match of matches) {
      const breaks =
        match.player1Name === playerName
          ? match.breaksPlayer1
          : match.breaksPlayer2;
      if (breaks.length > 0) highestBreakPerMatch.push(breaks[0]);
    }

    const averageBreakPerMatch = highestBreakPerMatch.length
      ? Math.round(
          highestBreakPerMatch.reduce((a, b) => a + b, 0) /
            highestBreakPerMatch.length
        )
      : 0;

    const opponentQuery = await prisma.$queryRaw<
      {
        opponent: string;
        total_matches: bigint;
        wins: bigint;
        win_percentage: number;
      }[]
    >`
      SELECT opponent, COUNT(*) AS total_matches,
        SUM(CASE WHEN winner = ${playerName} THEN 1 ELSE 0 END) AS wins,
        ROUND(100.0 * SUM(CASE WHEN winner = ${playerName} THEN 1 ELSE 0 END) / COUNT(*), 2) AS win_percentage
      FROM (
        SELECT
          CASE
            WHEN "player1Name" = ${playerName} THEN "player2Name"
            WHEN "player2Name" = ${playerName} THEN "player1Name"
            ELSE NULL
          END AS opponent,
          winner
        FROM "Match"
        WHERE ("player1Name" = ${playerName} OR "player2Name" = ${playerName}) AND winner IS NOT NULL
      ) sub
      WHERE opponent IS NOT NULL
      GROUP BY opponent
      ORDER BY total_matches DESC
      LIMIT 1
    `;

    const mostFrequentOpponentRaw = opponentQuery[0] || null;
    const mostFrequentOpponent = mostFrequentOpponentRaw
      ? {
          opponent: mostFrequentOpponentRaw.opponent,
          total_matches: Number(mostFrequentOpponentRaw.total_matches),
          wins: Number(mostFrequentOpponentRaw.wins),
          win_percentage: parseFloat(
            (Number(mostFrequentOpponentRaw.win_percentage) / 100).toFixed(2)
          ),
        }
      : null;

    const deciders = await prisma.$queryRaw<
      { decider_wins: bigint; decider_matches: bigint }[]
    >`
      SELECT
        COUNT(*) FILTER (WHERE ("framesPlayer1" + "framesPlayer2" = "bestOf" AND "winner" = ${playerName})) AS decider_wins,
        COUNT(*) FILTER (WHERE ("framesPlayer1" + "framesPlayer2" = "bestOf")) AS decider_matches
      FROM "Match"
      WHERE ("player1Name" = ${playerName} OR "player2Name" = ${playerName}) AND "winner" IS NOT NULL
    `;

    const deciderWinRate =
      deciders.length > 0 && Number(deciders[0].decider_matches) > 0
        ? Math.round(
            (Number(deciders[0].decider_wins) /
              Number(deciders[0].decider_matches)) *
              100
          )
        : 0;

    let streak = 0;
    let longestStreak = 0;
    for (const match of matches) {
      if (match.winner === playerName) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else if (match.winner) {
        streak = 0;
      }
    }

    const avgBreaksByMonthRaw = await prisma.$queryRaw<
      { month: string; avg_high_break: number }[]
    >`
      SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month,
        ROUND(AVG(high_break), 2) AS avg_high_break
      FROM (
        SELECT
          "createdAt",
          CASE
            WHEN "player1Name" = ${playerName} THEN (SELECT MAX(b) FROM unnest("breaksPlayer1") AS b)
            WHEN "player2Name" = ${playerName} THEN (SELECT MAX(b) FROM unnest("breaksPlayer2") AS b)
            ELSE NULL
          END AS high_break,
          "framesPlayer1", "framesPlayer2"
        FROM "Match"
        WHERE "player1Name" = ${playerName} OR "player2Name" = ${playerName}
      ) AS sub
      WHERE high_break IS NOT NULL AND ("framesPlayer1" + "framesPlayer2") > 0
      GROUP BY month
      ORDER BY month ASC
    `;

    const avgBreaksByMonth = avgBreaksByMonthRaw.map((entry) => ({
      month: entry.month,
      avg_high_break: Math.round(Number(entry.avg_high_break)),
    }));

    const playerStats = {
      name: playerName,
      nationality,
      matchesPlayed: matches.length,
      matchesCompleted: matches.filter((m) => m.winner).length,
      matchesWon: matches.filter((m) => m.winner === playerName).length,
      matchesLost: matches.filter(
        (m) => m.winner && m.winner !== playerName
      ).length,
      framesWon: matches.reduce(
        (total, m) =>
          total +
          (m.player1Name === playerName ? m.framesPlayer1 : m.framesPlayer2),
        0
      ),
      framesLost: matches.reduce(
        (total, m) =>
          total +
          (m.player1Name === playerName ? m.framesPlayer2 : m.framesPlayer1),
        0
      ),
      highBreaks: breaksListPlayer[0]?.highbreaks || [],
      incompleteMatches: matches.filter((m) => !m.winner).length,
      averageBreakPerMatch,
      mostFrequentOpponent,
      deciderWinRate,
      longestWinStreak: longestStreak,
      avgBreaksByMonth,
    };

    res.json({ data: normaliseBigInts(playerStats) });
  } catch (e) {
    console.error("Error fetching player stats:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

