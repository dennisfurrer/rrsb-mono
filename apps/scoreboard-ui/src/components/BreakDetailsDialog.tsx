import { useRef, useState } from "react";
import {
  BALL_COLORS,
  FOUL_TYPES,
  LONG_TYPES,
  POCKETS,
  type BallColor,
  type FoulType,
  type LongType,
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

const TABLE_POCKETS: { id: Pocket; num: number; cx: number; cy: number }[] = [
  { id: "corner-green",        num: 1, cx: 14,  cy: 14  },
  { id: "middle-green",        num: 2, cx: 220, cy: 14  },
  { id: "corner-black-green",  num: 3, cx: 426, cy: 14  },
  { id: "corner-black-yellow", num: 4, cx: 426, cy: 176 },
  { id: "middle-yellow",       num: 5, cx: 220, cy: 176 },
  { id: "corner-yellow",       num: 6, cx: 14,  cy: 176 },
];

function SnookerTablePicker({ pocket, onToggle, pocketLabel }: { pocket: Pocket | null; onToggle: (p: Pocket) => void; pocketLabel?: string }) {
  const baulkX = 117, midY = 95, dR = 25;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ textAlign: "center", color: "#ffcc00", fontSize: "1.1vw", minHeight: "1.6vw" }}>
        {pocketLabel ?? ""}
      </div>
      <svg viewBox="-14 -14 468 218" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", maxHeight: "30vh", display: "block" }}>
        <rect x={0} y={0} width={440} height={190} rx={8} fill="#5a3010" />
        <rect x={14} y={14} width={412} height={162} fill="#1e7828" />
        <line x1={baulkX} y1={14} x2={baulkX} y2={176} stroke="rgba(255,255,255,0.4)" strokeWidth={2.25} />
        <path d={`M ${baulkX} ${midY - dR} A ${dR} ${dR} 0 0 0 ${baulkX} ${midY + dR}`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2.25} />
        <circle cx={baulkX} cy={midY - dR} r={6} fill="#27a84a" />
        <circle cx={baulkX} cy={midY}       r={6} fill="#8b5e3c" />
        <circle cx={baulkX} cy={midY + dR}  r={6} fill="#f0c020" />
        <circle cx={220}    cy={midY}       r={6} fill="#2255cc" />
        <circle cx={324}    cy={midY}       r={6} fill="#e060a0" />
        <circle cx={393}    cy={midY}       r={6} fill="#222" stroke="#88888844" strokeWidth={1} />
        {TABLE_POCKETS.map(({ id, num, cx, cy }) => {
          const sel = pocket === id;
          return (
            <g key={id} onClick={() => onToggle(id)} style={{ cursor: "pointer" }}>
              <circle cx={cx} cy={cy} r={28} fill={sel ? "#ffcc00" : "#0c0c0c"} stroke={sel ? "#ffcc00" : "#555"} strokeWidth={1.5} />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={22} fontWeight="bold" fill={sel ? "#000" : "#ddd"}>{num}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

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
    longType?: LongType;
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
  const [distanzOn, setDistanzOn] = useState(false);
  const [longType, setLongType] = useState<LongType | null>(null);
  const [ballOn, setBallOn] = useState(false);
  const [ball, setBall] = useState<BallColor | null>(null);
  const [foulOn, setFoulOn] = useState(false);
  const [foulType, setFoulType] = useState<FoulType | null>(null);
  const [pocket, setPocket] = useState<Pocket | null>(null);
  const foulSelectRef = useRef<HTMLSelectElement>(null);
  const longSelectRef = useRef<HTMLSelectElement>(null);

  const toggle = <T,>(current: T | null, value: T): T | null =>
    current === value ? null : value;

  const toggleDistanz = () => {
    if (distanzOn) {
      setDistanzOn(false);
    } else {
      setDistanzOn(true);
      if (longType === null) setLongType("ball-easy-long");
      requestAnimationFrame(() => {
        const el = longSelectRef.current;
        if (el && "showPicker" in el) {
          try { (el as HTMLSelectElement & { showPicker: () => void }).showPicker(); } catch { /* unsupported */ }
        }
      });
    }
  };

  const toggleBall = () => {
    setBallOn((prev) => !prev);
  };

  const toggleFoul = () => {
    if (foulOn) {
      setFoulOn(false);
    } else {
      setFoulOn(true);
      if (foulType === null) setFoulType("white-potted");
      requestAnimationFrame(() => {
        const el = foulSelectRef.current;
        if (el && "showPicker" in el) {
          try { (el as HTMLSelectElement & { showPicker: () => void }).showPicker(); } catch { /* unsupported */ }
        }
      });
    }
  };

  const handleSave = () => {
    const missType = foulOn ? "foul" : distanzOn ? "long" : ballOn ? "easy" : undefined;
    onSave({
      missType,
      foulType: foulOn ? foulType ?? undefined : undefined,
      longType: distanzOn ? longType ?? undefined : undefined,
      ball: ballOn ? ball ?? undefined : undefined,
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

        <div className="break-details-section" style={{ flex: "0 0 auto" }}>
          <div className="break-details-section-label">Fehlerursache</div>
          <div style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>

            {/* Distanz-Karte */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.6vh",
              border: `1.5px solid ${distanzOn ? "#55cc33" : "#333"}`,
              borderRadius: "8px",
              padding: "0.5vh 0.7vw",
              background: distanzOn ? "rgba(40,80,15,0.35)" : "transparent",
              transition: "border-color 0.15s, background 0.15s",
            }}>
              <button className={`break-pill break-pill-miss ${distanzOn ? "selected" : ""}`} style={{ flex: "none", width: "100%" }} onClick={toggleDistanz}>Ball-Distanz</button>
              {distanzOn && (
                <select ref={longSelectRef} className="break-long-select" style={{ margin: 0, width: "100%", alignSelf: "auto" }} value={longType ?? ""} onChange={(e) => setLongType((e.target.value || null) as LongType | null)}>
                  {LONG_TYPES.map((l) => (<option key={l.id} value={l.id}>{l.label}</option>))}
                </select>
              )}
            </div>

            {/* Ball-Karte */}
            <div style={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.6vh",
              border: `1.5px solid ${ballOn ? "#55cc33" : "#333"}`,
              borderRadius: "8px",
              padding: "0.5vh 0.7vw",
              background: ballOn ? "rgba(40,80,15,0.35)" : "transparent",
              transition: "border-color 0.15s, background 0.15s",
            }}>
              <button className={`break-pill break-pill-miss ${ballOn ? "selected" : ""}`} style={{ flex: "none", width: "100%" }} onClick={toggleBall}>Ball</button>
              <div style={{ display: "flex", gap: "0.5vw" }}>
                {BALL_COLORS.map((b) => (
                  <button key={b.id} onClick={() => { const next = ball === b.id ? null : b.id; setBall(next); setBallOn(next !== null); }} style={{
                    background: ball === b.id ? b.bg : "transparent",
                    border: `2px solid ${ball === b.id ? b.fg : "#555"}`,
                    borderRadius: "50%",
                    padding: "0.25vw",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: ball === b.id ? `0 0 8px ${b.fg}88` : "none",
                    flexShrink: 0,
                  }}>
                    <BallDot color={BALL_ICON_COLOR[b.id]} label={b.label} size="2.4vw" />
                  </button>
                ))}
              </div>
            </div>

            {/* Foul-Karte */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.6vh",
              border: `1.5px solid ${foulOn ? "#cc3333" : "#333"}`,
              borderRadius: "8px",
              padding: "0.5vh 0.7vw",
              background: foulOn ? "rgba(80,15,15,0.4)" : "transparent",
              transition: "border-color 0.15s, background 0.15s",
            }}>
              <button className={`break-pill break-pill-miss break-pill-foul ${foulOn ? "selected" : ""}`} style={{ flex: "none", width: "100%" }} onClick={toggleFoul}>Foul</button>
              {foulOn && (
                <select ref={foulSelectRef} className="break-foul-select" style={{ margin: 0, width: "100%", alignSelf: "auto" }} value={foulType ?? ""} onChange={(e) => setFoulType((e.target.value || null) as FoulType | null)}>
                  {FOUL_TYPES.map((f) => (<option key={f.id} value={f.id}>{f.label}</option>))}
                </select>
              )}
            </div>

          </div>
        </div>

        <div className="break-details-section" style={{ flex: 1 }}>
          <div className="break-details-section-label">Welches Loch?</div>
          <SnookerTablePicker
            pocket={pocket}
            onToggle={(p) => setPocket((c) => toggle(c, p))}
            pocketLabel={pocket ? (() => { const p = POCKETS.find(x => x.id === pocket); return p ? `${p.num} – ${p.fullLabel}` : undefined; })() : undefined}
          />
        </div>


        <div className="break-details-actions">
          <button className="break-details-back" onClick={onBack}>
            Zurück
          </button>
          <button
            className={`break-details-save ${distanzOn || ballOn || foulOn || ball || pocket ? "frame-end-btn-glow" : ""}`}
            onClick={handleSave}
          >
            Eintragen
          </button>
        </div>
      </div>
    </div>
  );
}
