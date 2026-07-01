import { useState } from "react";
import type { BallColor, FoulType, LongType, MissType, Pocket } from "../lib/solo";
import { BreakDetailsDialog } from "./BreakDetailsDialog";

interface Props {
  playerName: string;
  seriesMode?: boolean;
  routineName?: string;
  maxBreak?: number;
  onSubmit: (
    value: number,
    details?: { missType?: MissType; foulType?: FoulType; longType?: LongType; ball?: BallColor; pocket?: Pocket; effectX?: number; effectY?: number; ballDistance?: number; shotStrength?: number }
  ) => void;
  onClose: () => void;
}

export function BreakEntryDialog({ playerName, seriesMode, routineName, maxBreak, onSubmit, onClose }: Props) {
  const [display, setDisplay] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");

  const appendDigit = (d: number) => {
    const next = display + String(d);
    const val = parseInt(next);
    if (val <= 200) {
      setDisplay(next);
      if (error) setError("");
    }
  };

  const clear = () => { setDisplay(""); setError(""); };

  const value = parseInt(display) || 0;

  const submitPlain = () => {
    if (value > 0) {
      if (maxBreak !== undefined && value > maxBreak) {
        setError(`Break ${value} ist zu hoch! Maximal mögliches Break: ${maxBreak}`);
        setDisplay("");
        return;
      }
      onSubmit(value);
    } else {
      onClose();
    }
  };

  const openDetails = () => {
    if (value > 0) setShowDetails(true);
  };

  const submitWithDetails = (details: {
    missType?: MissType;
    foulType?: FoulType;
    longType?: LongType;
    ball?: BallColor;
    pocket?: Pocket;
    effectX?: number;
    effectY?: number;
    ballDistance?: number;
    shotStrength?: number;
  }) => {
    onSubmit(value, details);
  };

  if (showDetails) {
    return (
      <BreakDetailsDialog
        breakValue={value}
        playerName={playerName}
        routineName={routineName}
        onSave={submitWithDetails}
        onBack={() => setShowDetails(false)}
      />
    );
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="break-entry"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Display */}
        {routineName && (
          <div className="break-entry-routine-name">{routineName}</div>
        )}
        <div className="break-entry-display">
          <div className="break-entry-display-title">
            <div className="break-entry-break-for">{seriesMode ? "Serie für" : "Break für"}</div>
            <div className="break-entry-break-name">{playerName}</div>
          </div>
          <div className="break-entry-break-value">{display || "0"}</div>
        </div>

        {/* Validation error */}
        {error && (
          <div style={{
            background: "linear-gradient(165deg, #3a1010, #260a0a)",
            border: "1px solid #aa3333",
            borderRadius: "10px",
            boxShadow: "0 0 18px rgba(255,68,68,0.25)",
            color: "#ff6666",
            fontSize: "1.5vw",
            fontWeight: "bold",
            padding: "1vh 1.5vw",
            textAlign: "center",
            margin: "0 1.5vw",
          }}>
            {error}
          </div>
        )}

        {/* Numpad rows */}
        <div className="break-entry-line">
          <div className="break-entry-butt" onClick={() => appendDigit(1)}>1</div>
          <div className="break-entry-butt" onClick={() => appendDigit(2)}>2</div>
          <div className="break-entry-butt" onClick={() => appendDigit(3)}>3</div>
        </div>
        <div className="break-entry-line">
          <div className="break-entry-butt" onClick={() => appendDigit(4)}>4</div>
          <div className="break-entry-butt" onClick={() => appendDigit(5)}>5</div>
          <div className="break-entry-butt" onClick={() => appendDigit(6)}>6</div>
        </div>
        <div className="break-entry-line">
          <div className="break-entry-butt" onClick={() => appendDigit(7)}>7</div>
          <div className="break-entry-butt" onClick={() => appendDigit(8)}>8</div>
          <div className="break-entry-butt" onClick={() => appendDigit(9)}>9</div>
        </div>
        <div className="break-entry-line">
          <div className="break-entry-butt break-entry-clear" onClick={clear}>
            Löschen
          </div>
          <div className="break-entry-butt" onClick={() => appendDigit(0)}>0</div>
          <div
            className={`break-entry-butt break-entry-ok ${value > 0 ? "frame-end-btn-glow" : ""}`}
            onClick={submitPlain}
          >
            OK
          </div>
        </div>

        {/* Optional details link — secondary, intentionally small */}
        <div className="break-entry-details-row">
          <button
            className={`break-entry-details-link ${value === 0 ? "disabled" : "break-entry-details-link-attention"}`}
            onClick={openDetails}
            disabled={value === 0}
          >
            + Details (optional)
          </button>
        </div>
      </div>
    </div>
  );
}
