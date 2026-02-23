import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@rrsb/db";

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  locationId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "rrsb-dev-secret";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export function scopeToLocation(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Partner admins can only see their own location's data
  // Admins and Super Admins see everything
  if (req.user?.role === "PARTNER_ADMIN" && req.user.locationId) {
    (req as any).scopedLocationId = req.user.locationId;
  }
  next();
}
