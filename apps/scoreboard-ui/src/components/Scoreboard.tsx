import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { MatchState } from "../lib/model";
import { useAutoFontSize } from "../hooks/useAutoFontSize";
import { useApiStatus } from "../lib/connection";
import { VERSION } from "../version";
import { DancingSmiley } from "./DancingSmiley";

interface Props {
  match: MatchState;
  onPlayerClick: (playerIndex: number) => void;
  onMenuClick: () => void;
  onBreaksClick: (playerIndex: number) => void;
  onCenterClick?: () => void;
  history: { label: string; color?: string; playerIndex?: 0 | 1; kind?: string; frameNumber?: number }[];
  centerName?: string;
  matchStartTime?: string;
  matchEndTime?: string;
  matchFinished?: boolean;
  playerColors?: [string | null, string | null];
  onColorChange?: (playerIndex: 0 | 1, color: string) => void;
  onEditLastBreak?: () => void;
  onRemoteClick?: (playerIndex: 0 | 1) => void;
  remoteConnected?: [boolean, boolean];
}

/** Small QR-glyph icon for the remote-scorer button. */
function QrGlyph({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 29 29" width="1.6vw" height="1.6vw" shapeRendering="crispEdges" aria-hidden="true">
      <path
        fill={color}
        d="M0 0h7v7H0zM2 2v3h3V2zM22 0h7v7h-7zM24 2v3h3V2zM0 22h7v7H0zM2 24v3h3v-3zM9 0h2v2H9zM12 0h2v4h-2zM9 4h3v2H9zM16 2h2v2h-2zM9 9h2v2H9zM0 9h2v2H0zM4 9h3v2H4zM18 9h2v2h-2zM22 9h3v2h-3zM27 9h2v2h-2zM14 7h2v3h-2zM9 13h4v2H9zM0 13h2v3H0zM15 13h2v2h-2zM19 13h2v2h-2zM23 13h2v2h-2zM27 13h2v3h-2zM9 16h2v3H9zM13 17h2v2h-2zM17 16h3v2h-3zM22 17h2v2h-2zM25 16h2v2h-2zM9 22h2v2H9zM12 22h3v2h-3zM16 22h2v3h-2zM20 22h3v2h-3zM25 22h3v2h-3zM9 26h3v3H9zM14 26h2v3h-2zM18 26h2v3h-2zM22 26h2v3h-2zM26 26h3v3h-3z"
      />
    </svg>
  );
}

const PALETTE_DARK = [
  "#cc0022", "#800020", "#cc4400", "#7c4a2a",
  "#4a2a10", "#998800", "#aaaa00", "#448800",
  "#004d1a", "#007744", "#006688", "#3377aa",
  "#1a3fa0", "#5500aa", "#cc0066", "#777777",
];

const PALETTE_LIGHT = [
  "#ff4455", "#cc3355", "#ff8844", "#cd7f32",
  "#996633", "#ffd700", "#ffee55", "#88ff00",
  "#006828", "#00c878", "#00ced1", "#87ceeb",
  "#4169e1", "#8b00ff", "#ff69b4", "#c0c0c0",
];

