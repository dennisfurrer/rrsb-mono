import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { normaliseBigInts, getMonthName } from "../lib/utils.js";
import { TEST_PLAYER_SQL_FILTER } from "../lib/constants.js";

export const highlightsRouter = Router();

// GET /highlights/available-periods
highlightsRouter.get(
  "/available-periods",
  async (_req: Request, res: Response) => {
    try {
      const periods = await prisma.$queryRaw<
        { year: number; month: number }[]
      >`
        SELECT DISTINCT
          EXTRACT(YEAR FROM "createdAt")::integer as year,
          EXTRACT(MONTH FROM "createdAt")::integer as month
        FROM "Match"
        WHERE "createdAt" IS NOT NULL
          AND "winner" IS NOT NULL
        ORDER BY year DESC, month DESC
      `;

      const years = [...new Set(periods.map((p) => p.year))].sort(
        (a, b) => b - a
      );
      const months = periods.map((p) => ({ year: p.year, month: p.month }));

      res.json({ data: { months, years } });
    } catch (e) {
      console.error("Error fetching available periods:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /highlights/month/:year/:month
highlightsRouter.get(
  "/month/:year/:month",
  async (req: Request, res: Response) => {
    const year = parseInt(String(req.params.year));
    const month = parseInt(String(req.params.month));

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ error: "Invalid year or month" });
      return;
    }

    try {
      const playerStats = await getPlayerOfThePeriod(year, month);

      res.json({
        data: {
          month: getMonthName(month),
          year,
          playerOfTheMonth: playerStats,
        },
      });
    } catch (e) {
      console.error("Error fetching monthly highlights:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /highlights/year/:year
highlightsRouter.get("/year/:year", async (req: Request, res: Response) => {
  const year = parseInt(String(req.params.year));

  if (isNaN(year)) {
    res.status(400).json({ error: "Invalid year" });
    return;
  }

  try {
    const playerStats = await getPlayerOfThePeriod(year, null);

    res.json({
      data: {
        year,
        playerOfTheYear: playerStats,
      },
    });
  } catch (e) {
    console.error("Error fetching yearly highlights:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function getPlayerOfThePeriod(year: number, month: number | null) {
  // Build the date filter as Prisma tagged template
  // We need to use $queryRawUnsafe here because the date filter is dynamic
  const dateFilter =
    month !== null
      ? `EXTRACT(YEAR FROM "createdAt") = ${Number(year)} AND EXTRACT(MONTH FROM "createdAt") = ${Number(month)}`
      : `EXTRACT(YEAR FROM "createdAt") = ${Number(year)}`;

  const query = `
    WITH period_matches AS (
      SELECT *
      FROM "Match"
      WHERE ${dateFilter}
        AND "winner" IS NOT NULL
        ${TEST_PLAYER_SQL_FILTER}
    ),
    player_stats AS (
      SELECT
        player_name,
        COUNT(*) FILTER (WHERE player_name = "winner") AS matches_won,
        COUNT(*) AS matches_played,
        SUM(frames_won) AS frames_played,
        MAX(highest_break) AS highest_break,
        COUNT(*) FILTER (WHERE highest_break >= 50) AS breaks_50_plus,
        COUNT(*) FILTER (WHERE highest_break >= 70) AS breaks_70_plus,
        COUNT(*) FILTER (WHERE highest_break >= 100) AS breaks_100_plus,
        nationality
      FROM (
        SELECT
          "player1Name" AS player_name, "winner",
          "framesPlayer1" + "framesPlayer2" AS frames_won,
          (SELECT MAX(b) FROM unnest("breaksPlayer1") AS b) AS highest_break,
          "player1NationIOC" AS nationality
        FROM period_matches
        UNION ALL
        SELECT
          "player2Name" AS player_name, "winner",
          "framesPlayer1" + "framesPlayer2" AS frames_won,
          (SELECT MAX(b) FROM unnest("breaksPlayer2") AS b) AS highest_break,
          "player2NationIOC" AS nationality
        FROM period_matches
      ) AS all_player_records
      GROUP BY player_name, nationality
    )
    SELECT
      player_name, nationality, matches_won, matches_played,
      frames_played, highest_break, breaks_50_plus, breaks_70_plus,
      breaks_100_plus,
      ROUND(100.0 * matches_won / NULLIF(matches_played, 0), 2) AS win_rate
    FROM player_stats
    ORDER BY matches_won DESC, highest_break DESC, breaks_50_plus DESC
    LIMIT 1
  `;

  // Safe: year and month are validated as integers above
  const result = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(query);

  if (result.length === 0) return null;

  const player = result[0];
  const playerName = player.player_name as string;

  // Calculate win streaks — uses $queryRawUnsafe because date filter is dynamic
  // Safe: year/month are validated integers, playerName is from a trusted query result
  const streakQuery = `
    SELECT "winner"
    FROM "Match"
    WHERE ${dateFilter}
      AND ("player1Name" = $1 OR "player2Name" = $1)
      AND "winner" IS NOT NULL
    ORDER BY "createdAt" ASC
  `;

  const playerMatches = await prisma.$queryRawUnsafe<
    { winner: string | null }[]
  >(streakQuery, playerName);

  let streak = 0;
  let longestStreak = 0;
  for (const match of playerMatches) {
    if (match.winner === playerName) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  const stats = {
    matches_played: Number(player.matches_played),
    matches_won: Number(player.matches_won),
    frames_played: Number(player.frames_played),
    highest_break: Number(player.highest_break),
    breaks_50_plus: Number(player.breaks_50_plus),
    breaks_70_plus: Number(player.breaks_70_plus),
    breaks_100_plus: Number(player.breaks_100_plus),
    win_rate: Number(player.win_rate),
    longest_win_streak: longestStreak,
  };

  const achievements: { stat: string; value: number | string; icon: string }[] =
    [];

  if (stats.matches_played >= 10)
    achievements.push({
      stat: "Most Matches Played",
      value: stats.matches_played,
      icon: "🏆",
    });
  if (stats.frames_played >= 30)
    achievements.push({
      stat: "Most Frames Played",
      value: stats.frames_played,
      icon: "🎯",
    });
  if (stats.highest_break >= 50)
    achievements.push({
      stat: "Highest Break",
      value: stats.highest_break,
      icon: "⭐",
    });
  if (stats.breaks_50_plus >= 5)
    achievements.push({
      stat: "Number of 50+ Breaks",
      value: stats.breaks_50_plus,
      icon: "🔥",
    });
  if (stats.breaks_70_plus >= 3)
    achievements.push({
      stat: "Number of 70+ Breaks",
      value: stats.breaks_70_plus,
      icon: "💪",
    });
  if (stats.breaks_100_plus >= 1)
    achievements.push({
      stat: "Century Breaks",
      value: stats.breaks_100_plus,
      icon: "💯",
    });
  if (stats.longest_win_streak >= 5)
    achievements.push({
      stat: "Longest Win Streak",
      value: stats.longest_win_streak,
      icon: "📈",
    });
  if (stats.win_rate >= 60 && stats.matches_played >= 10)
    achievements.push({
      stat: "Match Win Rate",
      value: `${Math.round(stats.win_rate)}%`,
      icon: "🎖️",
    });

  // Fill to at least 5 achievements
  if (achievements.length < 5) {
    const additional: {
      stat: string;
      value: number;
      icon: string;
      score: number;
    }[] = [];
    if (!achievements.some((a) => a.stat === "Most Matches Played"))
      additional.push({
        stat: "Most Matches Played",
        value: stats.matches_played,
        icon: "🏆",
        score: stats.matches_played,
      });
    if (!achievements.some((a) => a.stat === "Most Frames Played"))
      additional.push({
        stat: "Most Frames Played",
        value: stats.frames_played,
        icon: "🎯",
        score: stats.frames_played,
      });
    if (!achievements.some((a) => a.stat === "Highest Break"))
      additional.push({
        stat: "Highest Break",
        value: stats.highest_break,
        icon: "⭐",
        score: stats.highest_break,
      });
    if (!achievements.some((a) => a.stat === "Number of 50+ Breaks"))
      additional.push({
        stat: "Number of 50+ Breaks",
        value: stats.breaks_50_plus,
        icon: "🔥",
        score: stats.breaks_50_plus,
      });
    if (!achievements.some((a) => a.stat === "Longest Win Streak"))
      additional.push({
        stat: "Longest Win Streak",
        value: stats.longest_win_streak,
        icon: "📈",
        score: stats.longest_win_streak,
      });

    additional.sort((a, b) => b.score - a.score);
    const needed = 5 - achievements.length;
    achievements.push(
      ...additional
        .slice(0, needed)
        .map(({ score: _score, ...rest }) => rest)
    );
  }

  return {
    name: playerName,
    nationality: (player.nationality as string) || "SUI",
    achievements: achievements.slice(0, 6),
  };
}
