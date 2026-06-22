import { useCallback, useEffect, useRef, useState } from "react";
import {
  decodeRemoteParam,
  sendRemoteCommand,
  stateStreamUrl,
  type RemoteCommand,
  type RemoteSnapshot,
} from "../lib/remote";
import { RemoteScorer } from "./RemoteScorer";
import { QrScanner } from "./QrScanner";
import "./remote.css";

export type ConnStatus = "connecting" | "live" | "reconnecting" | "kicked" | "invalid";

export function RemoteApp({ roomId, token }: { roomId: string; token: string }) {
  const [snapshot, setSnapshot] = useState<RemoteSnapshot | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<0 | 1 | null>(null);
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [disconnected, setDisconnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const queue = useRef<RemoteCommand[]>([]);
  const flushing = useRef(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(stateStreamUrl(roomId, token));
    esRef.current = es;

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

  const handleDisconnect = useCallback(() => {
    esRef.current?.close();
    setDisconnected(true);
  }, []);

  const handleScanResult = useCallback((text: string) => {
    try {
      const url = new URL(text, window.location.origin);
      const param = url.searchParams.get("r");
      const decoded = param ? decodeRemoteParam(param) : null;
      if (!decoded || url.origin !== window.location.origin) {
        throw new Error("invalid");
      }
      window.location.href = url.toString();
    } catch {
      setScanning(false);
      setScanError("Das war kein gültiger Scoreboard-QR-Code. Bitte erneut versuchen.");
    }
  }, []);

  if (scanning) {
    return <QrScanner onResult={handleScanResult} onCancel={() => setScanning(false)} />;
  }

  if (disconnected || status === "kicked" || status === "invalid") {
    const msg = status === "kicked"
      ? "Diese Verbindung wurde auf einem anderen Gerät geöffnet."
      : "Verbindung unterbrochen oder Session abgelaufen.";
    return (
      <div className="rmt-root" style={{ alignItems: "center", justifyContent: "center", gap: 20, textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 40 }}>📡</div>
        <div style={{ color: "#fff", fontSize: 17, fontWeight: "bold" }}>{msg}</div>
        <div style={{ color: "#aaa", fontSize: 14, lineHeight: 1.6 }}>
          Falls der PC neu gestartet wurde:<br />
          Bitte den <strong style={{ color: "#fff" }}>neuen QR-Code</strong> auf dem Scoreboard-Bildschirm scannen.
        </div>
        {scanError && (
          <div style={{ color: "#ff8080", fontSize: 13 }}>{scanError}</div>
        )}
        <button
          className="rmt-btn rmt-btn--primary"
          style={{ width: "100%", maxWidth: 280 }}
          onClick={() => {
            setScanError(null);
            setScanning(true);
          }}
        >
          📷 QR-Code scannen
        </button>
        <button
          className="rmt-btn rmt-btn--ghost"
          style={{ width: "100%", maxWidth: 280 }}
          onClick={() => window.location.reload()}
        >
          Nochmals versuchen
        </button>
      </div>
    );
  }

  return (
    <RemoteScorer
      snapshot={snapshot}
      myPlayerIndex={myPlayerIndex}
      status={status}
      onCommand={onCommand}
      onDisconnect={handleDisconnect}
    />
  );
}
