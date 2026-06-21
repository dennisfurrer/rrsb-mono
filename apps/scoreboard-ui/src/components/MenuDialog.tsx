import { useState, useRef, useEffect } from "react";

function AutoTextButton({ children, className, onClick, style, disabled }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const btn = ref.current;
    if (!btn) return;
    btn.style.fontSize = "";
    void btn.offsetHeight;
    if (btn.scrollHeight <= btn.offsetHeight + 2) return;
    let fs = parseFloat(getComputedStyle(btn).fontSize);
    while (fs > 8) {
      fs -= 0.5;
      btn.style.fontSize = `${fs}px`;
      void btn.offsetHeight;
      if (btn.scrollHeight <= btn.offsetHeight + 2) break;
    }
  }, []);

  return (
    <button ref={ref} className={className} onClick={onClick} style={style} disabled={disabled}>
      <span style={{ display: "block", width: "100%" }}>{children}</span>
    </button>
  );
}

function FitWidthText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.fontSize = "";
    void el.offsetWidth;
    let fs = parseFloat(getComputedStyle(el).fontSize);
    while (fs > 6 && el.scrollWidth > el.clientWidth + 1) {
      fs -= 0.5;
      el.style.fontSize = `${fs}px`;
    }
  }, [text]);

  return (
    <span style={{ display: "block", width: "100%", fontSize: "0.5em", fontWeight: "normal" }}>
      <span ref={ref} style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden" }}>
        {text}
      </span>
    </span>
  );
}

function RedsTriangleIcon({ size = "1em", style }: { size?: string; style?: React.CSSProperties }) {
  const radius = 3.2;
  const spacing = 7.5;
  const circles: { cx: number; cy: number }[] = [];
  [1, 2, 3, 4, 5].forEach((count, r) => {
    const cy = 6 + r * spacing;
    for (let i = 0; i < count; i++) {
      circles.push({ cx: 25 + (i - (count - 1) / 2) * spacing, cy });
    }
  });
  return (
    <svg viewBox="0 0 50 48" style={{ width: size, height: size, display: "inline-block", ...style }}>
      {circles.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={radius} fill="#dd2222" />
      ))}
    </svg>
  );
}

function SnookerTableIcon({ size = "1em", style }: { size?: string; style?: React.CSSProperties }) {
  const cx = 16;
  const ballR = 0.8;
  const rowDy = ballR * Math.sqrt(3); // vertical spacing so diagonal neighbours touch
  const colDx = ballR * 2; // horizontal spacing so same-row neighbours touch
  const apexCy = 17.25;
  const redRows: { cy: number; count: number }[] = [
    { cy: apexCy - 4 * rowDy, count: 5 },
    { cy: apexCy - 3 * rowDy, count: 4 },
    { cy: apexCy - 2 * rowDy, count: 3 },
    { cy: apexCy - 1 * rowDy, count: 2 },
    { cy: apexCy, count: 1 },
  ];
  const redDots = redRows.flatMap((row, ri) =>
    Array.from({ length: row.count }, (_, i) => ({
      key: `${ri}-${i}`,
      cx: cx + (i - (row.count - 1) / 2) * colDx,
      cy: row.cy,
    }))
  );

  return (
    <svg viewBox="0 0 32 60" style={{ width: size, height: size, display: "inline-block", ...style }}>
      {/* Wooden rail */}
      <rect x={1} y={1} width={30} height={58} rx={3} fill="#6a3a18" />
      {/* Cushions */}
      <rect x={4} y={4} width={24} height={52} rx={1.5} fill="#0e5c28" />
      {/* Baize playing surface */}
      <rect x={5} y={5} width={22} height={50} rx={1.2} fill="#1a8a3a" />

      {/* Baulk line + D */}
      <line x1={5} y1={45} x2={27} y2={45} stroke="#eee" strokeWidth={0.2} opacity={0.85} />
      <path d="M 12 45 A 4 4 0 0 0 20 45" fill="none" stroke="#eee" strokeWidth={0.2} opacity={0.85} />

      {/* Pockets */}
      {[[4.5, 4.5], [27.5, 4.5], [4.5, 55.5], [27.5, 55.5], [4.5, 30], [27.5, 30]].map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={1.4} fill="#0a0a0a" />
      ))}

      {/* Colour spots */}
      <circle cx={cx} cy={45} r={ballR} fill="#7a4a1e" />{/* brown */}
      <circle cx={cx - 4} cy={45} r={ballR} fill="#1f9e4a" />{/* green */}
      <circle cx={cx + 4} cy={45} r={ballR} fill="#f0c020" />{/* yellow */}
      <circle cx={cx} cy={30} r={ballR} fill="#2255cc" />{/* blue */}
      <circle cx={cx} cy={19} r={ballR} fill="#ff77b3" />{/* pink */}
      <circle cx={cx} cy={8} r={ballR} fill="#111" />{/* black */}

      {/* Reds triangle */}
      {redDots.map((d) => (
        <circle key={d.key} cx={d.cx} cy={d.cy} r={ballR} fill="#dd2222" />
      ))}

      {/* Cue ball resting in the D */}
      <circle cx={cx + 1.8} cy={46.3} r={ballR} fill="#f4f4f4" />
    </svg>
  );
}

