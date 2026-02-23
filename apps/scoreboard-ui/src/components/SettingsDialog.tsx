import { useState } from "react";

interface Props {
  currentTableNumber: string | null;
  onSave: (tableNumber: string) => void;
  onClose: () => void;
}

const SETTINGS_PASSWORD = import.meta.env.VITE_SETTINGS_PASSWORD || "1234";

export function SettingsDialog({ currentTableNumber, onSave, onClose }: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [tableNumber, setTableNumber] = useState(currentTableNumber || "");
  const [error, setError] = useState("");

  const handleAuth = () => {
    if (password === SETTINGS_PASSWORD) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Falsches Passwort");
    }
  };

  const handleSave = () => {
    onSave(tableNumber);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#333",
          padding: "2rem",
          borderRadius: "12px",
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
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1.1rem",
                borderRadius: "6px",
                border: "1px solid #555",
                background: "#222",
                color: "#fff",
                marginBottom: "0.5rem",
              }}
            />
            {error && (
              <div style={{ color: "#f66", marginBottom: "0.5rem" }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                onClick={handleAuth}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#4a9",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#666",
                  color: "#fff",
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
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              min={1}
              max={99}
              autoFocus
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1.1rem",
                borderRadius: "6px",
                border: "1px solid #555",
                background: "#222",
                color: "#fff",
                marginBottom: "1rem",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#4a9",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Speichern
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  fontSize: "1.1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#666",
                  color: "#fff",
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
