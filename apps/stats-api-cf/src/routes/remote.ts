import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "../types";

/**
 * Remote relay routes — forward to the per-room RemoteRelay Durable Object
 * (one instance per roomId). SSE responses stream straight back through.
 */
export const remoteRouter = new Hono<AppEnv>();

function forward(c: Context<AppEnv>): Promise<Response> {
  const roomId = c.req.param("roomId");
  const id = c.env.REMOTE.idFromName(roomId);
  const stub = c.env.REMOTE.get(id);
  return stub.fetch(c.req.raw);
}

remoteRouter.post("/:roomId/session", forward);
remoteRouter.get("/:roomId/commands", forward);
remoteRouter.post("/:roomId/state", forward);
remoteRouter.get("/:roomId/stream", forward);
remoteRouter.post("/:roomId/command", forward);
