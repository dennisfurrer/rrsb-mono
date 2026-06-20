import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RemoteApp } from "./remote/RemoteApp";
import { decodeRemoteParam } from "./lib/remote";
import "./styles/global.css";

const params = new URLSearchParams(window.location.search);
const remoteParam = params.get("r");
const scanMode = params.has("scan");
const remote = remoteParam ? decodeRemoteParam(remoteParam) : null;

const root = createRoot(document.getElementById("root")!);

root.render(
  remote ? (
    // Phone remote scorer — no StrictMode so the SSE stream isn't double-opened.
    <RemoteApp roomId={remote.roomId} token={remote.token} />
  ) : scanMode ? (
    <div style={{ height: "100%", background: "#0d0d0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", padding: 24 }}>
      <div style={{ fontSize: 48 }}>📷</div>
      <div style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Neuen QR-Code scannen</div>
      <div style={{ color: "#aaa", fontSize: 15, maxWidth: 280 }}>
        Bitte den QR-Code auf dem Scoreboard-Bildschirm mit der Kamera scannen.
      </div>
    </div>
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  )
);