function adjustColor(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  const r = clamp(((n >> 16) & 0xff) * f);
  const g = clamp(((n >> 8) & 0xff) * f);
  const b = clamp((n & 0xff) * f);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function resolveColor(own: string | null, other: string | null, lighter: boolean): string | undefined {
  if (!own) return undefined;
  return own === other ? adjustColor(own, lighter ? 1.7 : 0.5) : own;
}

function colorDistance(a: string, b: string): number {
  const p = (h: string) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [r1,g1,b1] = p(a); const [r2,g2,b2] = p(b);
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

function isGrayish(hex: string): boolean {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return Math.max(r,g,b) - Math.min(r,g,b) < 40;
}

function nameGlowStyle(color: string | undefined): CSSProperties | undefined {
  if (!color) return undefined;
  return {
    color,
    textShadow: `0 0 4px ${color}cc, 0 0 10px ${color}88, 0 0 20px ${color}44`,
  };
}

function AutoSize({
  text,
  deps,
  className,
  scale,
  style,
  containerRef,
}: {
  text: string;
  deps: unknown[];
  className?: string;
  scale?: number;
  style?: CSSProperties;
  containerRef?: React.RefObject<HTMLElement>;
}) {
  const ref = useAutoFontSize(deps, scale, containerRef);
  return (
    <div ref={ref} className={className} style={style}>
      {text}
    </div>
  );
}

function formatMatchDuration(startIso: string, endIso?: string): string {
  const ms = (endIso ? new Date(endIso).getTime() : Date.now()) - new Date(startIso).getTime();
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const SCORE_SCALE = 1.32;

function DigitSlot({ value, animDuration = 5 }: { value: number; animDuration?: number }) {
  const [curr, setCurr] = useState(value);
  const [prev, setPrev] = useState(value);
  const [animKey, setAnimKey] = useState(-1);

  useEffect(() => {
    if (value !== curr) {
      setPrev(curr);
      setCurr(value);
      setAnimKey(k => k + 1);
    }
  }, [value, curr]);

  return (
    <span className="sb-digit-wrap">
      {animKey < 0 ? (
        <span className="sb-secs-digit">{curr}</span>
      ) : (
        <span
          key={animKey}
          className="sb-digit-tick"
          style={{ animationDuration: `${animDuration}s` }}
          onAnimationEnd={() => setAnimKey(-1)}
        >
          <span className="sb-secs-digit">{curr}</span>
          <span className="sb-secs-digit">{prev}</span>
        </span>
      )}
    </span>
  );
}

export function Scoreboard({ match, onPlayerClick, onMenuClick, onBreaksClick, onCenterClick, history, centerName, matchStartTime, matchEndTime, matchFinished, playerColors, onColorChange, onEditLastBreak, onRemoteClick, remoteConnected }: Props) {
  const apiStatus = useApiStatus();
  const [p1, p2] = match.players;
  const p1Active = match.activePlayerIndex === 0;
  const p2Active = match.activePlayerIndex === 1;
  const historyRef = useRef<HTMLDivElement>(null);
  const p1NameRowRef = useRef<HTMLDivElement>(null);
  const p2NameRowRef = useRef<HTMLDivElement>(null);
  const p1NameTextRef = useRef<HTMLDivElement>(null);
  const p2NameTextRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [secsAnimDelay, setSecsAnimDelay] = useState("0s");
  const [showFinishedHint, setShowFinishedHint] = useState(false);
  const [colorPickerFor, setColorPickerFor] = useState<0 | 1 | null>(null);

  const [p1Raw, p2Raw] = playerColors ?? [null, null];
  const effP1Color = resolveColor(p1Raw, p2Raw, true);
  const effP2Color = resolveColor(p2Raw, p1Raw, false);
  const eitherGrayish = (effP1Color ? isGrayish(effP1Color) : false) || (effP2Color ? isGrayish(effP2Color) : false);
  const neutralCandidates = eitherGrayish ? ["#ffee44", "#88ff88"] : ["#ffffff", "#ffee44", "#88ff88"];
  const neutralColor = neutralCandidates.find(c => {
    const d1 = effP1Color ? colorDistance(c, effP1Color) : Infinity;
    const d2 = effP2Color ? colorDistance(c, effP2Color) : Infinity;
    return d1 >= 90 && d2 >= 90;
  }) ?? "#88ff88";
  const noScores = p1.score === 0 && p2.score === 0;

  const pickColor = (idx: 0 | 1, color: string) => {
    onColorChange?.(idx, color);
    setColorPickerFor(null);
  };

  // Shared font-size for both score fields
  const p1ScoreRef = useRef<HTMLDivElement>(null);
  const p2ScoreRef = useRef<HTMLDivElement>(null);

  const resizeScores = useCallback(() => {
    const p1El = p1ScoreRef.current;
    const p2El = p2ScoreRef.current;
    if (!p1El || !p2El) return;

    // Reset forced width so binary search uses natural content width
    p1El.style.width = "";
    p2El.style.width = "";

    const computeSize = (el: HTMLDivElement) => {
      const parent = el.parentElement;
      if (!parent) return 500;
      const maxW = parent.clientWidth * 0.95 * SCORE_SCALE;
      const maxH = parent.clientHeight * 0.9 * SCORE_SCALE;
      el.style.height = "auto";
      let lo = 8, hi = 500;
      while (lo < hi - 1) {
        const mid = Math.floor((lo + hi) / 2);
        el.style.fontSize = `${mid}px`;
        if (el.offsetWidth <= maxW && el.offsetHeight <= maxH) lo = mid;
        else hi = mid;
      }
      el.style.height = "";
      return lo;
    };

    const shared = Math.min(computeSize(p1El), computeSize(p2El));
    p1El.style.fontSize = `${shared}px`;
    p2El.style.fontSize = `${shared}px`;

    // Equalize box widths so gray backgrounds are the same size on both sides
    const equalW = Math.max(p1El.offsetWidth, p2El.offsetWidth);
    p1El.style.width = `${equalW}px`;
    p2El.style.width = `${equalW}px`;
  }, []);

  useEffect(() => {
    resizeScores();
    window.addEventListener("resize", resizeScores);
    return () => window.removeEventListener("resize", resizeScores);
  }, [resizeScores, p1.score, p2.score]);

  const resizeNames = useCallback(() => {
    const p1El = p1NameTextRef.current;
    const p2El = p2NameTextRef.current;
    const p1Row = p1NameRowRef.current;
    const p2Row = p2NameRowRef.current;
    if (!p1El || !p2El || !p1Row || !p2Row) return;

    const computeSize = (el: HTMLDivElement, row: HTMLDivElement) => {
      const maxW = row.clientWidth * 0.95 * 0.88;
      const maxH = row.clientHeight * 0.9 * 0.88;
      if (maxW <= 0 || maxH <= 0) return 500;
      el.style.height = "auto";
      let lo = 8, hi = 500;
      while (lo < hi - 1) {
        const mid = Math.floor((lo + hi) / 2);
        el.style.fontSize = `${mid}px`;
        if (el.offsetWidth <= maxW && el.offsetHeight <= maxH) lo = mid;
        else hi = mid;
      }
      el.style.height = "";
      return lo;
    };

    const shared = Math.min(computeSize(p1El, p1Row), computeSize(p2El, p2Row));
    p1El.style.fontSize = `${shared}px`;
    p2El.style.fontSize = `${shared}px`;
  }, []);

  useEffect(() => {
    resizeNames();
    window.addEventListener("resize", resizeNames);
    return () => window.removeEventListener("resize", resizeNames);
  }, [resizeNames, p1.name, p2.name, effP1Color, effP2Color]);

  useEffect(() => {
    if (!matchStartTime || matchEndTime) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [matchStartTime, matchEndTime]);

  useEffect(() => {
    if (!matchStartTime || matchEndTime) return;
    const elapsed = Date.now() - new Date(matchStartTime).getTime();
    const secsInMinute = (elapsed % 60000) / 1000;
    setSecsAnimDelay(`-${secsInMinute.toFixed(3)}s`);
  }, [matchStartTime, matchEndTime]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollLeft = historyRef.current.scrollWidth;
    }
  }, [history]);

  const elapsedMs = matchStartTime
    ? (matchEndTime ? new Date(matchEndTime).getTime() : Date.now()) - new Date(matchStartTime).getTime()
    : 0;
  const durationMins = Math.floor(elapsedMs / 60000);
  const totalHours = Math.floor(durationMins / 60);
  const minutesMod = durationMins % 60;

  // Pre-trigger minute/hour digits 5 s before the rollover so they glide in sync with the seconds strip
  const secsInMinute = matchEndTime ? 0 : Math.floor((elapsedMs % 60000) / 1000);
  const preTransition = secsInMinute >= 55;
  const nextMinutesMod = (minutesMod + 1) % 60;
  const nextTotalHours = minutesMod === 59 ? totalHours + 1 : totalHours;

  const dispMinsTens = preTransition ? Math.floor(nextMinutesMod / 10) : Math.floor(minutesMod / 10);
  const dispMinsUnits = preTransition ? nextMinutesMod % 10 : minutesMod % 10;
  const dispHoursTens = (preTransition && minutesMod === 59) ? Math.floor((nextTotalHours % 100) / 10) : Math.floor(totalHours / 10);
  const dispHoursUnits = (preTransition && minutesMod === 59) ? nextTotalHours % 10 : totalHours % 10;

  return (
    <div className="scoreboard">
      {match.matchType && (
        <div style={{
          position: "fixed",
          top: "2.5vh",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "2vw",
          color: "#aaa",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          pointerEvents: "none",
          zIndex: 10,
        }}>
          {match.matchType}
        </div>
      )}
      {match.bbState?.respottedBlack && !match.bbState.frameOver && !match.finished && (
        <div style={{
          position: "fixed",
          top: "0.6vh",
          left: 0,
          right: 0,
          zIndex: 500,
          textAlign: "center",
          background: "#111",
          borderTop: "2px solid #f0c040",
          borderBottom: "2px solid #f0c040",
          padding: "0.8vh 0",
          fontSize: "2.2vw",
          fontWeight: "bold",
          color: "#f0c040",
          letterSpacing: "0.12em",
          pointerEvents: "none",
        }}>
          ⚫ RE-SPOTTED BLACK
        </div>
      )}
      {showFinishedHint && (
        <div className="overlay" onClick={() => setShowFinishedHint(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#2a2a2a",
              borderRadius: "12px",
              padding: "3vh 3vw",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2vh",
              width: "44vw",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#ffee44", fontSize: "2.4vw", fontWeight: "bold" }}>
              Partie beendet!
            </div>
            <div style={{ color: "#aaa", fontSize: "1.7vw", lineHeight: 1.4 }}>
              Wähle im <span style={{ color: "#fff", fontWeight: "bold" }}>Menu</span> die Option <span style={{ color: "#fff", fontWeight: "bold" }}>Neues Spiel</span> — oder passe das <span style={{ color: "#fff", fontWeight: "bold" }}>Ausspielziel</span> an, um weiterzuspielen.
            </div>
            <button
              onClick={() => setShowFinishedHint(false)}
              style={{
                marginTop: "0.5vh",
                padding: "1.2vh 4vw",
                fontSize: "1.8vw",
                fontWeight: "bold",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#1a5c1a",
                color: "#4ade80",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {colorPickerFor !== null && (
        <div className="sb-color-backdrop" onClick={() => setColorPickerFor(null)} />
      )}
      <div className="sb-main">
        {/* Left 40% */}
        <div className="sb-left" onClick={() => {
          if (matchFinished) { setShowFinishedHint(true); return; }
          onPlayerClick(0);
        }}>
          <div
            ref={p1NameRowRef}
            className={`sb-name-row ${!p1Active ? "name-inactive" : ""}`}
          >
            <div className="sb-name-with-club sb-name-with-club--left">
              <div ref={p1NameTextRef} className="name-text lc" style={nameGlowStyle(effP1Color)}>{p1.name}</div>
              <div className="sb-club-name" style={effP1Color ? { color: effP1Color } : undefined}>{(p1.club && p1.club !== "?") ? p1.club : "Club ?"}</div>
            </div>
            {noScores && !matchFinished && (
              <button
                onClick={(e) => { e.stopPropagation(); setColorPickerFor(prev => prev === 0 ? null : 0); }}
                style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "0.8vw", background: "none", border: "none", cursor: "pointer", fontSize: "1.6vw", opacity: 0.55, padding: 0, lineHeight: 1, color: effP1Color ?? "#5599ff" }}
              >
                ✎
              </button>
            )}
            {onRemoteClick && !matchFinished && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemoteClick(0); }}
                title="Fernbedienung (Handy)"
                style={{ position: "absolute", bottom: "calc(0.4vh + 1cm + 2vw)", left: "0.8vw", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0, opacity: 0.8, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4vh" }}
              >
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <QrGlyph color={effP1Color ?? "#5599ff"} />
                  {remoteConnected?.[0] && (
                    <span style={{ position: "absolute", top: "-0.2vw", right: "-0.2vw", width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                  )}
                </span>
                <span
                  className="sb-active-dot"
                  style={{
                    width: "1.6vw", height: "1.6vw", borderRadius: "50%",
                    opacity: (remoteConnected?.[0] || remoteConnected?.[1]) && match.activePlayerIndex === 0 ? 1 : 0,
                  }}
                />
              </button>
            )}
          </div>
          {colorPickerFor === 0 && (
            <div className="sb-color-picker" onClick={e => e.stopPropagation()}>
              <div className="sb-color-picker-section">Dunkel</div>
              {PALETTE_DARK.map(c => {
                const display = p2Raw === c ? adjustColor(c, 1.7) : c;
                return (
                  <div key={c} className={`sb-color-swatch${p1Raw === display ? " sb-color-swatch--selected" : ""}`}
                    style={{ background: display }} onClick={() => pickColor(0, display)} />
                );
              })}
              <div className="sb-color-picker-section">Hell</div>
              {PALETTE_LIGHT.map(c => {
                const display = p2Raw === c ? adjustColor(c, 1.7) : c;
                return (
                  <div key={c} className={`sb-color-swatch${p1Raw === display ? " sb-color-swatch--selected" : ""}`}
                    style={{ background: display }} onClick={() => pickColor(0, display)} />
                );
              })}
            </div>
          )}
          <div className="sb-frames-row">
            <AutoSize text={String(p1.frames)} deps={[p1.frames]} className="frames-text lc" scale={1.32} />
          </div>
          <div className={`sb-score-row ${!p1Active ? "score-inactive" : ""}`}>
            <div ref={p1ScoreRef} className="score-text lc">{p1.score}</div>
          </div>
          <div
            className="sb-break-row sb-break-row-clickable"
            onClick={(e) => {
              e.stopPropagation();
              if (match.matchId) onBreaksClick(0);
            }}
          >
            <div className="break-text" style={{ color: effP1Color ?? "#5599ff" }}>
              {p1.highbreaks.slice(0, 5).join(", ")}
            </div>
          </div>
        </div>

        {/* Center 20% */}
        <div className="sb-center" onClick={onCenterClick} style={onCenterClick ? { cursor: "pointer" } : undefined}>
          <div className="sb-name-row sb-name-row-center" style={p1.winner ? { justifyContent: "flex-start" } : p2.winner ? { justifyContent: "flex-end" } : undefined}>
            {match.tableNumber && Number(match.tableNumber) > 0 && (
              <div className="sb-table-number">Tisch {match.tableNumber}</div>
            )}
            {centerName && <div className="sb-center-name">{centerName}</div>}
            {p1.winner && <DancingSmiley style={{ height: "48%" }} />}
            {p2.winner && <DancingSmiley style={{ height: "48%" }} />}
            {match.finished && !p1.winner && !p2.winner && (
              <div className="sb-draw-pulse" style={{ fontSize: "1.9vw", fontWeight: "bold", textAlign: "center", letterSpacing: "0.05em" }}>
                UNENTSCHIEDEN
              </div>
            )}
          </div>
          <div className="sb-frames-row sb-frames-row-center">
            <div>Frames</div>
            <div>({match.bestOf})</div>
          </div>
          <div className="sb-score-row sb-score-row-center">
            <div>Score</div>
            {matchStartTime && (
              <div className="sb-match-time">
                <div className="sb-match-time-label">Matchzeit</div>
                <div className="sb-match-time-value">
                  {matchEndTime ? (
                    formatMatchDuration(matchStartTime, matchEndTime)
                  ) : (
                    <>
                      <DigitSlot value={dispHoursTens} />
                      <DigitSlot value={dispHoursUnits} />
                      <span>:</span>
                      <DigitSlot value={dispMinsTens} />
                      <DigitSlot value={dispMinsUnits} />
                      <span className="sb-secs-wrap">
                        <span className="sb-secs-strip" style={{ animationDelay: secsAnimDelay }}>
                          {["00", ...Array.from({ length: 12 }, (_, i) => String(55 - i * 5).padStart(2, "0"))].map((d, i) => (
                            <span key={i} className="sb-secs-digit">{d}</span>
                          ))}
                        </span>
                      </span>
                    </>
                  )}
                </div>
                {durationMins >= 60 && (
                  <div className="sb-match-time-mins">{durationMins} Min.</div>
                )}
              </div>
            )}
          </div>
          <div className="sb-break-row sb-break-row-center">&laquo; Breaks &gt;7 &raquo;</div>
        </div>

        {/* Right 40% */}
        <div className="sb-right" onClick={() => {
          if (matchFinished) { setShowFinishedHint(true); return; }
          onPlayerClick(1);
        }}>
          <div
            ref={p2NameRowRef}
            className={`sb-name-row ${!p2Active ? "name-inactive" : ""}`}
          >
            <div className="sb-name-with-club sb-name-with-club--right">
              <div ref={p2NameTextRef} className="name-text rc" style={nameGlowStyle(effP2Color)}>{p2.name}</div>
              <div className="sb-club-name" style={effP2Color ? { color: effP2Color } : undefined}>{(p2.club && p2.club !== "?") ? p2.club : "Club ?"}</div>
            </div>
            {noScores && !matchFinished && (
              <button
                onClick={(e) => { e.stopPropagation(); setColorPickerFor(prev => prev === 1 ? null : 1); }}
                style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", right: "0.8vw", background: "none", border: "none", cursor: "pointer", fontSize: "1.6vw", opacity: 0.55, padding: 0, lineHeight: 1, color: effP2Color ?? "#ff8833" }}
              >
                ✎
              </button>
            )}
            {onRemoteClick && !matchFinished && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemoteClick(1); }}
                title="Fernbedienung (Handy)"
                style={{ position: "absolute", bottom: "calc(0.4vh + 1cm + 2vw)", right: "0.8vw", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0, opacity: 0.8, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4vh" }}
              >
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <QrGlyph color={effP2Color ?? "#ff8833"} />
                  {remoteConnected?.[1] && (
                    <span style={{ position: "absolute", top: "-0.2vw", left: "-0.2vw", width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                  )}
                </span>
                <span
                  className="sb-active-dot"
                  style={{
                    width: "1.6vw", height: "1.6vw", borderRadius: "50%",
                    opacity: (remoteConnected?.[0] || remoteConnected?.[1]) && match.activePlayerIndex === 1 ? 1 : 0,
                  }}
                />
              </button>
            )}
          </div>
          {colorPickerFor === 1 && (
            <div className="sb-color-picker" onClick={e => e.stopPropagation()}>
              <div className="sb-color-picker-section">Dunkel</div>
              {PALETTE_DARK.map(c => {
                const display = p1Raw === c ? adjustColor(c, 1.7) : c;
                return (
                  <div key={c} className={`sb-color-swatch${p2Raw === display ? " sb-color-swatch--selected" : ""}`}
                    style={{ background: display }} onClick={() => pickColor(1, display)} />
                );
              })}
              <div className="sb-color-picker-section">Hell</div>
              {PALETTE_LIGHT.map(c => {
                const display = p1Raw === c ? adjustColor(c, 1.7) : c;
                return (
                  <div key={c} className={`sb-color-swatch${p2Raw === display ? " sb-color-swatch--selected" : ""}`}
                    style={{ background: display }} onClick={() => pickColor(1, display)} />
                );
              })}
            </div>
          )}
          <div className="sb-frames-row">
            <AutoSize text={String(p2.frames)} deps={[p2.frames]} className="frames-text rc" scale={1.32} />
          </div>
          <div className={`sb-score-row ${!p2Active ? "score-inactive" : ""}`}>
            <div ref={p2ScoreRef} className="score-text rc">{p2.score}</div>
          </div>
          <div
            className="sb-break-row sb-break-row-clickable"
            onClick={(e) => {
              e.stopPropagation();
              if (match.matchId) onBreaksClick(1);
            }}
          >
            <div className="break-text" style={{ color: effP2Color ?? "#ff8833" }}>
              {p2.highbreaks.slice(0, 5).join(", ")}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "15%", left: "0.8vw", color: "#666", fontSize: "0.75vw", fontWeight: "normal", pointerEvents: "none", display: "flex", alignItems: "center", gap: "0.4vw" }}>
        <span>Scoreboard v{VERSION}</span>
        {apiStatus === "error" && (
          <span
            title="Not connected to the scores server — scores aren't being saved."
            style={{ display: "inline-block", width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: "#c9852f", boxShadow: "0 0 0.3vw rgba(201,133,47,0.7)" }}
          />
        )}
      </div>
      <div style={{ position: "absolute", bottom: "15%", right: "0.8vw", color: "#666", fontSize: "0.75vw", fontWeight: "normal", pointerEvents: "none" }}>
        © 2026 Round Robin Sports
      </div>
      <div className="bottom-bar">
        <div className="history-log" ref={historyRef}>
          {history.filter(h => h.label !== "").flatMap((h, i, arr) => {
            const isLastBreak = i === arr.length - 1 && h.kind === "break" && !!onEditLastBreak;
            const isRerack = h.kind === "rerack";
            const isKorrektur = isRerack && h.label.startsWith("Korrektur");
            const isHandicap = h.kind === "handicap";
            const prevFrameNumber = i > 0 ? arr[i - 1].frameNumber : undefined;
            const showFrameSep = h.frameNumber !== undefined && h.frameNumber !== prevFrameNumber;
            const frameSep = showFrameSep ? (
              <span key={`fs-${i}`}>
                <span style={{ letterSpacing: "0.05em", color: neutralColor, padding: "0 0.5em" }}>{"·"}</span>
                <span style={{ border: "1.5px solid #999", borderRadius: "4px", padding: "0 0.5vw", background: "#fff", color: "#000", fontWeight: "bold", letterSpacing: "0.05em" }}>Frame {h.frameNumber}</span>
                {" "}
              </span>
            ) : null;
            const entry = (
              <span key={i}>
                <span style={{ letterSpacing: "0.05em", color: neutralColor, padding: "0 0.5em" }}>{"·"}</span>
                <span
                  onClick={isLastBreak ? onEditLastBreak : undefined}
                  style={{
                    letterSpacing: "0.05em",
                    color: isKorrektur ? "#88bbff" : isRerack ? "#0a3a1a" : h.playerIndex === 0 ? (effP1Color ?? "#5599ff") : h.playerIndex === 1 ? (effP2Color ?? "#ff8833") : neutralColor,
                    fontWeight: isRerack ? "bold" : undefined,
                    border: isKorrektur ? "1px solid #4488ff66" : isRerack ? "1px solid #1a6630" : undefined,
                    borderRadius: isRerack ? "4px" : isLastBreak ? "4px" : undefined,
                    padding: isRerack ? "0 0.4vw" : isLastBreak ? "0 0.3vw" : undefined,
                    background: isKorrektur ? "rgba(30,80,200,0.28)" : isRerack ? "#4ade80" : isLastBreak ? "rgba(255,255,255,0.06)" : undefined,
                    cursor: isLastBreak ? "pointer" : "default",
                    textDecoration: isLastBreak ? "underline dotted" : "none",
                  }}
                >
                  {isHandicap ? (() => {
                    const hcIdx = h.label.indexOf(" HC ");
                    if (hcIdx < 0) return h.label;
                    return <>{h.label.slice(0, hcIdx)}{" "}<span style={{ border: "1.5px solid #c87830", borderRadius: "4px", padding: "0 0.3vw", background: "rgba(140,75,15,0.65)", color: "#f0c878" }}>{h.label.slice(hcIdx + 1)}</span></>;
                  })() : isRerack && !isKorrektur && "⚪ "}{!isHandicap && (h.kind === "break" ? (() => {
                    const bm = h.label.match(/^(.*)\((\d+)\)(.*)$/);
                    if (!bm) return <>{h.label}</>;
                    const pc = h.playerIndex === 0 ? (effP1Color ?? "#5599ff") : (effP2Color ?? "#ff8833");
                    return <>{bm[1]}<span style={{ border: `1.5px solid ${pc}cc`, borderRadius: "3px", padding: "0 0.3vw", background: `${pc}22` }}>{bm[2]}</span>{bm[3]}</>;
                  })() : h.label.split("Foul").map((part, j, arr) => (
                    <span key={j}>
                      {j === arr.length - 1 && j > 0 ? null : (j < arr.length - 1 ? part.replace(/ - $/, "  ") : part)}
                      {j < arr.length - 1 && (
                        <span style={{ background: "rgba(200,0,0,0.85)", border: "1px solid #ffd700bb", borderRadius: "3px", padding: "0 0.3vw", fontWeight: "bold", color: "#ffeeaa" }}>FOUL{arr[j + 1]}</span>
                      )}
                    </span>
                  )))}{" "}
                </span>
              </span>
            );
            return frameSep ? [frameSep, entry] : [entry];
          })}
        </div>
        <div className="menu-btn" onClick={onMenuClick}>
          Menu
        </div>
      </div>
    </div>
  );
}