function BallIcon({ size = "1em", style, fill = "#dd2222", highlight = "#ff9999", lines }: { size?: string; style?: React.CSSProperties; fill?: string; highlight?: string; lines?: string[] }) {
  return (
    <svg viewBox="0 0 20 20" style={{ width: size, height: size, display: "inline-block", ...style }}>
      <circle cx={10} cy={10} r={9} fill={fill} stroke="#0006" strokeWidth={0.6} />
      <circle cx={7.3} cy={6.8} r={2.2} fill={highlight} opacity={0.6} />
      {lines?.map((line, i) => (
        <text
          key={line}
          x={10}
          y={10 + (i - (lines.length - 1) / 2) * 4.6 + 1.5}
          textAnchor="middle"
          fontSize={3.6}
          fontWeight="bold"
          fontFamily="sans-serif"
          fill="#111"
        >
          {line}
        </text>
      ))}
    </svg>
  );
}

function FinishFlagIcon({ size = "1em", style }: { size?: string; style?: React.CSSProperties }) {
  const flagX = 4, flagY = 1, flagW = 12.6, flagH = 8;
  const cols = 5, rows = 4;
  const cellW = flagW / cols;
  const cellH = flagH / rows;
  const cells: { x: number; y: number; dark: boolean }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ x: flagX + c * cellW, y: flagY + r * cellH, dark: (r + c) % 2 === 0 });
    }
  }
  return (
    <svg viewBox="0 0 20 20" style={{ width: size, height: size, display: "inline-block", ...style }}>
      <rect x={2.6} y={1} width={1.4} height={18} fill="#ccc" />
      {cells.map((cell, i) => (
        <rect key={i} x={cell.x} y={cell.y} width={cellW} height={cellH} fill={cell.dark ? "#111" : "#eee"} />
      ))}
    </svg>
  );
}

function UndoArrowIcon({ size = "1em", style }: { size?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, display: "inline-block", ...style }}>
      <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill="currentColor" />
    </svg>
  );
}

function RedoArrowIcon({ size = "1em", style }: { size?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, display: "inline-block", ...style }}>
      <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" fill="currentColor" />
    </svg>
  );
}

interface Props {
  onUndo?: () => void;
  onRedo?: () => void;
  onFrameEnd?: () => void;
  isFrameTied?: boolean;
  onRerack: () => void;
  onMatchEnd?: () => void;
  onNewGame: () => void;
  onClose: () => void;
  frameLeader: string;
  matchLeader: string;
  framesP1: number;
  framesP2: number;
  nameP1: string;
  nameP2: string;
  colorP1?: string;
  colorP2?: string;
  matchFinished: boolean;
  hasEntries: boolean;
  bestOf: number;
  isFrameStart: boolean;
  onChangeBestOf?: (newBestOf: number) => void;
}

