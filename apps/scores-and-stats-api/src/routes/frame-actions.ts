import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { z } from "zod";

export const frameActionsRouter = Router();

const singleActionSchema = z.object({
  matchId: z.string().min(1),
  frameNumber: z.number().int().optional().default(1),
  actionType: z.string().min(1),
  playerIndex: z.number().int(),
  points: z.number().int().optional().default(0),
  metadata: z.record(z.unknown()).optional(),
});

const bulkActionsSchema = z.object({
  matchId: z.string().min(1),
  actions: z.array(
    z.object({
      frameNumber: z.number().int(),
      actionType: z.string().min(1),
      playerIndex: z.number().int(),
      points: z.number().int().optional().default(0),
      metadata: z.record(z.unknown()).optional(),
      timestamp: z.string().optional(),
    })
  ),
});

const UNDO_TYPES = ["undo", "UNDO"];
const NON_SCORING_TYPES = [
  "undo", "UNDO",
  "frame_end", "FRAME_END",
  "match_end", "MATCH_END",
  "rerack", "RERACK",
];

// POST /api/frame-actions/single
frameActionsRouter.post("/single", async (req: Request, res: Response) => {
  try {
    const body = singleActionSchema.parse(req.body);

    if (UNDO_TYPES.includes(body.actionType)) {
      const lastAction = await prisma.frameAction.findFirst({
        where: {
          matchId: body.matchId,
          frameNumber: body.frameNumber,
          wasUndone: false,
          actionType: { notIn: NON_SCORING_TYPES },
        },
        orderBy: { timestamp: "desc" },
      });

      if (lastAction) {
        await prisma.frameAction.update({
          where: { id: lastAction.id },
          data: { wasUndone: true },
        });
      }
    }

    const action = await prisma.frameAction.create({
      data: {
        matchId: body.matchId,
        frameNumber: body.frameNumber,
        actionType: body.actionType,
        playerIndex: body.playerIndex,
        points: body.points,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    });

    res.json({ data: action });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: e.errors });
      return;
    }
    console.error("Error storing frame action:", e);
    res.status(500).json({ error: "Failed to store frame action" });
  }
});

// POST /api/frame-actions
frameActionsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const body = bulkActionsSchema.parse(req.body);

    const created = await prisma.frameAction.createMany({
      data: body.actions.map((action) => ({
        matchId: body.matchId,
        frameNumber: action.frameNumber,
        actionType: action.actionType,
        playerIndex: action.playerIndex,
        points: action.points,
        metadata: action.metadata ? JSON.stringify(action.metadata) : null,
        timestamp: action.timestamp ? new Date(action.timestamp) : new Date(),
      })),
    });

    res.json({ data: { count: created.count } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: e.errors });
      return;
    }
    console.error("Error storing frame actions:", e);
    res.status(500).json({ error: "Failed to store frame actions" });
  }
});

// PATCH /api/frame-actions/:id/flag — toggle manualFlagToIgnore
frameActionsRouter.patch("/:id/flag", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.frameAction.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "FrameAction not found" });
      return;
    }

    const updated = await prisma.frameAction.update({
      where: { id },
      data: { manualFlagToIgnore: !existing.manualFlagToIgnore },
    });

    res.json({ data: updated });
  } catch (e) {
    console.error("Error toggling flag:", e);
    res.status(500).json({ error: "Failed to toggle flag" });
  }
});

// GET /api/frame-actions/:matchId
frameActionsRouter.get("/:matchId", async (req: Request, res: Response) => {
  try {
    const actions = await prisma.frameAction.findMany({
      where: { matchId: String(req.params.matchId) },
      orderBy: { timestamp: "asc" },
    });

    res.json({ data: actions });
  } catch (e) {
    console.error("Error fetching frame actions:", e);
    res.status(500).json({ error: "Failed to fetch frame actions" });
  }
});

// GET /api/frame-actions/:matchId/breaks/:playerIndex — breaks for a player (top 10)
frameActionsRouter.get(
  "/:matchId/breaks/:playerIndex",
  async (req: Request, res: Response) => {
    try {
      const matchId = req.params.matchId as string;
      const playerIndex = req.params.playerIndex as string;
      const breaks = await prisma.frameAction.findMany({
        where: {
          matchId,
          playerIndex: Number(playerIndex),
          actionType: "break",
          wasUndone: false,
          points: { gt: 7 },
        },
        orderBy: { points: "desc" },
        take: 10,
        select: {
          id: true,
          points: true,
          frameNumber: true,
          manualFlagToIgnore: true,
          timestamp: true,
        },
      });

      res.json({ data: breaks });
    } catch (e) {
      console.error("Error fetching breaks:", e);
      res.status(500).json({ error: "Failed to fetch breaks" });
    }
  }
);
