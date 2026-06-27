import { useState } from "react";

interface Props {
  playerName: string;
  playerIndex: 0 | 1;
  showHandicap: boolean;
  onSubmit: (
    playerIndex: 0 | 1,
    points: number,
    isFoul: boolean,
    isHandicap: boolean,
  ) => void;
  onClose: () => void;
}

// Valid foul values in snooker: 4 (min), 5 (blue), 6 (pink), 7 (black)
const FOUL_DIGITS = new Set([4, 5, 6, 7]);

export function CalculatorDialog({
  playerName,
  playerIndex,
  showHandicap,
  onSubmit,
  onClose,
}: Props) {
  const [display, setDisplay] = useState("");
  const [foulMode, setFoulMode] = useState(false);
  const [handicapMode, setHandicapMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const appendDigit = (d: number) => {
    if (foulMode) {
      // In foul mode only 4–7 are valid; each press replaces the value
      if (FOUL_DIGITS.has(d)) setDisplay(String(d));
      return;
    }
    const next = display + String(d);
    const val = parseInt(next);
    if (val <= 155) setDisplay(next);
  };

  const clear = () => {
    setDisplay("");
    setFoulMode(false);
    setHandicapMode(false);
  };

  const points = parseInt(display) || 0;
  const hasInput = points > 0 || foulMode || handicapMode;
  const handleOverlayClick = () => {
    if (hasInput) setShowDiscard(true);
    else onClose();
  };

  const submit = () => {
    if (points > 0) {
      onSubmit(playerIndex, points, foulMode, handicapMode);
    } else {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 1500);
    }
  };

  const handleFoul = () => {
    if (foulMode) {
      setFoulMode(false);
      setDisplay("");
    } else {
      setFoulMode(true);
      setHandicapMode(false);
      setDisplay("4"); // default minimum foul
    }
  };

  const handleHandicap = () => {
    if (handicapMode) {
      if (points > 0) onSubmit(playerIndex, points, false, true);
    } else {
      setHandicapMode(true);
      setFoulMode(false);
    }
  };

  const modeLabel = foulMode ? "Foul von" : handicapMode ? "Handicap für" : "Break für";

  const digitBtn = (d: number) => {
    const foulDisabled = foulMode && !FOUL_DIGITS.has(d);
    const breakDisabled = !foulMode && !handicapMode && parseInt(display + String(d)) > 155;
    const disabled = foulDisabled || breakDisabled;
    return (
      <div
        key={d}
        className="calc-butt"
        onClick={() => appendDigit(d)}
        style={disabled ? { opacity: 0.2, pointerEvents: "none" } : undefined}
      >
        {d}
      </div>
    );
  };

  if (showDiscard) {
    return (
      <div className="overlay" onClick={() => setShowDiscard(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: "#2a2a2a", borderRadius: "12px", padding: "3vh 3vw", display: "flex", flexDirection: "column", alignItems: "center", gap: "2vh", minWidth: "42vw" }}>
          <div style={{ color: "#fff", fontSize: "2vw", fontWeight: "bold", textAlign: "center" }}>
            {foulMode ? `Foul ${display} verwerfen?` : handicapMode ? `Handicap ${points > 0 ? points : ""} verwerfen?`.trim() : `Break ${points} verwerfen?`}
          </div>
          <div style={{ display: "flex", gap: "1.5vw", width: "100%" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "1.5vh 0", fontSize: "1.8vw", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: "#7a1a1a", color: "#f87171" }}>Ja, verwerfen</button>
            <button onClick={() => setShowDiscard(false)} style={{ flex: 1, padding: "1.5vh 0", fontSize: "1.8vw", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: "#1a5c1a", color: "#4ade80" }}>Nein, zurück</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div
        className="calc-fullscreen"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Row 1: Display + Foul (or Foul/HC stack) */}
        <div className="calc-line">
          <div className={`calc-display ${foulMode ? "foul-mode" : handicapMode ? "handicap-mode" : ""}`}>
            <div className="calc-display-title">
              <div className={`calc-break-for ${foulMode ? "foul-label" : handicapMode ? "handicap-label" : ""}`}>
                {modeLabel}
              </div>
              <div className="calc-break-name">{playerName}</div>
            </div>
            <div className={`calc-break-value ${foulMode ? "foul-mode" : handicapMode ? "handicap-mode" : ""}`}>
              {foulMode ? `F${display}` : (display || "0")}
            </div>
          </div>
          {showHandicap ? (
            <div className="calc-foul-hc-stack">
              <div
                className={`calc-butt calc-foul ${foulMode ? "active" : ""}`}
                onClick={handleFoul}
              >
                Foul
              </div>
              <div
                className={`calc-butt calc-handicap ${handicapMode ? "active" : ""}`}
                onClick={handleHandicap}
              >
                HCap
              </div>
            </div>
          ) : (
            <div
              className={`calc-butt calc-foul ${foulMode ? "active" : ""}`}
              onClick={handleFoul}
            >
              Foul
            </div>
          )}
        </div>

        {/* Hint row */}
        {showHint && (
          <div style={{ width: "100%", textAlign: "center", color: "#ff5555", fontWeight: "bold", fontSize: "2vw", padding: "0.3vh 0", letterSpacing: "0.05em" }}>
            Break eingeben!
          </div>
        )}

        {/* Row 2: 1 2 3 */}
        <div className="calc-line">
          {digitBtn(1)}{digitBtn(2)}{digitBtn(3)}
        </div>

        {/* Row 3: 4 5 6 */}
        <div className="calc-line">
          {digitBtn(4)}{digitBtn(5)}{digitBtn(6)}
        </div>

        {/* Row 4: 7 8 9 */}
        <div className="calc-line">
          {digitBtn(7)}{digitBtn(8)}{digitBtn(9)}
        </div>

        {/* Row 5: Löschen 0 OK */}
        <div className="calc-line">
          <div className="calc-butt calc-clear" onClick={points === 0 && !foulMode ? onClose : clear}>
            {points === 0 && !foulMode ? "Exit" : "Löschen"}
          </div>
          <div
            className="calc-butt"
            onClick={() => appendDigit(0)}
            style={(foulMode || (!handicapMode && parseInt(display + "0") > 155)) ? { opacity: 0.2, pointerEvents: "none" } : undefined}
          >
            0
          </div>
          <div className="calc-butt calc-ok" onClick={submit}>OK</div>
        </div>
      </div>
    </div>
  );
}
