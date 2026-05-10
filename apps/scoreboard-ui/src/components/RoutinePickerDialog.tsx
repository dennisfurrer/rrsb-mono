import { useState } from "react";
import { SOLO_ROUTINES, type SoloRoutineId } from "../lib/solo";

interface Props {
  playerName: string;
  onStart: (routineId: SoloRoutineId) => void;
  onCancel: () => void;
}

export function RoutinePickerDialog({ playerName, onStart, onCancel }: Props) {
  const [selected, setSelected] = useState<SoloRoutineId | "">("");

  return (
    <div className="setup-overlay">
      <div className="routine-picker">
        <div className="routine-picker-header">
          Practice Mode &mdash; {playerName}
        </div>
        <div className="routine-picker-subtitle">Übung wählen:</div>
        <div className="routine-picker-grid">
          {SOLO_ROUTINES.map((r) => (
            <button
              key={r.id}
              data-routine={r.id}
              className={`routine-card ${selected === r.id ? "selected" : ""}`}
              onClick={() => setSelected(r.id)}
            >
              <div className="routine-card-accent" />
              <div className="routine-card-body">
                <div className="routine-card-name">{r.name}</div>
                <div className="routine-card-desc">{r.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="routine-picker-actions">
          <button className="routine-picker-cancel" onClick={onCancel}>
            Zurück
          </button>
          <button
            className={`routine-picker-start ${!selected ? "disabled" : ""}`}
            onClick={() => selected && onStart(selected)}
            disabled={!selected}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
