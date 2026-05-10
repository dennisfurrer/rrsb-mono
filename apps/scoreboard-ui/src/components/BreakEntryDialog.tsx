import { useState } from "react";
import type { BallColor, MissType, Pocket } from "../lib/solo";
import { BreakDetailsDialog } from "./BreakDetailsDialog";

interface Props {
  playerName: string;
  onSubmit: (
    value: number,
    details?: { missType?: MissType; ball?: BallColor; pocket?: Pocket }
  ) => void;
  onClose: () => void;
}

export function BreakEntryDialog({ playerName, onSubmit, onClose }: Props) {
  const [display, setDisplay] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const appendDigit = (d: number) => {
    const next = display + String(d);
    const val = parseInt(next);
    if (val <= 200) setDisplay(next);
  };

  const clear = () => setDisplay("");

  const value = parseInt(display) || 0;

  const submitPlain = () => {
    if (value > 0) {
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
    ball?: BallColor;
    pocket?: Pocket;
  }) => {
    onSubmit(value, details);
  };

  if (showDetails) {
    return (
      <BreakDetailsDialog
        breakValue={value}
        playerName={playerName}
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
        <div className="break-entry-display">
          <div className="break-entry-display-title">
            <div className="break-entry-break-for">Break für</div>
            <div className="break-entry-break-name">{playerName}</div>
          </div>
          <div className="break-entry-break-value">{display || "0"}</div>
        </div>

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
          <div className="break-entry-butt break-entry-ok" onClick={submitPlain}>
            OK
          </div>
        </div>

        {/* Optional details link — secondary, intentionally small */}
        <div className="break-entry-details-row">
          <button
            className={`break-entry-details-link ${value === 0 ? "disabled" : ""}`}
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
