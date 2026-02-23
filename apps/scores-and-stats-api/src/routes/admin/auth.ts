import { Router, Request, Response } from "express";
import { prisma } from "@rrsb/db";
import bcrypt from "bcryptjs";
const { compare } = bcrypt;
import { z } from "zod";
import { authMiddleware, signToken } from "../../middleware/auth.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/admin/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await compare(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      locationId: user.locationId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        locationId: user.locationId,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: e.errors });
      return;
    }
    console.error("Login error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/auth/me
authRouter.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { location: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        locationId: user.locationId,
        location: user.location
          ? { id: user.location.id, name: user.location.name }
          : null,
      },
    });
  } catch (e) {
    console.error("Auth me error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});
