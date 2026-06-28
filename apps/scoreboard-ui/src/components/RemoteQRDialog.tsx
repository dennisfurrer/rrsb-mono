import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface Props {
  playerName: string;
  playerColor: string;
  url: string | null;
  connected: boolean;
  onRegenerate: () => void;
  onClose: () => void;
}

type Mode = "qr" | "success" | "connected";

const ANIM_CSS = `
@keyframes rqr-pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.06); } 100% { transform: scale(1); opacity: 1; } }
@keyframes rqr-circle { to { stroke-dashoffset: 0; } }
@keyframes rqr-check { to { stroke-dashoffset: 0; } }
.rqr-check-wrap { animation: rqr-pop 0.35s ease both; }
.rqr-check-circle { stroke-dasharray: 151; stroke-dashoffset: 151; animation: rqr-circle 0.4s ease forwards; }
.rqr-check-path { stroke-dasharray: 40; stroke-dashoffset: 40; animation: rqr-check 0.3s 0.35s ease forwards; }
`;

function Check({ size }: { size: string }) {
  return (
    <div className="rqr-check-wrap" style={{ width: size, height: size }}>
      <svg viewBox="0 0 52 52" width="100%" height="100%">
        <circle className="rqr-check-circle" cx="26" cy="26" r="24" fill="none" stroke="#22c55e" strokeWidth="3" />
        <path className="rqr-check-path" d="M15 27 l7.5 7.5 L38 19" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const backdropStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 950,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelStyle = {
  background: "linear-gradient(165deg, #2a2a2a, #181818)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
  boxShadow: "0 26px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.4)",
  padding: "3.5vh 3vw",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: "1.6vh",
  minWidth: "34vw",
};

const closeBtnStyle = {
  padding: "1.2vh 2vw",
  fontSize: "1.1vw",
  borderRadius: "10px",
  border: "1px solid #3a8c3a",
  background: "linear-gradient(165deg, #143a14, #0d2410)",
  color: "#4ade80",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

const ghostBtnStyle = {
  padding: "1.2vh 2vw",
  fontSize: "1.1vw",
  borderRadius: "10px",
  border: "1px solid #555",
  background: "linear-gradient(165deg, #383838, #232323)",
  color: "#ddd",
  cursor: "pointer",
};

const dangerBtnStyle = {
  padding: "1.2vh 2vw",
  fontSize: "1.1vw",
  borderRadius: "10px",
  border: "1px solid #774040",
  background: "linear-gradient(165deg, #3a1414, #240d0d)",
  color: "#ff8888",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

export function RemoteQRDialog({
  playerName,
  playerColor,
  url,
  connected,
  onRegenerate,
  onClose,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(connected ? "connected" : "qr");
  const prevConnected = useRef(connected);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  // React to connection changes: show success when a phone connects while the
  // QR is up; fall back to the QR if the device drops.
  useEffect(() => {
    const was = prevConnected.current;
    prevConnected.current = connected;
    if (connected && !was && mode === "qr") {
      setMode("success");
    } else if (!connected && was && (mode === "connected" || mode === "success")) {
      setMode("qr");
    }
  }, [connected, mode]);

  // Auto-close shortly after a successful connection.
  useEffect(() => {
    if (mode !== "success") return;
    const id = setTimeout(() => onCloseRef.current(), 1300);
    return () => clearTimeout(id);
  }, [mode]);

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
      <span style={{ color: "#aaa", fontSize: "1.4vw" }}>Fernbedienung —</span>
      <span style={{ color: playerColor, fontSize: "1.6vw", fontWeight: "bold" }}>{playerName}</span>
    </div>
  );

  return (
    <div style={backdropStyle} onClick={mode === "success" ? undefined : onClose}>
      <style>{ANIM_CSS}</style>
      <div onClick={(e) => e.stopPropagation()} style={panelStyle}>
        {header}

        {mode === "success" && (
          <>
            <Check size="9vw" />
            <div style={{ color: "#22c55e", fontSize: "1.9vw", fontWeight: "bold" }}>Verbunden!</div>
            <div style={{ color: "#bbb", fontSize: "1.1vw", textAlign: "center", maxWidth: "30vw" }}>
              {playerName} kann jetzt vom Handy aus zählen.
            </div>
          </>
        )}

        {mode === "connected" && (
          <>
            <Check size="8vw" />
            <div style={{ color: "#22c55e", fontSize: "1.6vw", fontWeight: "bold" }}>Gerät verbunden</div>
            <div style={{ color: "#bbb", fontSize: "1.05vw", textAlign: "center", maxWidth: "30vw", lineHeight: 1.4 }}>
              {playerName} zählt vom Handy. Du kannst die Verbindung hier trennen.
            </div>
            <div style={{ display: "flex", gap: "1vw", marginTop: "0.6vh" }}>
              <button className="bbb-btn-cancel" onClick={onRegenerate} style={dangerBtnStyle}>Trennen</button>
              <button className="bbb-btn-ok" onClick={onClose} style={closeBtnStyle}>Schließen</button>
            </div>
          </>
        )}

        {mode === "qr" && (
          <>
            <div
              style={{
                width: "24vw",
                height: "24vw",
                background: "#fff",
                borderRadius: "14px",
                border: "1px solid rgba(255,204,0,0.4)",
                boxShadow: "0 0 26px rgba(255,204,0,0.12)",
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
              <span style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", background: "#666" }} />
              <span style={{ color: "#888" }}>Warte auf Verbindung…</span>
            </div>

            <div style={{ color: "#666", fontSize: "0.85vw", textAlign: "center", maxWidth: "30vw" }}>
              Nur ein Gerät pro Code — ein neuer Scan trennt das vorherige.
            </div>

            <div style={{ display: "flex", gap: "1vw", marginTop: "0.6vh" }}>
              <button className="bbb-btn-undo" onClick={onRegenerate} style={ghostBtnStyle}>Neuer Code</button>
              <button onClick={() => window.location.reload()} style={{ padding: "1.2vh 2vw", fontSize: "1.1vw", borderRadius: "10px", border: "1px solid #7a5a20", background: "linear-gradient(165deg, #3a2a0a, #241a06)", color: "#fbbf24", cursor: "pointer", fontWeight: "bold" as const }}>↺ Neu laden</button>
              <button className="bbb-btn-ok" onClick={onClose} style={closeBtnStyle}>Schließen</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
