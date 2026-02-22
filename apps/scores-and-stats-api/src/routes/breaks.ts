import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { isValid, parseISO } from "date-fns";
import { normaliseBigInts } from "../lib/utils.js";

export const breaksRouter = Router();

// Shared query functions exported for use by other routes

export async function fetchBreaksByDate(
  year: number,
  month: number,
  day: number
) {
  return prisma.$queryRaw`
    WITH PlayerBreaks AS (
      SELECT
        m."createdAt",
        unnest(m."breaksPlayer1") AS hb,
        m."player1Name" AS "playerName"
      FROM "Match" m
      WHERE EXTRACT(YEAR FROM m."createdAt") = ${year}
        AND EXTRACT(MONTH FROM m."createdAt") = ${month}
        AND EXTRACT(DAY FROM m."createdAt") = ${day}
        AND m."breaksPlayer1" IS NOT NULL
      UNION ALL
      SELECT
        m."createdAt",
        unnest(m."breaksPlayer2") AS hb,
        m."player2Name" AS "playerName"
      FROM "Match" m
      WHERE EXTRACT(YEAR FROM m."createdAt") = ${year}
        AND EXTRACT(MONTH FROM m."createdAt") = ${month}
        AND EXTRACT(DAY FROM m."createdAt") = ${day}
        AND m."breaksPlayer2" IS NOT NULL
    )
    SELECT
      pb."playerName",
      array_agg(pb.hb ORDER BY pb.hb DESC) FILTER (WHERE pb.hb IS NOT NULL) AS "highBreaks"
    FROM PlayerBreaks pb
    GROUP BY pb."playerName"
    ORDER BY max(pb.hb) DESC
  `;
}

export async function fetchHighestBreaksPerPlayer(breaksPerPlayer = 25) {
  return prisma.$queryRaw`
    WITH player_breaks AS (
      SELECT m."player1Name" AS name, unnest(m."breaksPlayer1") AS "highBreak"
      FROM "Match" m
      WHERE m."breaksPlayer1" IS NOT NULL
        AND m."player1Name" NOT IN ('Spieler A', 'Spieler B', '1', '2')
        AND m."player1Name" NOT LIKE '@Neuer Spieler%'
      UNION ALL
      SELECT m."player2Name" AS name, unnest(m."breaksPlayer2") AS "highBreak"
      FROM "Match" m
      WHERE m."breaksPlayer2" IS NOT NULL
        AND m."player2Name" NOT IN ('Spieler A', 'Spieler B', '1', '2')
        AND m."player2Name" NOT LIKE '@Neuer Spieler%'
    ), ranked_breaks AS (
      SELECT name, "highBreak",
        row_number() OVER (PARTITION BY name ORDER BY "highBreak" DESC) AS rn
      FROM player_breaks
    )
    SELECT name,
      array_agg("highBreak" ORDER BY "highBreak" DESC) AS "highBreaks"
    FROM ranked_breaks
    WHERE rn <= ${breaksPerPlayer}
    GROUP BY name
    ORDER BY "highBreaks" DESC
  `;
}

export async function fetchPlayerHighBreaks(
  playerName: string,
  breaksPerPlayer = 25
) {
  return prisma.$queryRaw`
    WITH player_breaks AS (
      SELECT m."player1Name" AS name, unnest(m."breaksPlayer1") AS "highBreak"
      FROM "Match" m
      WHERE m."player1Name" = ${playerName} AND m."breaksPlayer1" IS NOT NULL
      UNION ALL
      SELECT m."player2Name", unnest(m."breaksPlayer2")
      FROM "Match" m
      WHERE m."player2Name" = ${playerName} AND m."breaksPlayer2" IS NOT NULL
    ), ranked_breaks AS (
      SELECT name, "highBreak",
        row_number() OVER (PARTITION BY name ORDER BY "highBreak" DESC) AS rn
      FROM player_breaks
    )
    SELECT name,
      array_agg("highBreak" ORDER BY "highBreak" DESC) AS highbreaks
    FROM ranked_breaks
    WHERE rn <= ${breaksPerPlayer}
    GROUP BY name
    ORDER BY highbreaks DESC
  `;
}

