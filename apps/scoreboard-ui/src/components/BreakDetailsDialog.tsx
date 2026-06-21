import { useRef, useState } from "react";
import {
  BALL_COLORS,
  FOUL_TYPES,
  MISS_TYPES,
  POCKETS,
  type BallColor,
  type FoulType,
  type MissType,
  type Pocket,
} from "../lib/solo";

const BALL_ICON_COLOR: Record<BallColor, string> = {
  red: "#dd2222",
  yellow: "#f0c020",
  green: "#1f9e4a",
  brown: "#7a4a1e",
  blue: "#2255cc",
  pink: "#ff77b3",
  black: "#161616",
};

function BallDot({ color, label, size = "2.8vw" }: { color: string; label: string; size?: string }) {
  return (
    <svg viewBox="0 0 20 20" style={{ width: size, height: size, display: "block", flexShrink: 0 }} aria-label={label}>
      <circle cx={10} cy={10} r={9} fill={color} stroke="#0006" strokeWidth={0.6} />
      <circle cx={7.3} cy={6.8} r={2.2} fill="#ffffff" opacity={0.55} />
    </svg>
  );
}

interface Props {
  breakValue: number;
  playerName: string;
  routineName?: string;
  onSave: (details: {
    missType?: MissType;
    foulType?: FoulType;
    ball?: BallColor;
    pocket?: Pocket;
  }) => void;
  onBack: () => void;
}

export function BreakDetailsDialog({
  breakValue,
  playerName,
  routineName,
  onSave,
  onBack,
}: Props) {
  const [missType, setMissTypeRaw] = useState<MissType | null>(null);
  const [foulType, setFoulType] = useState<FoulType | null>(null);
  const [ball, setBall] = useState<BallColor | null>(null);
  const [pocket, setPocket] = useState<Pocket | null>(null);
  const foulSelectRef = useRef<HTMLSelectElement>(null);

  const toggle = <T,>(current: T | null, value: T): T | null =>
    current === value ? null : value;

  const setMissType = (value: MissType) => {
    setMissTypeRaw((c) => {
      const next = toggle(c, value);
      setFoulType(next === "foul" ? "white-potted" : null);
      if (next === "foul") {
        requestAnimationFrame(() => {
          const el = foulSelectRef.current;
          if (el && "showPicker" in el) {
            try { (el as HTMLSelectElement & { showPicker: () => void }).showPicker(); } catch { /* unsupported */ }
          }
        });
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave({
      missType: missType ?? undefined,
      foulType: missType === "foul" ? foulType ?? undefined : undefined,
      ball: ball ?? undefined,
      pocket: pocket ?? undefined,
    });
  };

  return (
    <div className="overlay" onClick={onBack}>
      <div className="break-details" onClick={(e) => e.stopPropagation()}>
        {routineName && (
          <div className="break-details-routine-name">{routineName}</div>
        )}
        <div className="break-details-header">
          <span />
          <span className="break-details-header-center">
            <span className="break-details-header-label">Break:</span>
            <span className="break-details-header-value">{breakValue}</span>
          </span>
          <span className="break-details-header-player">— {playerName}</span>
        </div>

        <div className="break-details-section">
          <div className="break-details-section-label">
            Wo war der Fehler?          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="break-details-pills" style={{ flex: "0 0 auto" }}>
              {MISS_TYPES.map((m) => (
                <button
                  key={m.id}
                  className={`break-pill break-pill-miss ${m.id === "foul" ? "break-pill-foul" : ""} ${missType === m.id ? "selected" : ""}`}
                  onClick={() => setMissType(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {missType === "foul" && (
              <select
                ref={foulSelectRef}
                className="break-foul-select"
                value={foulType ?? ""}
                onChange={(e) => setFoulType((e.target.value || null) as FoulType | null)}
              >
                {FOUL_TYPES.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="break-details-section">
          <div className="break-details-section-label">
            Welcher Ball?          </div>
          <div className="break-details-pills">
            {BALL_COLORS.map((b) => (
              <button
                key={b.id}
                className={`break-pill break-pill-ball ${ball === b.id ? "selected" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...(ball === b.id ? { background: b.bg, borderColor: b.fg } : {}),
                }}
                onClick={() => setBall((c) => toggle(c, b.id))}
              >
                <BallDot color={BALL_ICON_COLOR[b.id]} label={b.label} />
              </button>
            ))}
          </div>
        </div>

        <div className="break-details-section">
          <div className="break-details-section-label">
            Welches Loch?          </div>
          <div className="break-details-pills">
            {POCKETS.map((p) => (
              <button
                key={p.id}
                className={`break-pill break-pill-pocket ${pocket === p.id ? "selected" : ""}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3em" }}
                onClick={() => setPocket((c) => toggle(c, p.id))}
              >
                {p.label}
                {p.blackSpot && <BallDot color={BALL_ICON_COLOR.black} label="Schwarz" size="1.7vw" />}
                <BallDot color={BALL_ICON_COLOR[p.side]} label={p.side === "yellow" ? "Gelb" : "Grün"} size="1.7vw" />
              </button>
            ))}
          </div>
        </div>

        <div className="break-details-actions">
          <button className="break-details-back" onClick={onBack}>
            Zurück
          </button>
          <button
            className={`break-details-save ${missType || ball || pocket ? "frame-end-btn-glow" : ""}`}
            onClick={handleSave}
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
