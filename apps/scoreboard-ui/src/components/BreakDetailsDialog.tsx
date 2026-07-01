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
  const [distanzOn, setDistanzOn] = useState(false);
  const [longType, setLongType] = useState<LongType | null>(null);
  const [ballOn, setBallOn] = useState(false);
  const [ball, setBall] = useState<BallColor | null>(null);
  const [foulOn, setFoulOn] = useState(false);
  const [foulType, setFoulType] = useState<FoulType | null>(null);
  const [pocket, setPocket] = useState<Pocket | null>(null);
  const [effectX, setEffectX] = useState<number>(6);
  const [effectY, setEffectY] = useState<number>(6);
  const [ballDistance, setBallDistance] = useState<number>(6);
  const [shotStrength, setShotStrength] = useState<number>(6);
  const foulSelectRef = useRef<HTMLSelectElement>(null);
  const longSelectRef = useRef<HTMLSelectElement>(null);

  const dotCx = 50 + ((effectX - 6) / 6) * 32.9;
  const dotCy = 50 - ((effectY - 6) / 6) * 32.9;

  const isDragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingDist = useRef(false);
  const distBarRef = useRef<HTMLDivElement>(null);
  const isDraggingStrength = useRef(false);
  const strengthBarRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width * 100;
    const y = (clientY - rect.top) / rect.height * 100;
    const LIMIT = 32.9;
    let dx = x - 50;
    let dy = y - 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > LIMIT) { dx = dx / dist * LIMIT; dy = dy / dist * LIMIT; }
    setEffectX(Math.round((dx / LIMIT + 1) / 2 * 12));
    setEffectY(Math.round((-dy / LIMIT + 1) / 2 * 12));
  };

  useEffect(() => {
    const onUp = () => {
      isDragging.current = false;
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
      effectX,
      effectY,
      ballDistance,
      shotStrength,
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
          <div style={{ width: "25%", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5vh", marginLeft: "auto", marginRight: "1vw", marginTop: "-3.5vh" }}>
            <div style={{ color: "#88aacc", fontSize: "1.6vw", fontWeight: "bold", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "left", paddingLeft: "1.5vw" }}>
              Stoss-Daten
            </div>

            {/* Weisser Ball + Stoss-Stärke */}
            {/* Ball + Stoss-Stärke nebeneinander, gleiche Höhe */}
            <div style={{ display: "flex", flex: 1, gap: "0.4vw", alignItems: "stretch", minHeight: 0 }}>
              <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                style={{ flex: 1, cursor: "crosshair", display: "block", userSelect: "none" }}
                onMouseDown={(e) => { isDragging.current = true; updateFromPointer(e.clientX, e.clientY); }}
                onMouseMove={(e) => { if (isDragging.current) updateFromPointer(e.clientX, e.clientY); }}
                onMouseUp={() => { isDragging.current = false; }}
                onTouchStart={(e) => { isDragging.current = true; updateFromPointer(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchMove={(e) => { updateFromPointer(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchEnd={() => { isDragging.current = false; }}
              >
                <circle cx={52} cy={52} r={46} fill="rgba(0,0,0,0.18)" />
                <circle cx={50} cy={50} r={46} fill="#f8f8f8" stroke="#ccc" strokeWidth={0.5} />
                <ellipse cx={37} cy={33} rx={9} ry={6} fill="rgba(255,255,255,0.55)" transform="rotate(-20 37 33)" />
                <line x1={50} y1={7} x2={50} y2={93} stroke="rgba(180,180,180,0.25)" strokeWidth={0.5} />
                <line x1={7} y1={50} x2={93} y2={50} stroke="rgba(180,180,180,0.25)" strokeWidth={0.5} />
                <circle cx={dotCx} cy={dotCy} r={8} fill="#1a1a1a" />
              </svg>

              {/* Stoss-Stärke: Pfeile + Balken auf Ballhöhe, Wert darunter */}
              <div style={{ width: "2.3vw", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2vh" }}>
                <button onClick={() => setShotStrength(prev => Math.min(12, prev + 1))} style={{ width: "100%", background: "#2a2a2a", color: "#ffee44", border: "1px solid #555", borderRadius: "3px", padding: "0.2vh 0", fontSize: "0.9vw", cursor: "pointer", lineHeight: 1 }}>▲</button>
                <div
                  ref={strengthBarRef}
                  style={{ flex: 1, width: "100%", background: "#ffee44", borderRadius: "3px", overflow: "hidden", position: "relative", cursor: "ns-resize" }}
                  onMouseDown={(e) => { isDraggingStrength.current = true; const rect = e.currentTarget.getBoundingClientRect(); setShotStrength(Math.round(Math.max(0, Math.min(12, (1 - (e.clientY - rect.top) / rect.height) * 12)))); }}
                  onTouchStart={(e) => { isDraggingStrength.current = true; const rect = e.currentTarget.getBoundingClientRect(); setShotStrength(Math.round(Math.max(0, Math.min(12, (1 - (e.touches[0].clientY - rect.top) / rect.height) * 12)))); }}
                  onTouchMove={(e) => { if (!strengthBarRef.current) return; const rect = strengthBarRef.current.getBoundingClientRect(); setShotStrength(Math.round(Math.max(0, Math.min(12, (1 - (e.touches[0].clientY - rect.top) / rect.height) * 12)))); }}
                  onTouchEnd={() => { isDraggingStrength.current = false; }}
                >
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${(shotStrength / 12) * 100}%`, background: "rgba(200,140,0,0.45)", transition: "height 0.15s" }} />
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "1.4vw", fontWeight: "bold", color: "#333", userSelect: "none", pointerEvents: "none" }}>Stoss-Stärke</span>
                </div>
                <button onClick={() => setShotStrength(prev => Math.max(0, prev - 1))} style={{ width: "100%", background: "#2a2a2a", color: "#ffee44", border: "1px solid #555", borderRadius: "3px", padding: "0.2vh 0", fontSize: "0.9vw", cursor: "pointer", lineHeight: 1 }}>▼</button>
              </div>
            </div>

            {/* Ball-Distanz + Stoss-Wert unterhalb */}
            <div style={{ display: "flex", gap: "0.4vw", alignItems: "center" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.15vh" }}>
                <div style={{ display: "flex", alignItems: "stretch", gap: "0.2vw" }}>
                  <button onClick={() => setBallDistance(prev => Math.max(0, prev - 1))} style={{ background: "#2a2a2a", color: "#ffee44", border: "1px solid #555", borderRadius: "3px", padding: "0 0.4vw", fontSize: "0.9vw", cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>◀</button>
                  <div
                    ref={distBarRef}
                    style={{ flex: 1, background: "#ffee44", borderRadius: "3px", overflow: "hidden", position: "relative", padding: "0.4vh", cursor: "ew-resize" }}
                    onMouseDown={(e) => { isDraggingDist.current = true; const rect = e.currentTarget.getBoundingClientRect(); setBallDistance(Math.round(Math.max(0, Math.min(12, (e.clientX - rect.left) / rect.width * 12)))); }}
                    onTouchStart={(e) => { isDraggingDist.current = true; const rect = e.currentTarget.getBoundingClientRect(); setBallDistance(Math.round(Math.max(0, Math.min(12, (e.touches[0].clientX - rect.left) / rect.width * 12)))); }}
                    onTouchMove={(e) => { if (!distBarRef.current) return; const rect = distBarRef.current.getBoundingClientRect(); setBallDistance(Math.round(Math.max(0, Math.min(12, (e.touches[0].clientX - rect.left) / rect.width * 12)))); }}
                    onTouchEnd={() => { isDraggingDist.current = false; }}
                  >
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${(ballDistance / 12) * 100}%`, background: "rgba(200,140,0,0.45)", transition: "width 0.15s" }} />
                    <span style={{ position: "relative", zIndex: 1, fontWeight: "bold", color: "#333", fontSize: "1.4vw", display: "block", textAlign: "center", pointerEvents: "none" }}>Ball-Distanz</span>
                  </div>
                  <button onClick={() => setBallDistance(prev => Math.min(12, prev + 1))} style={{ background: "#2a2a2a", color: "#ffee44", border: "1px solid #555", borderRadius: "3px", padding: "0 0.4vw", fontSize: "0.9vw", cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>▶</button>
                </div>
                <div style={{ textAlign: "center", color: "#bbb", fontSize: "1.4vw" }}>~{(ballDistance + 1) * 30} cm</div>
              </div>
              <span style={{ width: "2.3vw", flexShrink: 0, textAlign: "center", color: "#ffee44", fontSize: "1.4vw", fontWeight: "bold", alignSelf: "flex-start", marginTop: "0.2vh" }}>{shotStrength}</span>
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
    </div>
  );
}
