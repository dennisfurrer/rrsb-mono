import { useState } from "react";
import { QrScanner } from "./QrScanner";
import { decodeRemoteParam } from "../lib/remote";
import "./remote.css";

/**
 * Entry screen for the installed phone PWA (manifest start_url=/?scan). Lets
 * the player scan the scoreboard's QR code without leaving the standalone app.
 */
export function RemoteScanEntry() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResult = (text: string) => {
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
      setError("Das war kein gültiger Scoreboard-QR-Code. Bitte erneut versuchen.");
    }
  };

  if (scanning) {
    return <QrScanner onResult={handleResult} onCancel={() => setScanning(false)} />;
  }

  return (
    <div
      style={{
        height: "100%",
        background: "#0d0d0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        textAlign: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 48 }}>📷</div>
      <div style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Mit dem Scoreboard verbinden</div>
      <div style={{ color: "#aaa", fontSize: 15, maxWidth: 280 }}>
        Bitte den QR-Code auf dem Scoreboard-Bildschirm scannen.
      </div>
      {error && <div style={{ color: "#ff8080", fontSize: 14 }}>{error}</div>}
      <button
        className="rmt-btn rmt-btn--primary"
        style={{ minWidth: 220, minHeight: 50, borderRadius: 12, fontSize: 16 }}
        onClick={() => {
          setError(null);
          setScanning(true);
        }}
      >
        QR-Code scannen
      </button>
    </div>
  );
}
