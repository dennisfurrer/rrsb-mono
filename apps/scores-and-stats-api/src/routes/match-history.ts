import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";

export const matchHistoryRouter = Router();

// GET /matches/player/:playerName
matchHistoryRouter.get("/:playerName", async (req: Request, res: Response) => {
  const playerName = String(req.params.playerName);
  const opponent = req.query.opponent as string | undefined;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    1000,
    Math.max(1, parseInt(req.query.limit as string) || 50)
  );
  const skip = (page - 1) * limit;

  try {
    const whereClause = opponent
      ? {
          OR: [
            { AND: [{ player1Name: playerName }, { player2Name: opponent }] },
            { AND: [{ player1Name: opponent }, { player2Name: playerName }] },
          ],
          NOT: {
            AND: [
              { framesPlayer1: 0 },
              { framesPlayer2: 0 },
              { breaksPlayer1: { equals: [] as number[] } },
              { breaksPlayer2: { equals: [] as number[] } },
            ],
          },
        }
      : {
          OR: [
            { player1Name: playerName },
            { player2Name: playerName },
          ],
          NOT: {
            AND: [
              { framesPlayer1: 0 },
              { framesPlayer2: 0 },
              { breaksPlayer1: { equals: [] as number[] } },
              { breaksPlayer2: { equals: [] as number[] } },
            ],
          },
        };

    const allMatches = await prisma.match.findMany({
      where: whereClause,
      select: {
        id: true,
        player1Name: true,
        player1NationIOC: true,
        player2Name: true,
        player2NationIOC: true,
        bestOf: true,
        framesPlayer1: true,
        framesPlayer2: true,
        winner: true,
        breaksPlayer1: true,
        breaksPlayer2: true,
        createdAt: true,
        tableNumber: true,
        rawGameLog: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Deduplicate
    const uniqueMatches = allMatches.filter(
      (match, index, self) =>
        index ===
        self.findIndex(
          (m) =>
            m.player1Name === match.player1Name &&
            m.player2Name === match.player2Name &&
            m.bestOf === match.bestOf &&
            m.framesPlayer1 === match.framesPlayer1 &&
            m.framesPlayer2 === match.framesPlayer2 &&
            JSON.stringify([...m.breaksPlayer1].sort()) ===
              JSON.stringify([...match.breaksPlayer1].sort()) &&
            JSON.stringify([...m.breaksPlayer2].sort()) ===
              JSON.stringify([...match.breaksPlayer2].sort())
        )
    );

    const totalMatches = uniqueMatches.length;
    const paginatedMatches = uniqueMatches.slice(skip, skip + limit);

    const formattedMatches = paginatedMatches.map((match) => ({
      id: match.id,
      player1Name: match.player1Name,
      player1NationIOC: match.player1NationIOC,
      player2Name: match.player2Name,
      player2NationIOC: match.player2NationIOC,
      bestOf: match.bestOf,
      framesPlayer1: match.framesPlayer1,
      framesPlayer2: match.framesPlayer2,
      winner: match.winner,
      topBreaksPlayer1: [...match.breaksPlayer1].sort((a, b) => b - a).slice(0, 10),
      topBreaksPlayer2: [...match.breaksPlayer2].sort((a, b) => b - a).slice(0, 10),
      date: match.createdAt,
      tableNumber: match.tableNumber,
      rawGameLog: match.rawGameLog,
    }));

    const matchesWon = formattedMatches.filter(
      (m) => m.winner === playerName
    ).length;
    const framesWon = formattedMatches.reduce(
      (total, m) =>
        total +
        (m.player1Name === playerName ? m.framesPlayer1 : m.framesPlayer2),
      0
    );
    const framesLost = formattedMatches.reduce(
      (total, m) =>
        total +
        (m.player1Name === playerName ? m.framesPlayer2 : m.framesPlayer1),
      0
    );

    res.json({
      data: formattedMatches,
      metadata: {
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalPages: Math.ceil(totalMatches / limit),
          totalMatches,
          hasNextPage: skip + limit < totalMatches,
          hasPreviousPage: page > 1,
        },
        currentPageStats: {
          matchesDisplayed: formattedMatches.length,
          matchesWon,
          framesWon,
          framesLost,
        },
      },
    });
  } catch (e) {
    console.error("Error fetching player matches:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});
