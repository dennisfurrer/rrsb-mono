import { useState } from "react";

interface Props {
  currentTableNumber: string | null;
  currentCenterName: string | null;
  onSave: (tableNumber: string, centerName: string) => void;
  onClose: () => void;
}

const SETTINGS_PASSWORD = import.meta.env.VITE_SETTINGS_PASSWORD || "1234";
const CENTER_NAMES_KEY = "centerNames";

function loadCenterNames(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CENTER_NAMES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCenterName(name: string) {
  if (!name.trim()) return;
  const names = loadCenterNames();
  const updated = [name, ...names.filter((n) => n !== name)].slice(0, 20);
  localStorage.setItem(CENTER_NAMES_KEY, JSON.stringify(updated));
}

export function SettingsDialog({ currentTableNumber, currentCenterName, onSave, onClose }: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [tableNumber, setTableNumber] = useState(currentTableNumber || "");
  const [centerName, setCenterName] = useState(currentCenterName || "");
  const [error, setError] = useState("");
  const centerNames = loadCenterNames();

  const handleAuth = () => {
    if (password === SETTINGS_PASSWORD) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Falsches Passwort");
    }
  };

  const handleSave = () => {
    saveCenterName(centerName);
    onSave(tableNumber, centerName);
    onClose();
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    fontSize: "1.1rem",
    borderRadius: "8px",
    border: "1px solid #555",
    background: "#1e1e1e",
    color: "#fff",
    marginBottom: "1rem",
    boxSizing: "border-box" as const,
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(165deg, #2a2a2a, #181818)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 26px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.4)",
          padding: "2rem",
          borderRadius: "20px",
          minWidth: "320px",
          color: "#fff",
          fontSize: "1.2rem",
        }}
      >
        {!authenticated ? (
          <>
            <div style={{ marginBottom: "1rem", fontWeight: "bold" }}>
              Einstellungen - Passwort
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              placeholder="Passwort eingeben"
              autoFocus
              style={inputStyle}
            />
            {error && (
              <div style={{ color: "#f66", marginBottom: "0.5rem" }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                className="bbb-btn-ok"
                onClick={handleAuth}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  borderRadius: "10px",
                  border: "1px solid #3a8c3a",
                  background: "linear-gradient(165deg, #143a14, #0d2410)",
                  color: "#4ade80",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
              <button
                className="bbb-btn-cancel"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  borderRadius: "10px",
                  border: "1px solid #666",
                  background: "linear-gradient(165deg, #4a4a4a, #333)",
                  color: "#ccc",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Abbrechen
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "1rem", fontWeight: "bold" }}>
              Einstellungen
            </div>
            <div style={{ marginBottom: "0.5rem" }}>Tischnummer:</div>
            <input
              type="text"
              inputMode="numeric"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value.replace(/\D/g, ""))}
              autoFocus
              style={inputStyle}
            />
            <div style={{ marginBottom: "0.5rem" }}>Center:</div>
            <input
              type="text"
              list="center-names-list"
              value={centerName}
              onChange={(e) => setCenterName(e.target.value)}
              placeholder="z.B. Billardclub Zürich"
              style={inputStyle}
            />
            <datalist id="center-names-list">
              {centerNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="bbb-btn-ok"
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  borderRadius: "10px",
                  border: "1px solid #3a8c3a",
                  background: "linear-gradient(165deg, #143a14, #0d2410)",
                  color: "#4ade80",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Speichern
              </button>
              <button
                className="bbb-btn-cancel"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  borderRadius: "10px",
                  border: "1px solid #666",
                  background: "linear-gradient(165deg, #4a4a4a, #333)",
                  color: "#ccc",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Abbrechen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
