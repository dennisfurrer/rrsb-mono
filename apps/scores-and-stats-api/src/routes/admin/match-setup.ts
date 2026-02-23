import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { requireRole } from "../../middleware/auth.js";

export const matchSetupRouter = Router();

// POST /api/admin/match-setup - Create match assignment
matchSetupRouter.post(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { player1Name, player2Name, bestOf, handicap, deviceId, tableNumber } =
        req.body;

      if (!player1Name || !player2Name || !bestOf) {
        res
          .status(400)
          .json({ error: "player1Name, player2Name, and bestOf are required" });
        return;
      }

      const assignment = await prisma.matchAssignment.create({
        data: {
          player1Name,
          player2Name,
          bestOf,
          handicap: handicap ?? null,
          deviceId: deviceId ?? null,
          tableNumber: tableNumber ?? null,
        },
      });

      res.json({ data: assignment });
    } catch (e) {
      console.error("Error creating match assignment:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/match-setup - List all assignments (admin)
matchSetupRouter.get(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const assignments = await prisma.matchAssignment.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      res.json({ data: assignments });
    } catch (e) {
      console.error("Error listing match assignments:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/admin/match-setup/:id - Delete an assignment
matchSetupRouter.delete(
  "/:id",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      await prisma.matchAssignment.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      console.error("Error deleting match assignment:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Note: GET /pending and PATCH /claim are on the public scoreboards router
// (see ping.ts) since scoreboard-ui has no auth token.