export function MenuDialog({
  onUndo,
  onRedo,
  onFrameEnd,
  isFrameTied,
  onRerack,
  onMatchEnd,
  onNewGame,
  onClose,
  frameLeader,
  matchLeader,
  framesP1,
  framesP2,
  nameP1,
  nameP2,
  colorP1,
  colorP2,
  matchFinished,
  hasEntries,
  bestOf,
  isFrameStart,
  onChangeBestOf,
}: Props) {
  const [confirmMatchEnd, setConfirmMatchEnd] = useState(false);
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const [confirmRerack, setConfirmRerack] = useState(false);
  const [pendingBestOf, setPendingBestOf] = useState(bestOf);
  const [showBestOfInfo, setShowBestOfInfo] = useState(false);

  const newBestOf = framesP1 + framesP2;
  const isTied = framesP1 === framesP2;
  const p1Wins = framesP1 > framesP2;
  const frameEndActive = onFrameEnd !== undefined && !isFrameTied;
  const matchEndActive = !!onMatchEnd;

  if (confirmMatchEnd && onMatchEnd) {
    return (
      <div className="overlay" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#2a2a2a",
            borderRadius: "12px",
            padding: "3.5vh 3vw 3vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2.5vh",
            width: "52vw",
          }}
        >
          <div style={{ color: "#ddd", fontSize: "2.8vw", fontWeight: "bold", textAlign: "center" }}>
            Match wirklich mit folgendem Ergebnis vorzeitig beenden?
          </div>
          <div
            style={{
              width: "100%",
              background: "#1a1a1a",
              borderRadius: "8px",
              padding: "2vh 2vw",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                fontSize: "2.2vw",
                fontWeight: "bold",
              }}
            >
              {/* Left name */}
              <span style={{ color: colorP1 ?? "#5599ff", flex: 1, textAlign: "left", display: "flex", alignItems: "center", gap: "0.5vw", overflow: "hidden", minWidth: 0 }}>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nameP1}</span>
                {p1Wins && <span style={{ fontSize: "55%", lineHeight: 1, flexShrink: 0 }}>🏆</span>}
              </span>
              {/* Center: scores + bestOf */}
              <div style={{
                display: "flex",
                alignItems: "center",
                background: "#111",
                borderRadius: "6px",
                padding: "0.5vh 1vw",
                gap: "0.8vw",
              }}>
                <span style={{ color: isTied ? "#ffee44" : (p1Wins ? "#ffee44" : "#777"), fontSize: "2.8vw" }}>
                  {framesP1}
                </span>
                <span style={{ color: "#fff", fontSize: "1.6vw" }}>
                  ({newBestOf})
                </span>
                <span style={{ color: isTied ? "#ffee44" : (p1Wins ? "#777" : "#ffee44"), fontSize: "2.8vw" }}>
                  {framesP2}
                </span>
              </div>
              {/* Right name */}
              <span style={{ color: colorP2 ?? "#ff8833", flex: 1, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5vw", overflow: "hidden", minWidth: 0 }}>
                {!isTied && !p1Wins && <span style={{ fontSize: "55%", lineHeight: 1, flexShrink: 0 }}>🏆</span>}
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nameP2}</span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "2vw", width: "100%" }}>
            <button
              className="bbb-btn-ok"
              onClick={onMatchEnd}
              style={{
                flex: 1,
                padding: "2.5vh 0",
                fontSize: "2.5vw",
                fontWeight: "bold",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#1a5c1a",
                color: "#4ade80",
              }}
            >
              Ja
            </button>
            <button
              className="bbb-btn-cancel"
              onClick={() => setConfirmMatchEnd(false)}
              style={{
                flex: 1,
                padding: "2.5vh 0",
                fontSize: "2.5vw",
                fontWeight: "bold",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#7a1a1a",
                color: "#f87171",
              }}
            >
              Nein
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (confirmNewGame) {
    return (
      <div className="overlay" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#2a2a2a",
            borderRadius: "12px",
            padding: "3.5vh 3vw 3vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2.5vh",
            width: "52vw",
          }}
        >
          <div style={{ color: "#fff", fontSize: "3.16vw", fontWeight: "bold", textAlign: "center" }}>
            Neues Spiel starten?
          </div>
          <div style={{ color: "#aaa", fontSize: "2vw", textAlign: "center" }}>
            Das laufende Spiel wird beendet. Alle Daten gehen verloren und können nicht rückgängig gemacht werden.<br /><br />Willst du wirklich ein neues Spiel starten?
          </div>
          <div style={{ display: "flex", gap: "2vw", width: "100%" }}>
            <button
              onClick={onNewGame}
              className="bbb-btn-ok"
              style={{
                flex: 1,
                padding: "2.5vh 0",
                fontSize: "2.5vw",
                fontWeight: "bold",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#1a5c1a",
                color: "#4ade80",
              }}
            >
              Ja
            </button>
            <button
              onClick={() => setConfirmNewGame(false)}
              className="bbb-btn-cancel"
              style={{
                flex: 1,
                padding: "2.5vh 0",
                fontSize: "2.5vw",
                fontWeight: "bold",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#7a1a1a",
                color: "#f87171",
              }}
            >
              Nein
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (confirmRerack) {
    return (
      <div className="overlay" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#2a2a2a",
            borderRadius: "12px",
            padding: "3.5vh 3vw 3vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2.5vh",
            width: "52vw",
          }}
        >
          <div style={{ color: "#fff", fontSize: "3.16vw", fontWeight: "bold", textAlign: "center" }}>
            Re-rack wirklich ausführen?
          </div>
          <div style={{ color: "#aaa", fontSize: "2vw", textAlign: "center" }}>
            Alle Bälle werden neu aufgestellt. Das aktuelle Break wird beendet und kann nicht rückgängig gemacht werden.
          </div>
          <div style={{ display: "flex", gap: "2vw", width: "100%" }}>
            <button
              onClick={onRerack}
              style={{
                flex: 1,
                padding: "2.5vh 0",
                fontSize: "2.5vw",
                fontWeight: "bold",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#1a5c1a",
                color: "#4ade80",
              }}
            >
              Ja
            </button>
            <button
              onClick={() => setConfirmRerack(false)}
              style={{
                flex: 1,
                padding: "2.5vh 0",
                fontSize: "2.5vw",
                fontWeight: "bold",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#7a1a1a",
                color: "#f87171",
              }}
            >
              Nein
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalFrames = framesP1 + framesP2;
  const showAdjuster = onChangeBestOf && (matchFinished || isFrameStart);
  const pendingChanged = pendingBestOf !== bestOf;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="menu-fullscreen" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "1.5vh", borderBottom: "1px solid #2a2a2a", marginBottom: "0.4vh" }}>
          <span style={{ color: "#555", fontSize: "1.2vw", fontWeight: "bold", letterSpacing: "0.18em", textTransform: "uppercase" }}>Menu</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#555", fontSize: "1.6vw", cursor: "pointer", padding: "0 0.3vw", lineHeight: 1, minHeight: "unset", height: "auto" }}
          >✕</button>
        </div>
        <AutoTextButton className="menu-btn-new-game" onClick={matchFinished || !hasEntries ? onNewGame : () => setConfirmNewGame(true)}>
          <span style={{ display: "grid", gridTemplateColumns: "2em 1fr", gridTemplateRows: "auto auto", columnGap: "0.4em", alignItems: "center", width: "100%" }}>
            <SnookerTableIcon style={{ gridRow: "span 2", height: "2.4em", width: "auto", justifySelf: "center" }} />
            <span>New game</span>
            <FitWidthText text="Neues Spiel starten" />
          </span>
        </AutoTextButton>
        {!matchFinished && (
          <AutoTextButton className="menu-btn-rerack" onClick={() => setConfirmRerack(true)}>
            <span style={{ display: "grid", gridTemplateColumns: "2em 1fr", gridTemplateRows: "auto auto", columnGap: "0.4em", alignItems: "center", width: "100%" }}>
              <span style={{ gridRow: "span 2", position: "relative", height: "2.4em", width: "auto", justifySelf: "center", display: "inline-block", transform: "translateY(0.4em)" }}>
                <RedsTriangleIcon style={{ height: "100%", width: "auto" }} />
                <UndoArrowIcon
                  size="1.5em"
                  style={{ position: "absolute", top: "4%", left: "50%", transform: "translate(-57.5%, -50%)", color: "#5599ff" }}
                />
              </span>
              <span>Re-rack</span>
              <FitWidthText text="Laufenden Frame neu starten" />
            </span>
          </AutoTextButton>
        )}
        {(frameEndActive || matchEndActive) && (
          <div style={{ display: "flex", gap: "0.8vw" }}>
            {frameEndActive ? (
              <AutoTextButton
                className="menu-btn-frame-end"
                onClick={onFrameEnd}
                style={{ flex: 1 }}
              >
                <span style={{ display: "grid", gridTemplateColumns: "2em 1fr", gridTemplateRows: "auto auto", columnGap: "0.4em", alignItems: "center", width: "100%" }}>
                  <BallIcon fill="#f4f4f4" highlight="#ffffff" lines={["END", "FRAME"]} style={{ gridRow: "span 2", height: "2.4em", width: "auto", justifySelf: "center" }} />
                  <span>Frame-Ende</span>
                  <FitWidthText text={`${frameLeader} gewinnt Frame`} />
                </span>
              </AutoTextButton>
            ) : (
              <AutoTextButton
                className="menu-btn-match-end"
                style={{ flex: 1, background: "#265c26", color: "#00e600" }}
                onClick={() => setConfirmMatchEnd(true)}
              >
                <span style={{ display: "grid", gridTemplateColumns: "2em 1fr", gridTemplateRows: "auto auto", columnGap: "0.4em", alignItems: "center", width: "100%" }}>
                  <FinishFlagIcon style={{ gridRow: "span 2", height: "2.4em", width: "auto", justifySelf: "center" }} />
                  <span>Match-Ende</span>
                  <FitWidthText text={isTied ? "Spiel endet Unentschieden" : `Spiel endet ${framesP1}:${framesP2} für ${matchLeader}`} />
                </span>
              </AutoTextButton>
            )}
          </div>
        )}
        {(onUndo || onRedo) && (
          <div style={{ display: "flex", gap: "0.8vw" }}>
            <AutoTextButton
              className="menu-btn-undo"
              style={{ flex: 1, ...(!onUndo ? { opacity: 0.3, cursor: "not-allowed" } : {}) }}
              onClick={onUndo}
              disabled={!onUndo}
            >
              <span style={{ display: "grid", gridTemplateColumns: "2em 1fr", gridTemplateRows: "auto auto", columnGap: "0.4em", alignItems: "center", width: "100%" }}>
                <UndoArrowIcon style={{ gridRow: "span 2", height: "2.4em", width: "auto", justifySelf: "center" }} />
                <span>Undo</span>
                <FitWidthText text="Letzte Eingabe löschen" />
              </span>
            </AutoTextButton>
            <AutoTextButton
              className="menu-btn-redo"
              style={{ flex: 1, background: "#1a3a1a", color: "#4ade80", borderColor: "#2a5a2a", ...(!onRedo ? { opacity: 0.3, cursor: "not-allowed" } : {}) }}
              onClick={onRedo}
              disabled={!onRedo}
            >
              <span style={{ display: "grid", gridTemplateColumns: "2em 1fr", gridTemplateRows: "auto auto", columnGap: "0.4em", alignItems: "center", width: "100%" }}>
                <RedoArrowIcon style={{ gridRow: "span 2", height: "2.4em", width: "auto", justifySelf: "center" }} />
                <span>Redo</span>
                <FitWidthText text="Gelöschtes wiederherstellen." />
              </span>
            </AutoTextButton>
          </div>
        )}
        {showAdjuster && (
          <div style={{
            background: "#0c0e1a",
            border: "1.5px solid #224488",
            borderRadius: "10px",
            padding: "2vh 2vw",
            display: "flex",
            flexDirection: "column",
            gap: "1.4vh",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                <span style={{ color: "#8899cc", fontSize: "1.5vw", fontWeight: "bold", whiteSpace: "nowrap" }}>
                  Ausspielziel ändern
                </span>
                <button
                  className="menu-btn-info"
                  onClick={(e) => { e.stopPropagation(); setShowBestOfInfo(true); }}
                  type="button"
                  style={{ background: "#1a3a6a", color: "#66aaff", border: "1.5px solid #3366aa", borderRadius: "50%", width: "1.8vw", height: "1.8vw", fontSize: "1vw", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
                >
                  ?
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <button
                  className="menu-btn-bestof"
                  onClick={() => setPendingBestOf((v) => Math.max(totalFrames, v - 1))}
                  disabled={pendingBestOf <= totalFrames}
                  style={{ background: "#2a2a3a", color: "#ccc", border: "1px solid #555", borderRadius: "6px", fontSize: "1.6vw", fontWeight: "bold", padding: "0.6vh 1.2vw", cursor: "pointer", width: "auto", textAlign: "center", height: "auto" }}
                >
                  −
                </button>
                <span style={{ color: pendingChanged ? "#f0c040" : "#fff", fontSize: "1.7vw", fontWeight: "bold", minWidth: "5.5vw", textAlign: "center", whiteSpace: "nowrap" }}>
                  Best of {pendingBestOf}
                </span>
                <button
                  className="menu-btn-bestof"
                  onClick={() => setPendingBestOf((v) => v + 1)}
                  style={{ background: "#2a2a3a", color: "#ccc", border: "1px solid #555", borderRadius: "6px", fontSize: "1.6vw", fontWeight: "bold", padding: "0.6vh 1.2vw", cursor: "pointer", width: "auto", textAlign: "center", height: "auto" }}
                >
                  +
                </button>
              </div>
            </div>
            {pendingChanged && (
              <div style={{ display: "flex", gap: "1vw" }}>
                <button
                  className="bbb-btn-cancel"
                  onClick={() => setPendingBestOf(bestOf)}
                  style={{ flex: 1, background: "#3a1a1a", color: "#f87171", border: "none", borderRadius: "6px", fontSize: "1.8vw", fontWeight: "bold", padding: "0.8vh 0", cursor: "pointer", width: "auto", textAlign: "center", height: "auto" }}
                >
                  Abbrechen
                </button>
                <button
                  className="bbb-btn-ok"
                  onClick={() => { onChangeBestOf(pendingBestOf); }}
                  style={{ flex: 1, background: "#1a5c1a", color: "#4ade80", border: "none", borderRadius: "6px", fontSize: "1.8vw", fontWeight: "bold", padding: "0.8vh 0", cursor: "pointer", width: "auto", textAlign: "center", height: "auto" }}
                >
                  OK
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showBestOfInfo && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowBestOfInfo(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1a1e2e", border: "1px solid #3366aa", borderRadius: "14px", padding: "4vh 3.5vw", width: "58vw", display: "flex", flexDirection: "column", gap: "2.5vh" }}
          >
            <div style={{ color: "#66aaff", fontSize: "2.2vw", fontWeight: "bold" }}>
              Ausspielziel
            </div>
            <div style={{ color: "#ccc", fontSize: "1.75vw", lineHeight: 1.75 }}>
              <strong style={{ color: "#fff" }}>Gerade Frameanzahl</strong> (Best of 2, 4, 6 …)<br />
              Alle Frames werden gespielt – auch wenn ein Sieger rechnerisch schon vorher feststeht.
            </div>
            <div style={{ color: "#ccc", fontSize: "1.75vw", lineHeight: 1.75 }}>
              <strong style={{ color: "#fff" }}>Ungerade Frameanzahl</strong> (Best of 3, 5, 7 …)<br />
              Das Spiel endet, sobald ein Spieler die Mehrheit der Frames gewonnen hat und der Gegner rechnerisch nicht mehr aufholen kann.
            </div>
            <button
              className="menu-btn-info"
              onClick={() => setShowBestOfInfo(false)}
              style={{ alignSelf: "center", padding: "1.2vh 4vw", fontSize: "1.7vw", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: "#1a3a6a", color: "#66aaff", fontFamily: "inherit", marginTop: "0.5vh" }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
