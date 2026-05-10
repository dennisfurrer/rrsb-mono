import { useState } from "react";
import {
  BALL_COLORS,
  MISS_TYPES,
  POCKETS,
  type BallColor,
  type MissType,
  type Pocket,
} from "../lib/solo";

interface Props {
  breakValue: number;
  playerName: string;
  onSave: (details: {
    missType?: MissType;
    ball?: BallColor;
    pocket?: Pocket;
  }) => void;
  onBack: () => void;
}

export function BreakDetailsDialog({
  breakValue,
  playerName,
  onSave,
  onBack,
}: Props) {
  const [missType, setMissType] = useState<MissType | null>(null);
  const [ball, setBall] = useState<BallColor | null>(null);
  const [pocket, setPocket] = useState<Pocket | null>(null);

  const toggle = <T,>(current: T | null, value: T): T | null =>
    current === value ? null : value;

  const handleSave = () => {
    onSave({
      missType: missType ?? undefined,
      ball: ball ?? undefined,
      pocket: pocket ?? undefined,
    });
  };

  return (
    <div className="overlay" onClick={onBack}>
      <div className="break-details" onClick={(e) => e.stopPropagation()}>
        <div className="break-details-header">
          <span className="break-details-header-label">Break:</span>
          <span className="break-details-header-value">{breakValue}</span>
          <span className="break-details-header-player">— {playerName}</span>
        </div>

        <div className="break-details-section">
          <div className="break-details-section-label">
            Wo war der Fehler? <span className="optional">(optional)</span>
          </div>
          <div className="break-details-pills">
            {MISS_TYPES.map((m) => (
              <button
                key={m.id}
                className={`break-pill break-pill-miss ${missType === m.id ? "selected" : ""}`}
                onClick={() => setMissType((c) => toggle(c, m.id))}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="break-details-section">
          <div className="break-details-section-label">
            Welcher Ball? <span className="optional">(optional)</span>
          </div>
          <div className="break-details-pills">
            {BALL_COLORS.map((b) => (
              <button
                key={b.id}
                className={`break-pill break-pill-ball ${ball === b.id ? "selected" : ""}`}
                style={
                  ball === b.id
                    ? { background: b.bg, color: b.fg, borderColor: b.fg }
                    : undefined
                }
                onClick={() => setBall((c) => toggle(c, b.id))}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="break-details-section">
          <div className="break-details-section-label">
            Welches Loch? <span className="optional">(optional)</span>
          </div>
          <div className="break-details-pills">
            {POCKETS.map((p) => (
              <button
                key={p.id}
                className={`break-pill break-pill-pocket ${pocket === p.id ? "selected" : ""}`}
                onClick={() => setPocket((c) => toggle(c, p.id))}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="break-details-actions">
          <button className="break-details-back" onClick={onBack}>
            Zurück
          </button>
          <button className="break-details-save" onClick={handleSave}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
