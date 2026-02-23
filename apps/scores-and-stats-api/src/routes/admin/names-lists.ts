import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { requireRole } from "../../middleware/auth.js";
import multer from "multer";

export const namesListsRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/admin/names-lists
namesListsRouter.get(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const locationId = (req as any).scopedLocationId;
      const lists = await prisma.namesList.findMany({
        where: locationId ? { locationId } : undefined,
        include: { _count: { select: { entries: true } } },
        orderBy: { createdAt: "desc" },
      });
      res.json({ data: lists });
    } catch (e) {
      console.error("Error listing names lists:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/names-lists
namesListsRouter.post(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { name, locationId } = req.body;
      if (!name) {
        res.status(400).json({ error: "Name is required" });
        return;
      }
      const list = await prisma.namesList.create({
        data: { name, locationId: locationId || null },
      });
      res.json({ data: list });
    } catch (e) {
      console.error("Error creating names list:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/names-lists/:id
namesListsRouter.get(
  "/:id",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const list = await prisma.namesList.findUnique({
        where: { id: req.params.id },
        include: {
          entries: { orderBy: { sortOrder: "asc" } },
        },
      });
      if (!list) {
        res.status(404).json({ error: "Names list not found" });
        return;
      }
      res.json({ data: list });
    } catch (e) {
      console.error("Error fetching names list:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/names-lists/:id/entries
namesListsRouter.post(
  "/:id/entries",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { playerName, nationalityIOC, sortOrder } = req.body;
      if (!playerName) {
        res.status(400).json({ error: "playerName is required" });
        return;
      }
      const entry = await prisma.namesListEntry.create({
        data: {
          namesListId: req.params.id,
          playerName,
          nationalityIOC: nationalityIOC || "",
          sortOrder: sortOrder ?? 0,
        },
      });
      res.json({ data: entry });
    } catch (e) {
      console.error("Error adding entry:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/admin/names-lists/:id/entries/:entryId
namesListsRouter.delete(
  "/:id/entries/:entryId",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (req: Request, res: Response) => {
    try {
      await prisma.namesListEntry.delete({
        where: { id: req.params.entryId },
      });
      res.json({ success: true });
    } catch (e) {
      console.error("Error deleting entry:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/names-lists/:id/upload-csv
namesListsRouter.post(
  "/:id/upload-csv",
  requireRole("SUPER_ADMIN", "ADMIN"),
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const text = file.buffer.toString("utf-8");
      const rows = text.split("\n");
      const entries: { playerName: string; nationalityIOC: string; sortOrder: number }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const line = rows[i].trim();
        if (!line) continue;

        // Support both CSV formats:
        // Simple: name,ioc
        // Full (spielerliste format): cols[4]=name, cols[24]=ioc
        const cols = line.includes(";") ? line.split(";") : line.split(",");

        let playerName: string;
        let nationalityIOC: string;

        if (cols.length > 10) {
          // Spielerliste format
          playerName = (cols[4] || "").trim();
          nationalityIOC = (cols[24] || "").replace(/\r|\n/g, "").trim();
        } else {
          // Simple CSV: name,ioc
          playerName = (cols[0] || "").trim();
          nationalityIOC = (cols[1] || "").replace(/\r|\n/g, "").trim();
        }

        if (playerName) {
          entries.push({ playerName, nationalityIOC, sortOrder: entries.length });
        }
      }

      // Replace all entries
      await prisma.$transaction([
        prisma.namesListEntry.deleteMany({
          where: { namesListId: req.params.id },
        }),
        ...entries.map((entry) =>
          prisma.namesListEntry.create({
            data: { namesListId: req.params.id, ...entry },
          })
        ),
      ]);

      res.json({ data: { count: entries.length } });
    } catch (e) {
      console.error("Error uploading CSV:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
