import { useEffect, useRef, useState } from "react";
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


const DISTANCE_LEVELS = [
  { value: 1, label: "<10 cm" },
  { value: 2, label: "10-30 cm" },
  { value: 3, label: "30-60 cm" },
  { value: 4, label: "60-100 cm" },
  { value: 5, label: "100-150 cm" },
  { value: 6, label: "150-200 cm" },
  { value: 7, label: "200-300 cm" },
  { value: 8, label: ">300 cm" },
];

const STRENGTH_LEVELS = [
  { value: 5, label: "Sehr stark",   color: "#e67e22" },
  { value: 4, label: "Stark",        color: "#f1c40f" },
  { value: 3, label: "Normal",       color: "#2ecc71" },
  { value: 2, label: "Schwach",      color: "#3498db" },
  { value: 1, label: "Sehr schwach", color: "#9b59b6" },
];

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
      <svg viewBox="-14 -14 468 218" preserveAspectRatio="xMinYMid meet" style={{ width: "100%", maxHeight: "30vh", display: "block" }}>
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
    effectX?: number;
    effectY?: number;
    ballDistance?: number;
    shotStrength?: number;
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
  const [showStossHelp, setShowStossHelp] = useState(false);
  const [distanzOn, setDistanzOn] = useState(false);
  const [longType, setLongType] = useState<LongType | null>(null);
  const [ballOn, setBallOn] = useState(false);
  const [ball, setBall] = useState<BallColor | null>(null);
  const [foulOn, setFoulOn] = useState(false);
  const [foulType, setFoulType] = useState<FoulType | null>(null);
  const [pocket, setPocket] = useState<Pocket | null>(null);
  const [effectX, setEffectX] = useState<number | null>(null);
  const [effectY, setEffectY] = useState<number | null>(null);
  const [ballDistance, setBallDistance] = useState<number | null>(null);
  const [shotStrength, setShotStrength] = useState<number | null>(null);
  const foulSelectRef = useRef<HTMLSelectElement>(null);
  const longSelectRef = useRef<HTMLSelectElement>(null);

  const isDraggingDist = useRef(false);
  const distBarRef = useRef<HTMLDivElement>(null);
  const isDraggingStrength = useRef(false);
  const strengthBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onUp = () => {
      isDraggingDist.current = false;
      isDraggingStrength.current = false;
    };
    const onMove = (e: MouseEvent) => {
      if (isDraggingDist.current && distBarRef.current) {
        const rect = distBarRef.current.getBoundingClientRect();
        setBallDistance(Math.round(Math.max(0, Math.min(12, (e.clientX - rect.left) / rect.width * 12))));
      }
      if (isDraggingStrength.current && strengthBarRef.current) {
        const rect = strengthBarRef.current.getBoundingClientRect();
        setShotStrength(Math.round(Math.max(0, Math.min(12, (1 - (e.clientY - rect.top) / rect.height) * 12))));
      }
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mouseup", onUp); window.removeEventListener("mousemove", onMove); };
  }, []);

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
      effectX: effectX ?? undefined,
      effectY: effectY ?? undefined,
      ballDistance: ballDistance ?? undefined,
      shotStrength: shotStrength ?? undefined,
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

        <div className="break-details-section" style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "1vw" }}>
          <div style={{ width: "55%" }}>
            <div className="break-details-section-label">Welches Loch?</div>
            <SnookerTablePicker
              pocket={pocket}
              onToggle={(p) => setPocket((c) => toggle(c, p))}
              pocketLabel={pocket ? (() => { const p = POCKETS.find(x => x.id === pocket); return p ? `${p.num} – ${p.fullLabel}` : undefined; })() : undefined}
            />
          </div>
          <div style={{ width: "25%", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5vh", marginLeft: "auto", marginRight: "0.5vw", marginTop: "-3.5vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4vw", paddingLeft: "1.5vw" }}>
              <span style={{ color: "#88aacc", fontSize: "1.6vw", fontWeight: "bold", letterSpacing: "0.08em", textTransform: "uppercase" }}>Stoss-Daten</span>
              <button onClick={() => setShowStossHelp(true)} style={{ background: "none", border: "2px solid #3399ff", borderRadius: "50%", cursor: "pointer", color: "#3399ff", fontSize: "1.1vw", fontWeight: "900", lineHeight: 1, width: "1.8vw", height: "1.8vw", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>?</button>
            </div>

            {/* Weisser Ball + Stoss-Stärke */}
            {/* Ball + Stoss-Stärke nebeneinander, gleiche Höhe */}
            <div style={{ display: "flex", flex: 1, gap: "0.4vw", alignItems: "stretch", minHeight: 0 }}>
              {/* 5×5 Effet-Grid */}
              <div style={{ flex: 1, aspectRatio: "1", position: "relative", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "repeat(5, 1fr)", background: "radial-gradient(ellipse at 38% 32%, #e8e8e8 0%, #cccccc 35%, #929292 65%, #5a5a5a 100%)", borderRadius: "50%", border: "1px solid #555", padding: "9%", gap: "10%", overflow: "hidden", boxShadow: "3px 4px 16px rgba(0,0,0,0.7), inset -3px -3px 10px rgba(0,0,0,0.25), inset 2px 2px 6px rgba(255,255,255,0.15)" }}>
                {/* Licht-Highlight oben links */}
                <div style={{ position: "absolute", top: "6%", left: "8%", width: "38%", height: "32%", background: "radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none", zIndex: 3 }} />
                <div style={{ position: "absolute", top: "50%", left: "9%", right: "9%", height: "2px", background: "#22aa44", transform: "translateY(-50%)", zIndex: 0 }} />
                <div style={{ position: "absolute", left: "50%", top: "9%", bottom: "9%", width: "2px", background: "#22aa44", transform: "translateX(-50%)", zIndex: 0 }} />
                {Array.from({ length: 25 }, (_, i) => {
                  const row = Math.floor(i / 5);
                  const col = i % 5;
                  const gx = col + 1;
                  const gy = 5 - row;
                  const isCorner = (row === 0 || row === 4) && (col === 0 || col === 4);
                  if (isCorner) return <div key={i} />;
                  const isSelected = effectX === gx && effectY === gy;
                  const isCenter = col === 2 && row === 2;
                  const dx = col - 2; const dy = row - 2;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const scale = 1 - (dist / 2.83) * 0.28;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (isSelected) { setEffectX(null); setEffectY(null); }
                        else { setEffectX(gx); setEffectY(gy); }
                      }}
                      style={{
                        borderRadius: "50%",
                        background: isSelected ? "#ffee44" : isCenter ? "#2a2a3a" : "#2e2e40",
                        border: isSelected ? "2px solid #ffaa00" : "1px solid rgba(0,0,0,0.5)",
                        cursor: "pointer",
                        boxShadow: isSelected ? "0 0 8px rgba(255,238,68,0.9)" : "inset 0 1px 2px rgba(255,255,255,0.12)",
                        position: "relative",
                        zIndex: 1,
                        transform: `scale(${scale})`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Stoss-Stärke: 5 Stufen + Label rechts */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "row", alignItems: "stretch", position: "relative" }}>
                <div style={{ width: "2.3vw", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2vh" }}>
                  <button onClick={() => setShotStrength(prev => Math.min(5, (prev ?? 0) + 1))} style={{ width: "100%", background: "#2a2a2a", color: "#ffee44", border: "1px solid #555", borderRadius: "3px", padding: "0.2vh 0", fontSize: "0.9vw", cursor: "pointer", lineHeight: 1 }}>▲</button>
                  <div
                    ref={strengthBarRef}
                    style={{ flex: 1, width: "100%", background: "#ffee44", borderRadius: "3px", overflow: "hidden", position: "relative", cursor: "ns-resize" }}
                    onMouseDown={(e) => { isDraggingStrength.current = true; const rect = e.currentTarget.getBoundingClientRect(); const lvl = 5 - Math.floor(((e.clientY - rect.top) / rect.height) * 5); setShotStrength(Math.max(1, Math.min(5, lvl))); }}
                    onTouchStart={(e) => { isDraggingStrength.current = true; const rect = e.currentTarget.getBoundingClientRect(); const lvl = 5 - Math.floor(((e.touches[0].clientY - rect.top) / rect.height) * 5); setShotStrength(Math.max(1, Math.min(5, lvl))); }}
                    onTouchMove={(e) => { if (!strengthBarRef.current) return; const rect = strengthBarRef.current.getBoundingClientRect(); const lvl = 5 - Math.floor(((e.touches[0].clientY - rect.top) / rect.height) * 5); setShotStrength(Math.max(1, Math.min(5, lvl))); }}
                    onTouchEnd={() => { isDraggingStrength.current = false; }}
                  >
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${shotStrength ? (shotStrength * 2 - 1) * 10 : 0}%`, background: STRENGTH_LEVELS.find(l => l.value === shotStrength)?.color ?? "transparent", transition: "height 0.15s, background 0.15s" }} />
                    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "1.4vw", fontWeight: "bold", color: "#333", userSelect: "none", pointerEvents: "none" }}>Stoss-Stärke</span>
                  </div>
                  <button onClick={() => setShotStrength(prev => prev === null ? null : prev <= 1 ? null : prev - 1)} style={{ width: "100%", background: "#2a2a2a", color: "#ffee44", border: "1px solid #555", borderRadius: "3px", padding: "0.2vh 0", fontSize: "0.9vw", cursor: "pointer", lineHeight: 1 }}>▼</button>
                </div>
                {/* Vertikales Label */}
                <div style={{ position: "absolute", left: "calc(100% + 0.3vw)", top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {shotStrength && (() => { const lvl = STRENGTH_LEVELS.find(l => l.value === shotStrength); return lvl ? <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: lvl.color, fontSize: "1.4vw", fontWeight: "bold", whiteSpace: "nowrap" }}>{lvl.label}</span> : null; })()}
                </div>
              </div>
            </div>

            {/* Ball-Distanz + Stoss-Wert unterhalb */}
            <div style={{ display: "flex", gap: "0.4vw", alignItems: "center" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.15vh" }}>
                <div style={{ display: "flex", alignItems: "stretch", gap: "0.2vw" }}>
                  <button onClick={() => setBallDistance(prev => prev === null ? null : prev <= 1 ? null : prev - 1)} style={{ background: "#2a2a2a", color: "#ffee44", border: "1px solid #555", borderRadius: "3px", padding: "0 0.4vw", fontSize: "0.9vw", cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>◀</button>
                  <div
                    ref={distBarRef}
                    style={{ flex: 1, background: "#ffee44", borderRadius: "3px", overflow: "hidden", position: "relative", padding: "0.4vh", cursor: "ew-resize" }}
                    onMouseDown={(e) => { isDraggingDist.current = true; const rect = e.currentTarget.getBoundingClientRect(); setBallDistance(Math.max(1, Math.min(8, Math.ceil((e.clientX - rect.left) / rect.width * 8)))); }}
                    onTouchStart={(e) => { isDraggingDist.current = true; const rect = e.currentTarget.getBoundingClientRect(); setBallDistance(Math.max(1, Math.min(8, Math.ceil((e.touches[0].clientX - rect.left) / rect.width * 8)))); }}
                    onTouchMove={(e) => { if (!distBarRef.current) return; const rect = distBarRef.current.getBoundingClientRect(); setBallDistance(Math.max(1, Math.min(8, Math.ceil((e.touches[0].clientX - rect.left) / rect.width * 8)))); }}
                    onTouchEnd={() => { isDraggingDist.current = false; }}
                  >
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${ballDistance ? (ballDistance / 8) * 100 : 0}%`, background: "rgba(200,140,0,0.45)", transition: "width 0.15s" }} />
                    <span style={{ position: "relative", zIndex: 1, fontWeight: "bold", color: "#333", fontSize: "1.4vw", display: "block", textAlign: "center", pointerEvents: "none" }}>Ball-Distanz</span>
                  </div>
                  <button onClick={() => setBallDistance(prev => Math.min(8, (prev ?? 0) + 1))} style={{ background: "#2a2a2a", color: "#ffee44", border: "1px solid #555", borderRadius: "3px", padding: "0 0.4vw", fontSize: "0.9vw", cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>▶</button>
                </div>
                <div style={{ textAlign: "center", color: "#bbb", fontSize: "1.4vw" }}>{ballDistance ? DISTANCE_LEVELS[ballDistance - 1].label : ""}</div>
              </div>
            </div>
          </div>
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

      {showStossHelp && (
        <div className="overlay" onClick={(e) => { e.stopPropagation(); setShowStossHelp(false); }} style={{ zIndex: 200 }}>
          <div style={{ background: "linear-gradient(160deg, #1a1a2a 0%, #12121e 100%)", border: "1px solid #334", borderRadius: "16px", padding: "2vh 2vw", maxWidth: "52vw", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#88aacc", fontSize: "1.4vw", fontWeight: "bold", letterSpacing: "0.08em", textTransform: "uppercase" }}>Stoss-Daten – Erklärung</span>
              <button onClick={() => setShowStossHelp(false)} style={{ background: "none", border: "none", color: "#888", fontSize: "1.4vw", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
              <div>
                <div style={{ color: "#ffee44", fontSize: "1.1vw", fontWeight: "bold", marginBottom: "0.3vh" }}>Effet (5×5 Gitter)</div>
                <div style={{ color: "#ccc", fontSize: "1.35vw", lineHeight: 1.5 }}>
                  Markiere deine Cue-Treffposition auf dem weissen Spielball.<br />
                  • Die Mitte bedeutet kein Effet.<br />
                  • Links/Rechts = Seiteneffet (je weiter links/rechts, je stärker der Effet).<br />
                  • Oben = Topspin (Mitläufer – Weiss rollt nach Ballkontakt weiter vorwärts).<br />
                  • Unten = Backspin (Rücklaufer – Weiss rollt nach Kontakt zurück).
                </div>
              </div>
              <div style={{ borderTop: "1px solid #2a2a3a", paddingTop: "1vh" }}>
                <div style={{ color: "#ffee44", fontSize: "1.1vw", fontWeight: "bold", marginBottom: "0.3vh" }}>Ball-Distanz</div>
                <div style={{ color: "#ccc", fontSize: "1.35vw", lineHeight: 1.5 }}>
                  Geschätzter Abstand zwischen Weiss und Objektball beim Stoss.<br />
                  Mit ◀/▶ oder Ziehen auf dem Balken Distanz wählen.
                </div>
              </div>
              <div style={{ borderTop: "1px solid #2a2a3a", paddingTop: "1vh" }}>
                <div style={{ color: "#ffee44", fontSize: "1.1vw", fontWeight: "bold", marginBottom: "0.3vh" }}>Stoss-Stärke</div>
                <div style={{ color: "#ccc", fontSize: "1.35vw", lineHeight: 1.5 }}>
                  Aufgewendete Stärke in den Stoss.<br />
                  Es gibt fünf Stufen:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2vh", marginTop: "0.4vh" }}>
                  {STRENGTH_LEVELS.slice().reverse().map(lvl => (
                    <div key={lvl.value} style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                      <div style={{ width: "0.7vw", height: "0.7vw", borderRadius: "50%", background: lvl.color, flexShrink: 0 }} />
                      <span style={{ color: lvl.color, fontSize: "1.3vw", fontWeight: "bold" }}>{lvl.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
