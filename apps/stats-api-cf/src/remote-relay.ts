import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "./generated/prisma/client";
import type { Env } from "./types";

/**
 * RemoteRelay — one Durable Object instance PER room (idFromName(roomId)). It
 * replaces the in-memory Map/Set SSE relay from the Express API: room state lives
 * on the DO instance (kept alive while connections are open), SSE streams are
 * ReadableStreams, and every meta action (session minted/rotated, phone
 * connected/disconnected, command received) is best-effort persisted to
 * v3_remote_session / v3_remote_event via the D1-bound Prisma client.
 */

const HEARTBEAT_MS = 20_000;

interface Conn {
  send: (event: string, data: unknown) => void;
  raw: (chunk: string) => void;
  close: () => void;
}

export class RemoteRelay {
  private env: Env;

  private displayKey: string | null = null;
  private displayConns = new Set<Conn>();
  private phoneConns = new Map<string, Conn>();
  private tokens = new Map<string, 0 | 1>();
  private tokenByPlayer = new Map<0 | 1, string>();
  private sessionIdByToken = new Map<string, string>();
  private lastSnapshot: string | null = null;

  private roomId = "";
  private matchId: string | null = null;
  private matchIdResolved = false;
  private _prisma: PrismaClient | null = null;

  constructor(_state: DurableObjectState, env: Env) {
    this.env = env;
  }

  private prisma(): PrismaClient {
    if (!this._prisma) this._prisma = new PrismaClient({ adapter: new PrismaD1(this.env.DB) });
    return this._prisma;
  }

  // ===== SSE helper =====

