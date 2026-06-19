import { useCallback, useEffect, useRef, useState } from "react";
import {
  sendRemoteCommand,
  stateStreamUrl,
  type RemoteCommand,
  type RemoteSnapshot,
} from "../lib/remote";
import { RemoteScorer } from "./RemoteScorer";
import "./remote.css";

export type ConnStatus = "connecting" | "live" | "reconnecting" | "kicked" | "invalid";

export function RemoteApp({ roomId, token }: { roomId: string; token: string }) {
  const [snapshot, setSnapshot] = useState<RemoteSnapshot | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<0 | 1 | null>(null);
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const queue = useRef<RemoteCommand[]>([]);
  const flushing = useRef(false);

  useEffect(() => {
    const es = new EventSource(stateStreamUrl(roomId, token));

    es.addEventListener("hello", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        setMyPlayerIndex(data.playerIndex);
        setStatus("live");
      } catch {
        /* ignore */
      }
    });
    es.addEventListener("state", (e) => {
      try {
        setSnapshot(JSON.parse((e as MessageEvent).data));
        setStatus("live");
      } catch {
        /* ignore */
      }
    });
    es.addEventListener("kicked", () => {
      setStatus("kicked");
      es.close();
    });
    es.addEventListener("invalid", () => {
      setStatus("invalid");
      es.close();
    });
    es.onerror = () => {
      // EventSource auto-reconnects; reflect the transient state unless terminal.
      setStatus((s) => (s === "kicked" || s === "invalid" ? s : "reconnecting"));
    };

    return () => es.close();
  }, [roomId, token]);

  // Serialize sends so scoring commands arrive at the display in tap order.
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    while (queue.current.length > 0) {
      const cmd = queue.current.shift()!;
      await sendRemoteCommand(roomId, token, cmd);
    }
    flushing.current = false;
  }, [roomId, token]);

  const onCommand = useCallback(
    (cmd: RemoteCommand) => {
      if (status === "kicked" || status === "invalid") return;
      queue.current.push(cmd);
      void flush();
    },
    [status, flush]
  );

  return (
    <RemoteScorer
      snapshot={snapshot}
      myPlayerIndex={myPlayerIndex}
      status={status}
      onCommand={onCommand}
    />
  );
}
