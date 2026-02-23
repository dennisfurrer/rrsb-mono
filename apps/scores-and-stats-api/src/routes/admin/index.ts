import { Router } from "express";
import { authMiddleware, scopeToLocation } from "../../middleware/auth.js";
import { authRouter } from "./auth.js";
import { scoreboardsAdminRouter } from "./scoreboards.js";
import { namesListsRouter } from "./names-lists.js";
import { locationsRouter } from "./locations.js";
import { usersRouter } from "./users.js";
import { matchSetupRouter } from "./match-setup.js";

export const adminRouter = Router();

// Auth routes are public (login doesn't require JWT)
adminRouter.use("/auth", authRouter);

// All other admin routes require authentication
adminRouter.use(authMiddleware);
adminRouter.use(scopeToLocation);

adminRouter.use("/scoreboards", scoreboardsAdminRouter);
adminRouter.use("/names-lists", namesListsRouter);
adminRouter.use("/locations", locationsRouter);
adminRouter.use("/users", usersRouter);
adminRouter.use("/match-setup", matchSetupRouter);