  private makeSSE(): { response: Response; conn: Conn; onClose: (cb: () => void) => void } {
    let ctrl: ReadableStreamDefaultController<Uint8Array>;
    let closed = false;
    let closeCb: (() => void) | null = null;
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        ctrl = c;
        c.enqueue(enc.encode("retry: 3000\n: connected\n\n"));
      },
      cancel() {
        closed = true;
        if (closeCb) closeCb();
      },
    });
    const conn: Conn = {
      send: (event, data) => {
        if (closed) return;
        try {
          ctrl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* cleaned up on cancel */
        }
      },
      raw: (chunk) => {
        if (closed) return;
        try {
          ctrl.enqueue(enc.encode(chunk));
        } catch {
          /* ignore */
        }
      },
      close: () => {
        if (closed) return;
        closed = true;
        try {
          ctrl.close();
        } catch {
          /* ignore */
        }
      },
    };
    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*",
      },
    });
    return { response, conn, onClose: (cb) => (closeCb = cb) };
  }

  // ===== DB persistence (best-effort) =====

  private async resolveMatchId(): Promise<string | null> {
    if (this.matchIdResolved) return this.matchId;
    try {
      const match = await this.prisma().v3Match.findFirst({
        where: { remoteRoomId: this.roomId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      this.matchId = match?.id ?? null;
    } catch {
      this.matchId = null;
    }
    this.matchIdResolved = true;
    return this.matchId;
  }

  private async logRemote(
    type: string,
    fields: {
      sessionId?: string | null;
      playerIndex?: number | null;
      commandType?: string | null;
      commandPayload?: unknown;
    } = {},
  ): Promise<void> {
    try {
      const matchId = await this.resolveMatchId();
      await this.prisma().v3RemoteEvent.create({
        data: {
          roomId: this.roomId,
          matchId,
          sessionId: fields.sessionId ?? null,
          type,
          playerIndex: fields.playerIndex ?? null,
          commandType: fields.commandType ?? null,
          commandPayload: (fields.commandPayload ?? undefined) as never,
        },
      });
    } catch (e) {
      console.error("[v3] Failed to log remote event:", e);
    }
  }

  private broadcastToDisplays(event: string, data: unknown): void {
    for (const conn of this.displayConns) {
      try {
        conn.send(event, data);
      } catch {
        /* cleaned up on close */
      }
    }
  }

  private broadcastToPhones(event: string, data: unknown): void {
    for (const conn of this.phoneConns.values()) {
      try {
        conn.send(event, data);
      } catch {
        /* ignore */
      }
    }
  }

  // ===== Entry point =====

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const action = parts[parts.length - 1];
    this.roomId = parts[parts.length - 2] ?? this.roomId;

    switch (action) {
      case "session":
        return this.handleSession(request);
      case "commands":
        return this.handleCommands(url);
      case "state":
        return this.handleState(request);
      case "stream":
        return this.handleStream(url);
      case "command":
        return this.handleCommand(request);
      default:
        return new Response("not found", { status: 404 });
    }
  }

  // POST /:roomId/session  { displayKey, playerIndex }
  private async handleSession(request: Request): Promise<Response> {
    const body = (await request.json().catch(() => ({}))) as {
      displayKey?: unknown;
      playerIndex?: unknown;
    };
    const { displayKey, playerIndex } = body;
    if (typeof displayKey !== "string" || (playerIndex !== 0 && playerIndex !== 1)) {
      return Response.json({ error: "displayKey and playerIndex required" }, { status: 400 });
    }
    if (this.displayKey === null) this.displayKey = displayKey;
    if (this.displayKey !== displayKey) {
      return Response.json({ error: "bad displayKey" }, { status: 403 });
    }
    const pi = playerIndex as 0 | 1;

    const isRotation = this.tokenByPlayer.has(pi);
    const prevToken = this.tokenByPlayer.get(pi);
    if (prevToken) {
      const prevPhone = this.phoneConns.get(prevToken);
      if (prevPhone) {
        try {
          prevPhone.send("kicked", { reason: "rotated" });
          prevPhone.close();
        } catch {
          /* ignore */
        }
        this.phoneConns.delete(prevToken);
      }
      this.tokens.delete(prevToken);
      this.sessionIdByToken.delete(prevToken);
    }

    const token = crypto.randomUUID();
    this.tokens.set(token, pi);
    this.tokenByPlayer.set(pi, token);

    try {
      const matchId = await this.resolveMatchId();
      const session = await this.prisma().v3RemoteSession.create({
        data: { roomId: this.roomId, matchId, playerIndex: pi, token, rotatedAt: isRotation ? new Date() : null },
      });
      this.sessionIdByToken.set(token, session.id);
      await this.logRemote(isRotation ? "SESSION_ROTATED" : "SESSION_CREATED", {
        sessionId: session.id,
        playerIndex: pi,
      });
    } catch (e) {
      console.error("[v3] Failed to persist remote session:", e);
    }

    return Response.json({ token });
  }

  // GET /:roomId/commands?key=<displayKey>  (display SSE)
  private handleCommands(url: URL): Response {
    const key = url.searchParams.get("key") ?? "";
    if (this.displayKey === null) this.displayKey = key;
    if (this.displayKey !== key) return new Response("forbidden", { status: 403 });

    const { response, conn, onClose } = this.makeSSE();
    this.displayConns.add(conn);

    for (const [token] of this.phoneConns) {
      const pi = this.tokens.get(token);
      if (pi !== undefined) conn.send("presence", { playerIndex: pi, connected: true });
    }

    const hb = setInterval(() => conn.raw(": ping\n\n"), HEARTBEAT_MS);
    onClose(() => {
      clearInterval(hb);
      this.displayConns.delete(conn);
    });
    return response;
  }

  // POST /:roomId/state  { displayKey, snapshot }
  private async handleState(request: Request): Promise<Response> {
    const body = (await request.json().catch(() => ({}))) as { displayKey?: unknown; snapshot?: unknown };
    const { displayKey, snapshot } = body;
    if (this.displayKey === null) return Response.json({ error: "no room" }, { status: 404 });
    if (this.displayKey !== displayKey) return Response.json({ error: "bad displayKey" }, { status: 403 });
    this.lastSnapshot = JSON.stringify(snapshot ?? null);
    this.broadcastToPhones("state", snapshot ?? null);
    return Response.json({ ok: true });
  }

  // GET /:roomId/stream?token=<token>  (phone SSE)
  private handleStream(url: URL): Response {
    const token = url.searchParams.get("token") ?? "";
    if (!this.tokens.has(token)) {
      const { response, conn } = this.makeSSE();
      conn.send("invalid", { reason: "unknown session" });
      conn.close();
      return response;
    }
    const playerIndex = this.tokens.get(token)!;
    const sessionId = this.sessionIdByToken.get(token) ?? null;

    const existing = this.phoneConns.get(token);
    if (existing) {
      try {
        existing.send("kicked", { reason: "replaced" });
        existing.close();
      } catch {
        /* ignore */
      }
    }

    const { response, conn, onClose } = this.makeSSE();
    this.phoneConns.set(token, conn);
    conn.send("hello", { playerIndex });
    if (this.lastSnapshot) conn.raw(`event: state\ndata: ${this.lastSnapshot}\n\n`);
    this.broadcastToDisplays("presence", { playerIndex, connected: true });

    void this.logRemote("PHONE_CONNECTED", { sessionId, playerIndex });
    if (sessionId) {
      this.prisma()
        .v3RemoteSession.update({
          where: { id: sessionId },
          data: { lastConnectedAt: new Date(), connectCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    const hb = setInterval(() => conn.raw(": ping\n\n"), HEARTBEAT_MS);
    onClose(() => {
      clearInterval(hb);
      if (this.phoneConns.get(token) === conn) {
        this.phoneConns.delete(token);
        this.broadcastToDisplays("presence", { playerIndex, connected: false });
        void this.logRemote("PHONE_DISCONNECTED", { sessionId, playerIndex });
        if (sessionId) {
          this.prisma()
            .v3RemoteSession.update({ where: { id: sessionId }, data: { lastDisconnectedAt: new Date() } })
            .catch(() => {});
        }
      }
    });
    return response;
  }

  // POST /:roomId/command  { token, command }
  private async handleCommand(request: Request): Promise<Response> {
    const body = (await request.json().catch(() => ({}))) as { token?: unknown; command?: { t?: string } };
    const { token, command } = body;
    if (typeof token !== "string" || !this.tokens.has(token)) {
      return Response.json({ error: "invalid session" }, { status: 401 });
    }
    const fromPlayerIndex = this.tokens.get(token)!;
    this.broadcastToDisplays("command", { ...command, fromPlayerIndex });
    void this.logRemote("COMMAND_RECEIVED", {
      sessionId: this.sessionIdByToken.get(token) ?? null,
      playerIndex: fromPlayerIndex,
      commandType: command?.t ?? null,
      commandPayload: command ?? null,
    });
    return Response.json({ ok: true });
  }
}
