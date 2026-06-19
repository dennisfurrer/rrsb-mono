import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  playerName: string;
  playerColor: string;
  url: string | null;
  connected: boolean;
  onRegenerate: () => void;
  onClose: () => void;
}

export function RemoteQRDialog({
  playerName,
  playerColor,
  url,
  connected,
  onRegenerate,
  onClose,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(url, { width: 600, margin: 1, errorCorrectionLevel: "M" })
      .then((d) => {
        if (!cancelled) setDataUrl(d);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 950,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1e1e1e",
          border: "1px solid #555",
          borderRadius: "16px",
          padding: "3.5vh 3vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.6vh",
          minWidth: "34vw",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
          <span style={{ color: "#aaa", fontSize: "1.4vw" }}>Fernbedienung —</span>
          <span style={{ color: playerColor, fontSize: "1.6vw", fontWeight: "bold" }}>{playerName}</span>
        </div>

        <div
          style={{
            width: "24vw",
            height: "24vw",
            background: "#fff",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {dataUrl ? (
            <img src={dataUrl} alt="QR-Code" style={{ width: "100%", height: "100%" }} />
          ) : (
            <span style={{ color: "#888", fontSize: "1.2vw" }}>Code wird erstellt…</span>
          )}
        </div>

        <div style={{ color: "#bbb", fontSize: "1.05vw", textAlign: "center", maxWidth: "30vw", lineHeight: 1.4 }}>
          Mit dem Handy scannen, um von dort aus zu zählen.
        </div>

        {url && (
          <div
            style={{
              color: "#777",
              fontSize: "0.8vw",
              wordBreak: "break-all",
              textAlign: "center",
              maxWidth: "30vw",
              fontFamily: "monospace",
            }}
          >
            {url}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.6vw", fontSize: "1.05vw" }}>
          <span
            style={{
              width: "0.9vw",
              height: "0.9vw",
              borderRadius: "50%",
              background: connected ? "#22c55e" : "#666",
              boxShadow: connected ? "0 0 8px #22c55e" : "none",
            }}
          />
          <span style={{ color: connected ? "#22c55e" : "#888" }}>
            {connected ? "Gerät verbunden" : "Warte auf Verbindung…"}
          </span>
        </div>

        <div style={{ color: "#666", fontSize: "0.85vw", textAlign: "center", maxWidth: "30vw" }}>
          Nur ein Gerät pro Code — ein neuer Scan trennt das vorherige.
        </div>

        <div style={{ display: "flex", gap: "1vw", marginTop: "0.6vh" }}>
          <button
            onClick={onRegenerate}
            style={{
              padding: "1.2vh 2vw",
              fontSize: "1.1vw",
              borderRadius: "10px",
              border: "1px solid #555",
              background: "#2a2a2a",
              color: "#ddd",
              cursor: "pointer",
            }}
          >
            Neuer Code
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "1.2vh 2vw",
              fontSize: "1.1vw",
              borderRadius: "10px",
              border: "none",
              background: "#1a5c1a",
              color: "#4ade80",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
