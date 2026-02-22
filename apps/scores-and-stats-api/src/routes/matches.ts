import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { z } from "zod";
import { TEST_PLAYERS, NUMBER_OF_TABLES } from "../lib/constants.js";

export const matchesRouter = Router();

const createMatchSchema = z.object({
  players: z.tuple([
    z.object({
      name: z.string().min(1),
      nationalityIOC: z.string().optional().default(""),
      frames: z.number().int().min(0),
      highbreaks: z.array(z.number().int()).default([]),
      winner: z.boolean().default(false),
    }),
    z.object({
      name: z.string().min(1),
      nationalityIOC: z.string().optional().default(""),
      frames: z.number().int().min(0),
      highbreaks: z.array(z.number().int()).default([]),
      winner: z.boolean().default(false),
    }),
  ]),
  bestOf: z.number().int().min(1),
  tableNumber: z.union([z.number(), z.string()]).optional(),
});

const updateMatchSchema = z.object({
  type: z.string(),
  matchState: z.object({
    matchId: z.string(),
    bestOf: z.number().int().min(1),
    players: z.tuple([
      z.object({
        name: z.string(),
        frames: z.number().int().min(0),
        highbreaks: z.array(z.number().int()).default([]),
        winner: z.boolean().default(false),
      }),
      z.object({
        name: z.string(),
        frames: z.number().int().min(0),
        highbreaks: z.array(z.number().int()).default([]),
        winner: z.boolean().default(false),
      }),
    ]),
  }),
  tableNumber: z.union([z.number(), z.string()]).optional(),
});

// POST /api/matches
matchesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const body = createMatchSchema.parse(req.body);
    const [p1, p2] = body.players;

    const match = await prisma.match.create({
      data: {
        player1Name: p1.name,
        player2Name: p2.name,
        player1NationIOC: p1.nationalityIOC || "",
        player2NationIOC: p2.nationalityIOC || "",
        active: true,
        bestOf: body.bestOf,
        framesPlayer1: p1.frames,
        framesPlayer2: p2.frames,
        breaksPlayer1: p1.highbreaks,
        breaksPlayer2: p2.highbreaks,
        winner: p1.winner ? p1.name : p2.winner ? p2.name : null,
        rawGameLog: JSON.stringify(req.body, null, 2),
        tableNumber: body.tableNumber ? Number(body.tableNumber) : null,
      },
    });

    res.json({ data: { matchId: match.id } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: e.errors });
      return;
    }
    console.error("Error creating match:", e);
    res.status(500).json({ error: "Failed to create match" });
  }
});

// PATCH /api/matches
matchesRouter.patch("/", async (req: Request, res: Response) => {
  try {
    const body = updateMatchSchema.parse(req.body);
    const { matchState, type } = body;
    const [p1, p2] = matchState.players;
    const isEnd = type === "END_MATCH";

    await prisma.match.upsert({
      where: { id: matchState.matchId },
      update: {
        active: !isEnd,
        bestOf: matchState.bestOf,
        framesPlayer1: p1.frames,
        framesPlayer2: p2.frames,
        breaksPlayer1: { set: p1.highbreaks },
        breaksPlayer2: { set: p2.highbreaks },
        winner: p1.winner ? p1.name : p2.winner ? p2.name : null,
        rawGameLog: JSON.stringify(matchState, null, 2),
      },
      create: {
        player1Name: p1.name,
        player2Name: p2.name,
        active: !isEnd,
        bestOf: matchState.bestOf,
        framesPlayer1: p1.frames,
        framesPlayer2: p2.frames,
        breaksPlayer1: { set: p1.highbreaks },
        breaksPlayer2: { set: p2.highbreaks },
        winner: p1.winner ? p1.name : p2.winner ? p2.name : null,
        rawGameLog: JSON.stringify(matchState, null, 2),
        tableNumber: body.tableNumber ? Number(body.tableNumber) : null,
      },
    });

    res.json({ data: { matchId: matchState.matchId } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: e.errors });
      return;
    }
    console.error("Error updating match:", e);
    res.status(500).json({ error: "Failed to update match" });
  }
});

// GET /api/matches/live
matchesRouter.get("/live", async (_req: Request, res: Response) => {
  try {
    const matches = [];

    for (let i = 1; i <= NUMBER_OF_TABLES; i++) {
      const match = await prisma.match.findFirst({
        where: {
          tableNumber: i,
          player1Name: { not: { in: TEST_PLAYERS } },
          player2Name: { not: { in: TEST_PLAYERS } },
        },
        orderBy: { updatedAt: "desc" },
      });
      if (match) matches.push(match);
    }

    res.json({ data: matches });
  } catch (e) {
    console.error("Error fetching live matches:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});
