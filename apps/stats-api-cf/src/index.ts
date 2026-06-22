import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "./generated/prisma/client";
import type { AppEnv } from "./types";
import { matchesRouter, eventsRouter } from "./routes/matches";
import { playersRouter, breaksRouter } from "./routes/players";
import { clubsRouter } from "./routes/clubs";
import { remoteRouter } from "./routes/remote";

const app = new Hono<AppEnv>();

// maxAge lets the browser cache the CORS preflight (OPTIONS) instead of
// re-sending it before every POST — the phone remote fires one POST per tap,
// so an uncached preflight doubles the round-trip latency on every action.
app.use("*", cors({ origin: "*", maxAge: 86400 }));

// Per-request Prisma client bound to this Worker's D1 database.
app.use("*", async (c, next) => {
  const adapter = new PrismaD1(c.env.DB);
  c.set("prisma", new PrismaClient({ adapter }));
  await next();
});

app.get("/health", (c) => c.text("RRSB stats API (Cloudflare / D1)"));

// v3 API — same paths as the legacy Express API, under /api/v3.
app.route("/api/v3/matches", matchesRouter);
app.route("/api/v3/events", eventsRouter);
app.route("/api/v3/players", playersRouter);
app.route("/api/v3/breaks", breaksRouter);
app.route("/api/v3/clubs", clubsRouter);
app.route("/api/v3/remote", remoteRouter);

export default app;

// Durable Object: SSE remote-control relay (one instance per room).
export { RemoteRelay } from "./remote-relay";
