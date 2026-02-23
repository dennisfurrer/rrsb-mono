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

  const appendDigit = (d: number) => {
    const next = display + String(d);
    const val = parseInt(next);
    if (val <= 155) setDisplay(next);
  };

  const clear = () => setDisplay("");

  const submit = () => {
    const points = parseInt(display) || 0;
    if (points > 0) {
      onSubmit(playerIndex, points, foulMode, false);
    } else {
      onClose();
    }
  };

  const submitFoul = () => {
    const points = parseInt(display) || 0;
    if (points > 0) {
      onSubmit(playerIndex, points, true, false);
    }
  };

  const submitHandicap = () => {
    const points = parseInt(display) || 0;
    if (points > 0) {
      onSubmit(playerIndex, points, false, true);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className={`calc-fullscreen ${showHandicap ? "has-handicap" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Row 1: Display + Foul */}
        <div className="calc-line">
          <div className="calc-display">
            <div className="calc-display-title">
              <div className={`calc-break-for ${foulMode ? "foul-label" : ""}`}>
                {foulMode ? "Foul für" : "Break für"}
              </div>
              <div className="calc-break-name">{playerName}</div>
            </div>
            <div className={`calc-break-value ${foulMode ? "foul-mode" : ""}`}>
              {display || "0"}
            </div>
          </div>
          <div
            className={`calc-butt calc-foul ${foulMode ? "active" : ""}`}
            onClick={() => {
              if (foulMode) {
                submitFoul();
              } else {
                setFoulMode(true);
              }
            }}
          >
            Foul
          </div>
        </div>

        {/* Row 2: 1 2 3 */}
        <div className="calc-line">
          <div className="calc-butt" onClick={() => appendDigit(1)}>
            1
          </div>
          <div className="calc-butt" onClick={() => appendDigit(2)}>
            2
          </div>
          <div className="calc-butt" onClick={() => appendDigit(3)}>
            3
          </div>
        </div>

        {/* Row 3: 4 5 6 */}
        <div className="calc-line">
          <div className="calc-butt" onClick={() => appendDigit(4)}>
            4
          </div>
          <div className="calc-butt" onClick={() => appendDigit(5)}>
            5
          </div>
          <div className="calc-butt" onClick={() => appendDigit(6)}>
            6
          </div>
        </div>

        {/* Row 4: 7 8 9 */}
        <div className="calc-line">
          <div className="calc-butt" onClick={() => appendDigit(7)}>
            7
          </div>
          <div className="calc-butt" onClick={() => appendDigit(8)}>
            8
          </div>
          <div className="calc-butt" onClick={() => appendDigit(9)}>
            9
          </div>
        </div>

        {/* Row 5: Löschen 0 OK */}
        <div className="calc-line">
          <div className="calc-butt calc-clear" onClick={clear}>
            Löschen
          </div>
          <div className="calc-butt" onClick={() => appendDigit(0)}>
            0
          </div>
          <div className="calc-butt calc-ok" onClick={submit}>
            OK
          </div>
        </div>

        {/* Row 6: Handicap (conditional) */}
        {showHandicap && (
          <div className="calc-line">
            <div className="calc-butt calc-handicap" onClick={submitHandicap}>
              Handicap
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
