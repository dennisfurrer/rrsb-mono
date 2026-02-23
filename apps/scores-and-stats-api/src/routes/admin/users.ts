import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import bcrypt from "bcryptjs";
const { hash } = bcrypt;
import { requireRole } from "../../middleware/auth.js";

export const usersRouter = Router();

// GET /api/admin/users
usersRouter.get(
  "/",
  requireRole("SUPER_ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          locationId: true,
          location: { select: { id: true, name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({ data: users });
    } catch (e) {
      console.error("Error listing users:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/users
usersRouter.post(
  "/",
  requireRole("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { email, password, displayName, role, locationId } = req.body;
      if (!email || !password || !displayName) {
        res
          .status(400)
          .json({ error: "email, password, and displayName are required" });
        return;
      }

      const passwordHash = await hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName,
          role: role || "PARTNER_ADMIN",
          locationId: locationId || null,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          locationId: true,
        },
      });
      res.json({ data: user });
    } catch (e) {
      console.error("Error creating user:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/users/:id
usersRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { displayName, role, locationId, password } = req.body;
      const data: Record<string, any> = {};
      if (displayName !== undefined) data.displayName = displayName;
      if (role !== undefined) data.role = role;
      if (locationId !== undefined) data.locationId = locationId;
      if (password) data.passwordHash = await hash(password, 12);

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          locationId: true,
        },
      });
      res.json({ data: user });
    } catch (e) {
      console.error("Error updating user:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/admin/users/:id
usersRouter.delete(
  "/:id",
  requireRole("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e) {
      console.error("Error deleting user:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