async function fetchBreaksByYear(year: number, breaksPerPlayer = 25) {
  return prisma.$queryRaw`
    WITH player_breaks AS (
      SELECT m."player1Name" AS name, unnest(m."breaksPlayer1") AS "highBreak"
      FROM "Match" m
      WHERE EXTRACT(YEAR FROM m."createdAt") = ${year}
        AND m."breaksPlayer1" IS NOT NULL
        AND m."player1Name" NOT IN ('Spieler A', 'Spieler B', '1', '2')
        AND m."player1Name" NOT LIKE '@Neuer Spieler%'
      UNION ALL
      SELECT m."player2Name" AS name, unnest(m."breaksPlayer2") AS "highBreak"
      FROM "Match" m
      WHERE EXTRACT(YEAR FROM m."createdAt") = ${year}
        AND m."breaksPlayer2" IS NOT NULL
        AND m."player2Name" NOT IN ('Spieler A', 'Spieler B', '1', '2')
        AND m."player2Name" NOT LIKE '@Neuer Spieler%'
    ), ranked_breaks AS (
      SELECT name, "highBreak",
        row_number() OVER (PARTITION BY name ORDER BY "highBreak" DESC) AS rn
      FROM player_breaks
    )
    SELECT name,
      array_agg("highBreak" ORDER BY "highBreak" DESC) AS "highBreaks"
    FROM ranked_breaks
    WHERE rn <= ${breaksPerPlayer}
    GROUP BY name
    ORDER BY "highBreaks" DESC
  `;
}

// GET /breaks/leaderboard
breaksRouter.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const data = await fetchHighestBreaksPerPlayer(25);
    res.json({ data });
  } catch (e) {
    console.error("Error fetching leaderboard:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /breaks/year/:year
breaksRouter.get("/year/:year", async (req: Request, res: Response) => {
  const year = parseInt(String(req.params.year));
  if (isNaN(year)) {
    res.status(400).json({ error: "Invalid year format" });
    return;
  }

  try {
    const data = await fetchBreaksByYear(year);
    res.json({ data });
  } catch (e) {
    console.error("Error fetching breaks by year:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /breaks/:date
breaksRouter.get("/:date", async (req: Request, res: Response) => {
  try {
    const date = parseISO(String(req.params.date));
    if (!isValid(date)) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    const data = await fetchBreaksByDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );

    res.json({ data });
  } catch (e) {
    console.error("Error fetching breaks by date:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Standalone handlers for routes mounted directly in index.ts

export const breaksMatrixHandler = async (_req: Request, res: Response) => {
  try {
    const rawData = await prisma.$queryRaw<Record<string, unknown>[]>`
      WITH player_matches AS (
        SELECT "player1Name" AS player_name, "breaksPlayer1" AS breaks, ("framesPlayer1" + "framesPlayer2") AS match_frames
        FROM "Match"
        UNION ALL
        SELECT "player2Name" AS player_name, "breaksPlayer2" AS breaks, ("framesPlayer1" + "framesPlayer2") AS match_frames
        FROM "Match"
      ),
      breaks_unnested AS (
        SELECT pm.player_name, pm.match_frames, unnest(pm.breaks) AS break_value
        FROM player_matches pm
        WHERE pm.player_name IS NOT NULL
      ),
      frames_aggregated AS (
        SELECT player_name, SUM(match_frames) AS total_frames_played
        FROM player_matches
        GROUP BY player_name
      ),
      max_breaks AS (
        SELECT player_name, MAX(break_value) AS highest_break
        FROM breaks_unnested
        GROUP BY player_name
      )
      SELECT
        b.player_name,
        f.total_frames_played AS "Total Frames Played",
        m.highest_break AS "Highest Break",
        COUNT(*) FILTER (WHERE break_value >= 20)  AS "20+",
        COUNT(*) FILTER (WHERE break_value >= 30)  AS "30+",
        COUNT(*) FILTER (WHERE break_value >= 40)  AS "40+",
        COUNT(*) FILTER (WHERE break_value >= 50)  AS "50+",
        COUNT(*) FILTER (WHERE break_value >= 60)  AS "60+",
        COUNT(*) FILTER (WHERE break_value >= 70)  AS "70+",
        COUNT(*) FILTER (WHERE break_value >= 80)  AS "80+",
        COUNT(*) FILTER (WHERE break_value >= 90)  AS "90+",
        COUNT(*) FILTER (WHERE break_value >= 100) AS "100+"
      FROM breaks_unnested b
      LEFT JOIN frames_aggregated f ON b.player_name = f.player_name
      LEFT JOIN max_breaks m ON b.player_name = m.player_name
      GROUP BY b.player_name, f.total_frames_played, m.highest_break
      ORDER BY m.highest_break DESC
    `;

    res.json({ data: normaliseBigInts(rawData) });
  } catch (e) {
    console.error("Error generating break matrix:", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const dataYearsHandler = async (_req: Request, res: Response) => {
  try {
    const years = await prisma.$queryRaw<{ year: number }[]>`
      SELECT DISTINCT
        EXTRACT(YEAR FROM "createdAt")::integer as year
      FROM "Match"
      WHERE "createdAt" IS NOT NULL
      ORDER BY year DESC
    `;

    res.json({ data: years.map((y) => y.year) });
  } catch (e) {
    console.error("Error fetching years:", e);
    res.status(500).json({ error: "Internal server error" });
  }
};
