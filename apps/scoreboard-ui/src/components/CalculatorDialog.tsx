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
      if (points > 0) onSubmit(playerIndex, points, true, false);
    } else {
      setFoulMode(true);
      setHandicapMode(false);
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
              {display || "0"}
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
          <div className="calc-butt" onClick={() => appendDigit(1)}>1</div>
          <div className="calc-butt" onClick={() => appendDigit(2)}>2</div>
          <div className="calc-butt" onClick={() => appendDigit(3)}>3</div>
        </div>

        {/* Row 3: 4 5 6 */}
        <div className="calc-line">
          <div className="calc-butt" onClick={() => appendDigit(4)}>4</div>
          <div className="calc-butt" onClick={() => appendDigit(5)}>5</div>
          <div className="calc-butt" onClick={() => appendDigit(6)}>6</div>
        </div>

        {/* Row 4: 7 8 9 */}
        <div className="calc-line">
          <div className="calc-butt" onClick={() => appendDigit(7)}>7</div>
          <div className="calc-butt" onClick={() => appendDigit(8)}>8</div>
          <div className="calc-butt" onClick={() => appendDigit(9)}>9</div>
        </div>

        {/* Row 5: Löschen 0 OK */}
        <div className="calc-line">
          <div className="calc-butt calc-clear" onClick={clear}>Löschen</div>
          <div className="calc-butt" onClick={() => appendDigit(0)}>0</div>
          <div className="calc-butt calc-ok" onClick={submit}>OK</div>
        </div>
      </div>
    </div>
  );
}
