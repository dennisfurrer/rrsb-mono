import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { requireRole } from "../../middleware/auth.js";

export const scoreboardsAdminRouter = Router();

// GET /api/admin/scoreboards - List all with online status
scoreboardsAdminRouter.get(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const locationId = (req as any).scopedLocationId;
      const configs = await prisma.scoreboardConfig.findMany({
        where: locationId ? { locationId } : undefined,
        include: {
          location: { select: { id: true, name: true } },
          namesList: { select: { id: true, name: true } },
        },
        orderBy: { tableNumber: "asc" },
      });

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = configs.map((c) => ({
        ...c,
        online: c.lastPingAt ? c.lastPingAt > fiveMinAgo : false,
      }));

      res.json({ data: result });
    } catch (e) {
      console.error("Error listing scoreboards:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/scoreboards/:deviceId - Update table number, names list
scoreboardsAdminRouter.patch(
  "/:deviceId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const { tableNumber, namesListId, locationId } = req.body;

      const config = await prisma.scoreboardConfig.findUnique({
        where: { deviceId },
      });

      if (!config) {
        res.status(404).json({ error: "Scoreboard not found" });
        return;
      }

      const updated = await prisma.scoreboardConfig.update({
        where: { deviceId },
        data: {
          ...(tableNumber !== undefined && { tableNumber }),
          ...(namesListId !== undefined && { namesListId }),
          ...(locationId !== undefined && { locationId }),
        },
        include: {
          location: { select: { id: true, name: true } },
          namesList: { select: { id: true, name: true } },
        },
      });

      res.json({ data: updated });
    } catch (e) {
      console.error("Error updating scoreboard:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/admin/scoreboards/:deviceId - Remove config
scoreboardsAdminRouter.delete(
  "/:deviceId",
  requireRole("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      await prisma.scoreboardConfig.delete({ where: { deviceId } });
      res.json({ success: true });
    } catch (e) {
      console.error("Error deleting scoreboard:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
