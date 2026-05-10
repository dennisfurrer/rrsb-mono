import { useState } from "react";

interface Props {
  current: number;
  onSave: (reds: number) => void;
  onClose: () => void;
}

const REDS_MIN = 1;
const REDS_MAX = 15;

export function RedsConfigDialog({ current, onSave, onClose }: Props) {
  const [reds, setReds] = useState(current);

  const dec = () => setReds((v) => Math.max(REDS_MIN, v - 1));
  const inc = () => setReds((v) => Math.min(REDS_MAX, v + 1));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="reds-config" onClick={(e) => e.stopPropagation()}>
        <div className="reds-config-title">Anzahl Rote</div>
        <div className="reds-config-stepper">
          <button onClick={dec} disabled={reds <= REDS_MIN}>−</button>
          <div className="reds-config-value">{reds}</div>
          <button onClick={inc} disabled={reds >= REDS_MAX}>+</button>
        </div>
        <div className="reds-config-actions">
          <button className="reds-config-cancel" onClick={onClose}>
            Abbrechen
          </button>
          <button className="reds-config-save" onClick={() => onSave(reds)}>
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
