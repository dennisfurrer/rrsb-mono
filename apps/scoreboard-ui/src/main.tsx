import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RemoteApp } from "./remote/RemoteApp";
import { RemoteScanEntry } from "./remote/RemoteScanEntry";
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
    <RemoteScanEntry />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  )
);
