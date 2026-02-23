import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import { requireRole } from "../../middleware/auth.js";

export const locationsRouter = Router();

// GET /api/admin/locations
locationsRouter.get(
  "/",
  requireRole("SUPER_ADMIN", "ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const locations = await prisma.location.findMany({
        include: {
          _count: {
            select: { scoreboardConfigs: true, matches: true, users: true },
          },
        },
        orderBy: { name: "asc" },
      });
      res.json({ data: locations });
    } catch (e) {
      console.error("Error listing locations:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/locations
locationsRouter.post(
  "/",
  requireRole("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { name, address } = req.body;
      if (!name) {
        res.status(400).json({ error: "Name is required" });
        return;
      }
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const location = await prisma.location.create({
        data: { name, slug, address: address || null },
      });
      res.json({ data: location });
    } catch (e) {
      console.error("Error creating location:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/locations/:id
locationsRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { name, address } = req.body;
      const data: Record<string, any> = {};
      if (name !== undefined) {
        data.name = name;
        data.slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      if (address !== undefined) data.address = address;

      const location = await prisma.location.update({
        where: { id: req.params.id },
        data,
      });
      res.json({ data: location });
    } catch (e) {
      console.error("Error updating location:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
