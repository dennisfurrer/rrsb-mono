import { Router, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { prisma } from "@rrsb/db";

/**
 * v3 remote scorer relay — same SSE transport as the original relay, but every
 * meta action (session minted/rotated, phone connected/disconnected, command
 * received) is also persisted to v3_remote_session / v3_remote_event so the match
 * gets a full play-by-play of remote control activity. DB writes are best-effort
 * and never block the live relay.
 */

export const v3RemoteRouter = Router();

type SSEConn = Response;

interface Room {
  roomId: string;
  displayKey: string;
  displayConns: Set<SSEConn>;
  tokens: Map<string, 0 | 1>;
  tokenByPlayer: Map<0 | 1, string>;
  sessionIdByToken: Map<string, string>;
  phoneConns: Map<string, SSEConn>;
  lastSnapshot: string | null;
  matchId: string | null;
  matchIdResolved: boolean;
  lastSeen: number;
}

const rooms = new Map<string, Room>();
const ROOM_TTL_MS = 30 * 60 * 1000;
const HEARTBEAT_MS = 20_000;

function touch(room: Room) {
  room.lastSeen = Date.now();
}

function getOrCreateRoom(roomId: string, displayKey: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      displayKey,
      displayConns: new Set(),
      tokens: new Map(),
      tokenByPlayer: new Map(),
      sessionIdByToken: new Map(),
      phoneConns: new Map(),
      lastSnapshot: null,
      matchId: null,
      matchIdResolved: false,
      lastSeen: Date.now(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

/** Resolve (and cache) the match this room belongs to via remoteRoomId. */
async function resolveMatchId(room: Room): Promise<string | null> {
  if (room.matchIdResolved) return room.matchId;
  try {
    const match = await prisma.v3Match.findFirst({
      where: { remoteRoomId: room.roomId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    room.matchId = match?.id ?? null;
  } catch {
    room.matchId = null;
  }
  room.matchIdResolved = true;
  return room.matchId;
}

async function logRemote(
  room: Room,
  type: string,
  fields: {
    sessionId?: string | null;
    playerIndex?: number | null;
    commandType?: string | null;
    commandPayload?: unknown;
  } = {}
) {
  try {
    const matchId = await resolveMatchId(room);
    await prisma.v3RemoteEvent.create({
      data: {
        roomId: room.roomId,
        matchId,
        sessionId: fields.sessionId ?? null,
        type: type as never,
        playerIndex: fields.playerIndex ?? null,
        commandType: fields.commandType ?? null,
        commandPayload: (fields.commandPayload ?? undefined) as never,
      },
    });
  } catch (e) {
    console.error("[v3] Failed to log remote event:", e);
  }
}

function sseHeaders(res: Response) {
  // Disable Nagle's algorithm — these are small, latency-sensitive event
  // writes (remote scoring commands), not bulk data, so we want each one on
  // the wire immediately rather than batched.
  res.socket?.setNoDelay(true);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 3000\n");
  res.write(": connected\n\n");
  (res as Response & { flush?: () => void }).flush?.();
}

function sendEvent(res: SSEConn, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  (res as Response & { flush?: () => void }).flush?.();
}

function broadcastToDisplays(room: Room, event: string, data: unknown) {
  for (const conn of room.displayConns) {
    try {
      sendEvent(conn, event, data);
    } catch {
      /* cleaned up on close */
    }
  }
}

function broadcastToPhones(room: Room, event: string, data: unknown) {
  for (const conn of room.phoneConns.values()) {
    try {
      sendEvent(conn, event, data);
    } catch {
      /* ignore */
    }
  }
}

// POST /api/v3/remote/:roomId/session  { displayKey, playerIndex }
v3RemoteRouter.post("/:roomId/session", async (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  const { displayKey, playerIndex } = req.body ?? {};
  if (typeof displayKey !== "string" || (playerIndex !== 0 && playerIndex !== 1)) {
    return res.status(400).json({ error: "displayKey and playerIndex required" });
  }
  const room = getOrCreateRoom(roomId, displayKey);
  if (room.displayKey !== displayKey) {
    return res.status(403).json({ error: "bad displayKey" });
  }
  touch(room);
  const pi = playerIndex as 0 | 1;

  const isRotation = room.tokenByPlayer.has(pi);
  const prevToken = room.tokenByPlayer.get(pi);
  if (prevToken) {
    const prevPhone = room.phoneConns.get(prevToken);
    if (prevPhone) {
      try {
        sendEvent(prevPhone, "kicked", { reason: "rotated" });
        prevPhone.end();
      } catch {
        /* ignore */
      }
      room.phoneConns.delete(prevToken);
    }
    room.tokens.delete(prevToken);
    room.sessionIdByToken.delete(prevToken);
  }

  const token = randomUUID();
  room.tokens.set(token, pi);
  room.tokenByPlayer.set(pi, token);

  // Persist the session and the create/rotate meta event.
  try {
    const matchId = await resolveMatchId(room);
    const session = await prisma.v3RemoteSession.create({
      data: { roomId, matchId, playerIndex: pi, token, rotatedAt: isRotation ? new Date() : null },
    });
    room.sessionIdByToken.set(token, session.id);
    await logRemote(room, isRotation ? "SESSION_ROTATED" : "SESSION_CREATED", {
      sessionId: session.id,
      playerIndex: pi,
    });
  } catch (e) {
    console.error("[v3] Failed to persist remote session:", e);
  }

  return res.json({ token });
});

// GET /api/v3/remote/:roomId/commands?key=<displayKey>
v3RemoteRouter.get("/:roomId/commands", (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  const key = String(req.query.key ?? "");
  const room = getOrCreateRoom(roomId, key);
  if (room.displayKey !== key) {
    return res.status(403).end();
  }
  touch(room);
  sseHeaders(res);
  room.displayConns.add(res);

  for (const [token, conn] of room.phoneConns) {
    if (conn) {
      const pi = room.tokens.get(token);
      if (pi !== undefined) sendEvent(res, "presence", { playerIndex: pi, connected: true });
    }
  }

  const hb = setInterval(() => {
    try {
      res.write(": ping\n\n");
      (res as Response & { flush?: () => void }).flush?.();
    } catch {
      /* ignore */
    }
  }, HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(hb);
    room.displayConns.delete(res);
  });
});

// POST /api/v3/remote/:roomId/state  { displayKey, snapshot }
v3RemoteRouter.post("/:roomId/state", (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  const { displayKey, snapshot } = req.body ?? {};
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: "no room" });
  if (room.displayKey !== displayKey) return res.status(403).json({ error: "bad displayKey" });
  touch(room);
  room.lastSnapshot = JSON.stringify(snapshot ?? null);
  broadcastToPhones(room, "state", snapshot ?? null);
  return res.json({ ok: true });
});

// GET /api/v3/remote/:roomId/stream?token=<token>
v3RemoteRouter.get("/:roomId/stream", (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  const token = String(req.query.token ?? "");
  const room = rooms.get(roomId);
  if (!room || !room.tokens.has(token)) {
    sseHeaders(res);
    sendEvent(res, "invalid", { reason: "unknown session" });
    return res.end();
  }
  touch(room);
  const playerIndex = room.tokens.get(token)!;
  const sessionId = room.sessionIdByToken.get(token) ?? null;

  const existing = room.phoneConns.get(token);
  if (existing && existing !== res) {
    try {
      sendEvent(existing, "kicked", { reason: "replaced" });
      existing.end();
    } catch {
      /* ignore */
    }
  }

  sseHeaders(res);
  room.phoneConns.set(token, res);
  sendEvent(res, "hello", { playerIndex });
  if (room.lastSnapshot) {
    res.write(`event: state\n`);
    res.write(`data: ${room.lastSnapshot}\n\n`);
    (res as Response & { flush?: () => void }).flush?.();
  }
  broadcastToDisplays(room, "presence", { playerIndex, connected: true });

  // Log connect + bump session counters.
  void logRemote(room, "PHONE_CONNECTED", { sessionId, playerIndex });
  if (sessionId) {
    prisma.v3RemoteSession
      .update({
        where: { id: sessionId },
        data: { lastConnectedAt: new Date(), connectCount: { increment: 1 } },
      })
      .catch(() => {});
  }

  const hb = setInterval(() => {
    try {
      res.write(": ping\n\n");
      (res as Response & { flush?: () => void }).flush?.();
    } catch {
      /* ignore */
    }
  }, HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(hb);
    if (room.phoneConns.get(token) === res) {
      room.phoneConns.delete(token);
      broadcastToDisplays(room, "presence", { playerIndex, connected: false });
      void logRemote(room, "PHONE_DISCONNECTED", { sessionId, playerIndex });
      if (sessionId) {
        prisma.v3RemoteSession
          .update({ where: { id: sessionId }, data: { lastDisconnectedAt: new Date() } })
          .catch(() => {});
      }
    }
  });
});

// POST /api/v3/remote/:roomId/command  { token, command }
v3RemoteRouter.post("/:roomId/command", (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  const { token, command } = req.body ?? {};
  const room = rooms.get(roomId);
  if (!room || typeof token !== "string" || !room.tokens.has(token)) {
    return res.status(401).json({ error: "invalid session" });
  }
  touch(room);
  const fromPlayerIndex = room.tokens.get(token)!;
  broadcastToDisplays(room, "command", { ...command, fromPlayerIndex });
  void logRemote(room, "COMMAND_RECEIVED", {
    sessionId: room.sessionIdByToken.get(token) ?? null,
    playerIndex: fromPlayerIndex,
    commandType: command?.t ?? null,
    commandPayload: command ?? null,
  });
  return res.json({ ok: true });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    const idle = now - room.lastSeen > ROOM_TTL_MS;
    const empty = room.displayConns.size === 0 && room.phoneConns.size === 0;
    if (idle && empty) rooms.delete(id);
  }
}, 5 * 60 * 1000).unref?.();
