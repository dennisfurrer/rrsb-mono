import "dotenv/config";
import cors from "cors";
import express from "express";
import { matchesRouter } from "./routes/matches.js";
import { frameActionsRouter } from "./routes/frame-actions.js";
import { playersRouter } from "./routes/players.js";
import { matchHistoryRouter } from "./routes/match-history.js";
import {
  breaksRouter,
  breaksMatrixHandler,
  dataYearsHandler,
} from "./routes/breaks.js";
import { highlightsRouter } from "./routes/highlights.js";
import { adminRouter } from "./routes/admin/index.js";
import { scoreboardsPublicRouter } from "./routes/admin/ping.js";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

const port = process.env.PORT || 7200;

app.get("/health", (_req, res) => {
  res.send("RRSB Scoreboard API");
});

// Existing routes
app.use("/api/matches", matchesRouter);
app.use("/api/frame-actions", frameActionsRouter);
app.use("/players", playersRouter);
app.use("/matches/player", matchHistoryRouter);
app.use("/breaks", breaksRouter);
app.get("/breaks-matrix", breaksMatrixHandler);
app.get("/data/years", dataYearsHandler);
app.use("/highlights", highlightsRouter);

// Admin routes (JWT-protected, except auth endpoints)
app.use("/api/admin", adminRouter);

// Public scoreboard routes (ping, names list)
app.use("/api/scoreboards", scoreboardsPublicRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(port, () => {
  console.log(`RRSB API running on port ${port}`);
});
