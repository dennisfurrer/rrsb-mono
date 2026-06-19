import { Router, Request, Response } from "express";
import { randomUUID } from "node:crypto";

/**
 * Remote scorer relay.
 *
 * A "room" represents one running scoreboard display. The display owns the
 * authoritative match state; phones connect as remote controls. Transport is
 * Server-Sent Events (SSE), kept entirely in memory (no DB) — sessions are
 * ephemeral and reset if the API restarts, which the clients recover from by
 * reconnecting.
 *
 * Channels per room:
 *   - display command stream  (GET  /:roomId/commands?key=)  display  <- phones
 *   - phone state stream       (GET  /:roomId/stream?token=)   phones   <- display
 *   - phone -> display command (POST /:roomId/command)
 *   - display -> phone state    (POST /:roomId/state)
 *
 * Auth:
 *   - displayKey: private to the display, never shared in a QR code. Guards the
 *     command stream and state push so phones can't snoop commands or spoof state.
 *   - token: one per player, embedded in that player's QR code. Guards sending
 *     commands and subscribing to state. One live phone per token — a new
 *     connection kicks the previous one.
 */

export const remoteRouter = Router();

type SSEConn = Response;

interface Room {
  roomId: string;
  displayKey: string;
  displayConns: Set<SSEConn>;
  /** token -> playerIndex */
  tokens: Map<string, 0 | 1>;
  /** playerIndex -> current token (for rotation) */
  tokenByPlayer: Map<0 | 1, string>;
  /** token -> the single live phone connection */
  phoneConns: Map<string, SSEConn>;
  lastSnapshot: string | null;
  lastSeen: number;
}

const rooms = new Map<string, Room>();

const ROOM_TTL_MS = 30 * 60 * 1000; // 30 min idle
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
      phoneConns: new Map(),
      lastSnapshot: null,
      lastSeen: Date.now(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

function sseHeaders(res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Disable proxy buffering (e.g. nginx on Render) so events flush instantly.
    "X-Accel-Buffering": "no",
  });
  // Initial comment + retry hint so EventSource reconnects quickly.
  res.write("retry: 3000\n");
  res.write(": connected\n\n");
  // Flush headers immediately if supported.
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
      /* connection will be cleaned up on close */
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

// ===== Display: mint / rotate a player session token =====
// POST /api/remote/:roomId/session  { displayKey, playerIndex }
remoteRouter.post("/:roomId/session", (req: Request, res: Response) => {
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

  // Rotate: invalidate the player's previous token and boot its phone.
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
  }

  const token = randomUUID();
  room.tokens.set(token, pi);
  room.tokenByPlayer.set(pi, token);

  return res.json({ token });
});

// ===== Display: subscribe to commands from phones =====
// GET /api/remote/:roomId/commands?key=<displayKey>
remoteRouter.get("/:roomId/commands", (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  const key = String(req.query.key ?? "");
  const room = getOrCreateRoom(roomId, key);
  if (room.displayKey !== key) {
    return res.status(403).end();
  }
  touch(room);

  sseHeaders(res);
  room.displayConns.add(res);

  // Tell the display who is currently connected so it can show presence.
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

// ===== Display: push a state snapshot to phones =====
// POST /api/remote/:roomId/state  { displayKey, snapshot }
remoteRouter.post("/:roomId/state", (req: Request, res: Response) => {
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

// ===== Phone: subscribe to state snapshots =====
// GET /api/remote/:roomId/stream?token=<token>
remoteRouter.get("/:roomId/stream", (req: Request, res: Response) => {
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

  // One live phone per token: kick the previous connection.
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
    // Only clear if this exact connection is still the registered one.
    if (room.phoneConns.get(token) === res) {
      room.phoneConns.delete(token);
      broadcastToDisplays(room, "presence", { playerIndex, connected: false });
    }
  });
});

// ===== Phone: send a scoring command to the display =====
// POST /api/remote/:roomId/command  { token, command }
remoteRouter.post("/:roomId/command", (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  const { token, command } = req.body ?? {};
  const room = rooms.get(roomId);
  if (!room || typeof token !== "string" || !room.tokens.has(token)) {
    return res.status(401).json({ error: "invalid session" });
  }
  touch(room);

  const fromPlayerIndex = room.tokens.get(token)!;
  broadcastToDisplays(room, "command", { ...command, fromPlayerIndex });
  return res.json({ ok: true });
});

// ===== Idle room sweep =====
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    const idle = now - room.lastSeen > ROOM_TTL_MS;
    const empty = room.displayConns.size === 0 && room.phoneConns.size === 0;
    if (idle && empty) {
      rooms.delete(id);
    }
  }
}, 5 * 60 * 1000).unref?.();
