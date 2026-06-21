import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { MatchState } from "../lib/model";
import { API_CONFIGURED } from "../lib/connection";
import {
  buildSnapshot,
  commandStreamUrl,
  createRemoteSession,
  pushRemoteState,
  remoteUrl,
  type RemoteCommand,
} from "../lib/remote";

type IncomingCommand = RemoteCommand & { fromPlayerIndex?: 0 | 1 };

interface RoomIdentity {
  roomId: string;
  displayKey: string;
}

/**
 * Display-side host for the phone remote scorer.
 *
 * The display owns the authoritative match state. This hook:
 *  - holds a stable room identity (persisted so a display refresh keeps the room),
 *  - mints/rotates per-player session tokens for QR codes,
 *  - opens an SSE stream to receive commands from phones (dispatched via
 *    `dispatchRef` so the latest scoring handlers are always used),
 *  - pushes a state snapshot to phones whenever the match changes.
 */
export function useRemoteHost(opts: {
  match: MatchState;
  colors: [string, string];
  redoAvailable: boolean;
  dispatchRef: MutableRefObject<(cmd: IncomingCommand) => void>;
}) {
  const { match, colors, redoAvailable, dispatchRef } = opts;

  const [room] = useState<RoomIdentity>(() => {
    const saved = sessionStorage.getItem("remoteRoom");
    if (saved) {
      try {
        return JSON.parse(saved) as RoomIdentity;
      } catch {
        /* fall through */
      }
    }
    const fresh: RoomIdentity = {
      roomId: crypto.randomUUID(),
      displayKey: crypto.randomUUID(),
    };
    sessionStorage.setItem("remoteRoom", JSON.stringify(fresh));
    return fresh;
  });

  const [tokens, setTokens] = useState<[string | null, string | null]>([null, null]);
  const [connected, setConnected] = useState<[boolean, boolean]>([false, false]);
  // `active` flips true once any session exists — it gates the SSE + state push.
  const [active, setActive] = useState(false);

  const setTokenAt = useCallback((pi: 0 | 1, token: string | null) => {
    setTokens((prev) => (pi === 0 ? [token, prev[1]] : [prev[0], token]));
  }, []);

  /** Ensure a session token exists for a player (used when opening the QR modal). */
  const ensureSession = useCallback(
    async (pi: 0 | 1): Promise<string | null> => {
      if (!API_CONFIGURED) return null; // remote control needs the API
      setActive(true);
      if (tokens[pi]) return tokens[pi];
      const token = await createRemoteSession(room.roomId, room.displayKey, pi);
      if (token) setTokenAt(pi, token);
      return token;
    },
    [tokens, room, setTokenAt]
  );

  /** Rotate a player's token — invalidates the old QR and boots its phone. */
  const rotateSession = useCallback(
    async (pi: 0 | 1): Promise<string | null> => {
      if (!API_CONFIGURED) return null;
      setActive(true);
      const token = await createRemoteSession(room.roomId, room.displayKey, pi);
      if (token) {
        setTokenAt(pi, token);
        setConnected((prev) => (pi === 0 ? [false, prev[1]] : [prev[0], false]));
      }
      return token;
    },
    [room, setTokenAt]
  );

  const urlFor = useCallback(
    (pi: 0 | 1): string | null => {
      const token = tokens[pi];
      return token ? remoteUrl(room.roomId, token) : null;
    },
    [tokens, room]
  );

  // Command stream: display receives phone commands + presence updates.
  useEffect(() => {
    if (!active) return;
    const es = new EventSource(commandStreamUrl(room.roomId, room.displayKey));

    es.addEventListener("command", (e) => {
      try {
        dispatchRef.current(JSON.parse((e as MessageEvent).data));
      } catch {
        /* ignore malformed */
      }
    });
    es.addEventListener("presence", (e) => {
      try {
        const { playerIndex, connected: c } = JSON.parse((e as MessageEvent).data);
        setConnected((prev) =>
          playerIndex === 0 ? [Boolean(c), prev[1]] : [prev[0], Boolean(c)]
        );
      } catch {
        /* ignore */
      }
    });
    // EventSource auto-reconnects on error; nothing to do here.

    return () => es.close();
  }, [active, room, dispatchRef]);

  // Push a fresh snapshot to phones shortly after each match/colour change.
  const lastPush = useRef<string>("");
  useEffect(() => {
    if (!active) return;
    const snap = buildSnapshot(match, colors, redoAvailable);
    const json = JSON.stringify(snap);
    if (json === lastPush.current) return;
    const id = setTimeout(() => {
      lastPush.current = json;
      pushRemoteState(room.roomId, room.displayKey, snap);
    }, 120);
    return () => clearTimeout(id);
  }, [active, match, colors, redoAvailable, room]);

  return {
    roomId: room.roomId,
    tokens,
    connected,
    ensureSession,
    rotateSession,
    urlFor,
  };
}
