import { Router } from "express";
import { v3MatchesRouter, v3EventsRouter } from "./matches.js";
import { v3PlayersRouter, v3BreaksRouter } from "./players.js";
import { v3ClubsRouter } from "./clubs.js";
import { v3RemoteRouter } from "./remote.js";

/** All v3 endpoints, mounted under /api/v3. */
export const v3Router = Router();

v3Router.use("/matches", v3MatchesRouter);
v3Router.use("/events", v3EventsRouter);
v3Router.use("/players", v3PlayersRouter);
v3Router.use("/breaks", v3BreaksRouter);
v3Router.use("/clubs", v3ClubsRouter);
v3Router.use("/remote", v3RemoteRouter);
