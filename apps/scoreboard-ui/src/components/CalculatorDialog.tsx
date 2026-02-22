import { useState } from "react";

interface Props {
  playerName: string;
  playerIndex: 0 | 1;
  showHandicap: boolean;
  onSubmit: (
    playerIndex: 0 | 1,
    points: number,
    isFoul: boolean,
    isHandicap: boolean
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
      <div className="calc-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="calc-player-name">{playerName}</div>
        <div className={`calc-display ${foulMode ? "foul-mode" : ""}`}>
          {display || "0"}
        </div>

        <div className="calc-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button key={d} onClick={() => appendDigit(d)}>
              {d}
            </button>
          ))}
          <button onClick={clear}>C</button>
          <button onClick={() => appendDigit(0)}>0</button>
          <button className="calc-btn-ok" onClick={submit}>
            OK
          </button>
        </div>

        <div className="calc-actions">
          <button
            className={`calc-btn-foul ${foulMode ? "active" : ""}`}
            onClick={() => {
              if (foulMode) {
                submitFoul();
              } else {
                setFoulMode(true);
              }
            }}
          >
            Foul
          </button>
          {showHandicap && (
            <button className="calc-btn-handicap" onClick={submitHandicap}>
              Handicap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
