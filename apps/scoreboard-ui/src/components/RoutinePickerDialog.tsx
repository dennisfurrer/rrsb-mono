import { useState } from "react";
import { SOLO_ROUTINES, type SoloRoutineId } from "../lib/solo";

interface Props {
  playerName: string;
  onStart: (routineId: SoloRoutineId, redsCount: number) => void;
  onCancel: () => void;
}

const BREAK_ROUTINES = SOLO_ROUTINES.filter((r) => r.mode === "break" && !r.seriesMode);

const ROUTINE_ACCENT: Partial<Record<SoloRoutineId, string>> = {
  "lineup":       "#ffcc00",
  "tline":        "#99ccff",
  "opentable":    "#66ff33",
  "ball1521":     "#ff5555",
  "farben-endlos":"#bb66ff",
  "zigzak":       "#33ccaa",
};

const SPOT_COLORS: {
  id: SoloRoutineId;
  label: string;
  bg: string;
  activeBg: string;
  color: string;
  border: string;
}[] = [
  { id: "spot-yellow", label: "Gelb",    bg: "#3a3000", activeBg: "#5a4a00", color: "#ffff66", border: "#cccc00" },
  { id: "spot-green",  label: "Grün",    bg: "#003000", activeBg: "#004a00", color: "#66ff66", border: "#00cc00" },
  { id: "spot-brown",  label: "Braun",   bg: "#2a1500", activeBg: "#3a2000", color: "#cc9966", border: "#996633" },
  { id: "spot-blue",   label: "Blau",    bg: "#000044", activeBg: "#000077", color: "#6699ff", border: "#3366cc" },
  { id: "spot-pink",   label: "Pink",    bg: "#3a0022", activeBg: "#550033", color: "#ff99cc", border: "#cc3366" },
  { id: "spot-black",  label: "Schwarz", bg: "#1a1a1a", activeBg: "#2a2a2a", color: "#cccccc", border: "#666666" },
];

function renderExplanation(text: string, colorName?: string, colorHex?: string) {
  const keywords = ["Ziel", "Trainingseffekt", "Spielart", "Aufsetzart"];
  const pattern = new RegExp(
    `(${[...(colorName ? [colorName] : []), "Weisse", "Weiss", "Gelb", "Schwarz", ...keywords].join("|")})`,
    "g"
  );
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (colorName && part === colorName) return <span key={i} style={{ color: colorHex, fontWeight: "bold" }}>{part}</span>;
    if (part === "Weiss" || part === "Weisse") return <span key={i} style={{ color: "#fff", fontWeight: "bold" }}>{part}</span>;
    if (part === "Gelb") return <span key={i} style={{ color: "#d4b800", fontWeight: "bold" }}>{part}</span>;
    if (part === "Schwarz") return <span key={i} style={{ color: "#aaa", fontWeight: "bold" }}>{part}</span>;
    if (part === "Ziel") return <span key={i} style={{ color: "#4ade80", fontWeight: "bold" }}>{part}</span>;
    if (part === "Trainingseffekt") return <span key={i} style={{ color: "#facc15", fontWeight: "bold" }}>{part}</span>;
    if (part === "Spielart") return <span key={i} style={{ color: "#aaa", fontWeight: "bold" }}>{part}</span>;
    if (part === "Aufsetzart") return <span key={i} style={{ color: "#aaa", fontWeight: "bold" }}>{part}</span>;
    return part;
  });
}

const X_BUTTON_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "0.8vw",
  right: "0.8vw",
  width: "2.8vw",
  height: "2.8vw",
  borderRadius: "50%",
  background: "rgba(70,70,70,0.85)",
  border: "2px solid #999",
  color: "#ddd",
  fontSize: "1.4vw",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  lineHeight: 1,
  pointerEvents: "none",
};

