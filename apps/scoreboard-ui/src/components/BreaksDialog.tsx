import { useEffect, useState } from "react";
import {
  fetchPlayerBreaks,
  toggleBreakFlag,
  type BreakAction,
} from "../lib/api";

interface Props {
  matchId: string;
  playerIndex: number;
  playerName: string;
  localBreaks?: number[];
  onClose: () => void;
}

export function BreaksDialog({
  matchId,
  playerIndex,
  playerName,
  localBreaks,
  onClose,
}: Props) {
  const localFallback: BreakAction[] = (localBreaks ?? []).map((pts, i) => ({
    id: `local-${i}`,
    points: pts,
    frameNumber: 0,
    manualFlagToIgnore: false,
    timestamp: "",
  }));

const [breaks, setBreaks] = useState<BreakAction[]>(localFallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerBreaks(matchId, playerIndex + 1) // API uses 1-indexed playerIndex
      .then((apiBreaks) => {
        if (apiBreaks.length > 0) setBreaks(apiBreaks);
      })
      .finally(() => setLoading(false));
  }, [matchId, playerIndex]);

  const handleToggle = async (id: string) => {
    const newFlag = await toggleBreakFlag(id);
    setBreaks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, manualFlagToIgnore: newFlag } : b
      )
    );
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "1.5rem",
          minWidth: "340px",
          maxWidth: "90vw",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: "1.4rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            color: "#4af",
          }}
        >
          Top Breaks &mdash; {playerName}
        </div>

        {loading && breaks.length === 0 ? (
          <div style={{ color: "#888", padding: "1rem 0" }}>Laden...</div>
        ) : breaks.length === 0 ? (
          <div style={{ color: "#888", padding: "1rem 0" }}>
            Keine Breaks &gt;7
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "60vh", overflowY: "auto", paddingRight: "4px" }}>
            {breaks.map((b, i) => (
              <div
                key={b.id}
                className={`breaks-row ${b.manualFlagToIgnore ? "breaks-row--flagged" : ""}`}
                onClick={() => { if (!b.id.startsWith("local-")) handleToggle(b.id); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "8px",
                  background: b.manualFlagToIgnore
                    ? "rgba(255,60,60,0.15)"
                    : "rgba(255,255,255,0.07)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <span
                    style={{
                      width: "1.8rem",
                      textAlign: "center",
                      color: "#666",
                      fontSize: "0.9rem",
                    }}
                  >
                    {i + 1}.
                  </span>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: b.manualFlagToIgnore ? "#666" : "#fff",
                      textDecoration: b.manualFlagToIgnore
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {b.points}
                  </span>
                  {b.frameNumber > 0 && (
                    <span style={{ color: "#888", fontSize: "0.85rem" }}>
                      Frame {b.frameNumber}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    width: "2.2rem",
                    height: "2.2rem",
                    borderRadius: "50%",
                    border: `2px solid ${b.manualFlagToIgnore ? "#f44" : "#444"}`,
                    background: b.manualFlagToIgnore ? "#f44" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  {b.manualFlagToIgnore ? "✕" : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {breaks.some(b => !b.id.startsWith("local-")) && (
          <div
            style={{
              marginTop: "1rem",
              fontSize: "0.75rem",
              color: "#666",
              textAlign: "center",
            }}
          >
            Antippen um Break aus Statistik auszuschliessen
          </div>
        )}

        <button
          className="breaks-close"
          onClick={onClose}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "0.75rem",
            fontSize: "1.1rem",
            borderRadius: "8px",
            border: "1px solid #555",
            background: "#333",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Schliessen
        </button>
      </div>
    </div>
  );
}
