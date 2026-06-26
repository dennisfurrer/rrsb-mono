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

  const submit = () => {
    if (points > 0) {
      onSubmit(playerIndex, points, foulMode, handicapMode);
    } else {
      onClose();
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
    const disabled = foulMode && !FOUL_DIGITS.has(d);
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

  return (
    <div className="overlay" onClick={onClose}>
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
          <div className="calc-butt calc-clear" onClick={clear}>Löschen</div>
          <div
            className="calc-butt"
            onClick={() => appendDigit(0)}
            style={foulMode ? { opacity: 0.2, pointerEvents: "none" } : undefined}
          >
            0
          </div>
          <div className="calc-butt calc-ok" onClick={submit}>OK</div>
        </div>
      </div>
    </div>
  );
}