export function RoutinePickerDialog({ playerName, onStart, onCancel }: Props) {
  const [selected, setSelected] = useState<SoloRoutineId | "">("");
  const [redsCount, setRedsCount] = useState(15);
  const [ballCount, setBallCount] = useState<15 | 21>(15);
  const [redToggle, setRedToggle] = useState<5 | 10 | 15>(15);

  const selectedRoutine = selected ? SOLO_ROUTINES.find((r) => r.id === selected) : null;
  const isBreakMode = selectedRoutine?.mode === "break" && !selectedRoutine?.seriesMode;
  const showRedToggle = ["lineup", "tline", "opentable", "zigzak"].includes(selected as string);
  const showReds = isBreakMode && selectedRoutine?.defaultReds !== undefined && !showRedToggle;
  const showBallCount = selectedRoutine?.id === "ball1521";
  const minReds = selectedRoutine?.minReds ?? 1;
  const accentColor = selected ? (ROUTINE_ACCENT[selected] ?? (SPOT_COLORS.find(s => s.id === selected)?.color)) : undefined;
  const selectedIsBreak = !!selected && BREAK_ROUTINES.some((r) => r.id === selected);
  const selectedIsSpot = !!selected && SPOT_COLORS.some((sc) => sc.id === selected);
  const selectedSpot = selectedIsSpot ? SPOT_COLORS.find((sc) => sc.id === selected) ?? null : null;

  const subtitleName = selected === "ball1521"
    ? `${ballCount}er-Ball`
    : showRedToggle
      ? `${selectedRoutine?.name} — ${redToggle} Rote`
      : selectedRoutine?.name ?? selectedSpot?.label;

  const handleSelectBreak = (id: SoloRoutineId) => {
    setSelected(id);
    setRedToggle(id === "zigzak" ? 5 : 15);
  };

  const explanationPanel = selectedRoutine ? (
    <div style={{
      flex: 1,
      overflow: "auto",
      color: "#bbb",
      fontSize: "1.35vw",
      lineHeight: 1.75,
      whiteSpace: "pre-line",
      background: "#1a1a1a",
      borderRadius: "8px",
      padding: "1.8vh 1.8vw",
      border: "1px solid #333",
    }}>
      {(() => {
        const expl = selectedRoutine.explanation || selectedRoutine.description;
        const sc = SPOT_COLORS.find((s) => s.id === selectedRoutine.id);
        return renderExplanation(expl, sc?.label, sc?.color);
      })()}
    </div>
  ) : null;

  return (
    <div className="setup-overlay">
      <div className="routine-picker" style={{ "--routine-accent": accentColor } as React.CSSProperties}>
        <div className="routine-picker-header">
          Solo Training &mdash; {playerName}
        </div>
        <div className="routine-picker-subtitle">
          {selected
            ? <strong style={{ color: accentColor ?? "#4ade80" }}>{subtitleName}</strong>
            : "Übung wählen:"}
        </div>

        {selected ? (
          /* ── Focused view: card + explanation side by side ── */
          <div style={{ flex: 1, display: "flex", gap: "2vw", minHeight: 0, padding: "1vh 0" }}>
            {selectedIsBreak ? (
              <div style={{ flex: "0 0 42%", display: "flex" }}>
                <button
                  data-routine={selected}
                  className="routine-card selected"
                  onClick={() => setSelected("")}
                  style={{ flex: 1, cursor: "pointer" }}
                >
                  <div className="routine-card-accent" />
                  <div className="routine-card-body">
                    <div className="routine-card-name">{selectedRoutine?.name}</div>
                    <div className="routine-card-desc">{selectedRoutine?.description}</div>
                  </div>
                  <span style={X_BUTTON_STYLE}>✕</span>
                </button>
              </div>
            ) : selectedSpot ? (
              <div style={{ flex: "0 0 42%", display: "flex" }}>
                <button
                  className="routine-card selected"
                  style={{
                    flex: 1,
                    cursor: "pointer",
                    background: selectedSpot.activeBg,
                    borderColor: selectedSpot.color,
                    boxShadow: `0 0 0 3px ${selectedSpot.color}bb, 0 0 20px ${selectedSpot.color}cc, 0 0 40px ${selectedSpot.color}88`,
                  } as React.CSSProperties}
                  onClick={() => setSelected("")}
                >
                  <div className="routine-card-accent" style={{ background: selectedSpot.color }} />
                  <div className="routine-card-body">
                    <div className="routine-card-name" style={{ color: selectedSpot.color, textShadow: `0 0 8px ${selectedSpot.color}cc, 0 0 20px ${selectedSpot.color}aa` }}>
                      {selectedSpot.label} vom Spot
                    </div>
                    <div className="routine-card-desc" style={{ display: "block", color: "#ccc" }}>
                      {selectedRoutine?.description}
                    </div>
                  </div>
                  <span style={X_BUTTON_STYLE}>✕</span>
                </button>
              </div>
            ) : null}
            {explanationPanel}
          </div>
        ) : (
          /* ── Overview: all routines ── */
          <>
            <div className="routine-picker-grid">
              {BREAK_ROUTINES.map((r) => (
                <button
                  key={r.id}
                  data-routine={r.id}
                  className="routine-card"
                  onClick={() => handleSelectBreak(r.id)}
                >
                  <div className="routine-card-accent" />
                  <div className="routine-card-body">
                    <div className="routine-card-name">{r.name}</div>
                    <div className="routine-card-desc">{r.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="routine-picker-spot">
              <span className="routine-picker-spot-label">Vom Spot:</span>
              <div className="routine-picker-spot-buttons">
                {SPOT_COLORS.map((sc) => (
                  <button
                    key={sc.id}
                    className="routine-picker-spot-btn"
                    style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                    onClick={() => setSelected(sc.id)}
                    type="button"
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {(showReds || showBallCount || showRedToggle) && (
          <div className="routine-picker-reds">
            {showRedToggle ? (
              <>
                <span className="routine-picker-reds-label">Anzahl Rote:</span>
                <div className="routine-picker-ball-toggle">
                  <button className={`routine-picker-ball-btn${redToggle === 5 ? " active" : ""}`} onClick={() => setRedToggle(5)} type="button">5 Rote</button>
                  <span className="routine-picker-ball-or">oder</span>
                  <button className={`routine-picker-ball-btn${redToggle === 10 ? " active" : ""}`} onClick={() => setRedToggle(10)} type="button">10 Rote</button>
                  <span className="routine-picker-ball-or">oder</span>
                  <button className={`routine-picker-ball-btn${redToggle === 15 ? " active" : ""}`} onClick={() => setRedToggle(15)} type="button">15 Rote</button>
                </div>
              </>
            ) : showBallCount ? (
              <>
                <span className="routine-picker-reds-label">Anzahl Bälle:</span>
                <div className="routine-picker-ball-toggle">
                  <button className={`routine-picker-ball-btn${ballCount === 15 ? " active" : ""}`} onClick={() => setBallCount(15)} type="button">15 Bälle</button>
                  <span className="routine-picker-ball-or">oder</span>
                  <button className={`routine-picker-ball-btn${ballCount === 21 ? " active" : ""}`} onClick={() => setBallCount(21)} type="button">21 Bälle</button>
                </div>
              </>
            ) : (
              <>
                <span className="routine-picker-reds-label">Anzahl Rote:</span>
                <button className="routine-picker-reds-btn" onClick={() => setRedsCount((v) => Math.max(minReds, v - 1))} type="button">−</button>
                <span className="routine-picker-reds-value">{redsCount}</span>
                <button className="routine-picker-reds-btn" onClick={() => setRedsCount((v) => Math.min(15, v + 1))} type="button">+</button>
              </>
            )}
          </div>
        )}

        <div className="routine-picker-actions">
          <button className="routine-picker-cancel" onClick={selected ? () => setSelected("") : onCancel}>
            Zurück
          </button>
          <button
            className={`routine-picker-start ${!selected ? "disabled" : "frame-end-btn-glow"}`}
            onClick={() => selected && onStart(selected, showBallCount ? ballCount : showRedToggle ? redToggle : redsCount)}
            disabled={!selected}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
