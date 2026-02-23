import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";

export const scoreboardsPublicRouter = Router();

// POST /api/scoreboards/ping
scoreboardsPublicRouter.post("/ping", async (req: Request, res: Response) => {
  try {
    const { deviceId, tableNumber } = req.body;
    if (!deviceId) {
      res.status(400).json({ error: "deviceId is required" });
      return;
    }

    // Get default location for auto-registration
    const defaultLocation = await prisma.location.findFirst({
      where: { isDefault: true },
    });

    if (!defaultLocation) {
      res.status(500).json({ error: "No default location configured" });
      return;
    }

    const updateData: Record<string, unknown> = { lastPingAt: new Date() };
    if (tableNumber !== undefined) {
      updateData.tableNumber = Number(tableNumber) || null;
    }

    const config = await prisma.scoreboardConfig.upsert({
      where: { deviceId },
      update: updateData,
      create: {
        deviceId,
        locationId: defaultLocation.id,
        lastPingAt: new Date(),
        ...(tableNumber !== undefined && {
          tableNumber: Number(tableNumber) || null,
        }),
      },
      include: {
        location: { select: { name: true } },
        namesList: { select: { id: true, name: true } },
      },
    });

    res.json({
      config: {
        tableNumber: config.tableNumber,
        namesListId: config.namesListId,
        locationName: config.location.name,
      },
    });
  } catch (e) {
    console.error("Ping error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/scoreboards/assignments/pending - Assignments for a table (PENDING or CANCELLED)
scoreboardsPublicRouter.get(
  "/assignments/pending",
  async (req: Request, res: Response) => {
    try {
      const { deviceId, tableNumber } = req.query;

      const where: Record<string, unknown> = {
        status: { in: ["PENDING", "CANCELLED"] },
      };

      if (tableNumber) {
        where.tableNumber = Number(tableNumber);
      } else if (deviceId && typeof deviceId === "string") {
        where.OR = [{ deviceId }, { deviceId: null }];
      }

      const assignments = await prisma.matchAssignment.findMany({
        where,
        orderBy: { createdAt: "asc" },
        take: 1,
      });

      res.json({ data: assignments });
    } catch (e) {
      console.error("Error fetching pending assignments:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/scoreboards/assignments/claim - Claim a match assignment
scoreboardsPublicRouter.patch(
  "/assignments/claim",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }

      await prisma.matchAssignment.update({
        where: { id },
        data: { status: "CLAIMED" },
      });

      res.json({ success: true });
    } catch (e) {
      console.error("Error claiming assignment:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/scoreboards/assignments/cancel - Cancel a match assignment
scoreboardsPublicRouter.patch(
  "/assignments/cancel",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }

      await prisma.matchAssignment.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      res.json({ success: true });
    } catch (e) {
      console.error("Error cancelling assignment:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/scoreboards/assignments/complete - Complete a match assignment
scoreboardsPublicRouter.patch(
  "/assignments/complete",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }

      await prisma.matchAssignment.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      res.json({ success: true });
    } catch (e) {
      console.error("Error completing assignment:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/scoreboards/names-list/:id - Public endpoint for scoreboard-ui
scoreboardsPublicRouter.get(
  "/names-list/:id",
  async (req: Request, res: Response) => {
    try {
      const list = await prisma.namesList.findUnique({
        where: { id: req.params.id as string },
        include: {
          entries: { orderBy: { sortOrder: "asc" } },
        },
      });

      if (!list) {
        res.status(404).json({ error: "Names list not found" });
        return;
      }

      res.json({
        data: {
          id: list.id,
          name: list.name,
          entries: list.entries.map((e: { playerName: string; nationalityIOC: string }) => ({
            playerName: e.playerName,
            nationalityIOC: e.nationalityIOC,
          })),
        },
      });
    } catch (e) {
      console.error("Error fetching names list:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
