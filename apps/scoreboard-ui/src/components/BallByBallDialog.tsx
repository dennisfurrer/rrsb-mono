import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  BALL_HEX,
  BALL_VALUES,
  COLORS_ORDER,
  ballOnValue,
  foulPoints,
  type BBBallColor,
  type BBBallType,
  type BBState,
} from "../lib/ballbyball";

const ALL_COLORS: BBBallColor[] = ["red", "yellow", "green", "brown", "blue", "pink", "black"];

type FrameHistoryEntry = {
  kind?: string;
  playerIndex?: 0 | 1;
  points?: number;
  timestamp?: string;
  label?: string;
};

function formatFrameDuration(startIso: string): string {
  const ms = Date.now() - new Date(startIso).getTime();
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Props {
  playerName: string;
  playerIndex: 0 | 1;
  bbState: BBState;
  onPot: (ball: BBBallType) => void;
  onFoul: (ball: BBBallColor) => void;
  onMiss: () => void;
  onUndo: () => void;
  onRedo?: () => void;
  onCorrectReds: (newCount: number) => void;
  onClose: () => void;
  isEditMode?: boolean;
  onCancelEdit?: () => void;
  onDeleteBreak?: () => void;
  frameScores?: [number, number];
  opponentName?: string;
  frameNumber?: number;
  frameHistory?: FrameHistoryEntry[];
  playerColors?: [string, string];
  onHandicap?: (playerIndex: 0 | 1, points: number) => void;
}

export function BallByBallDialog({
  playerName,
  playerIndex,
  bbState,
  onPot,
  onFoul,
  onMiss,
  onUndo,
  onRedo,
  onCorrectReds,
  onClose,
  isEditMode,
  onCancelEdit,
  onDeleteBreak,
  frameScores,
  opponentName,
  frameNumber,
  frameHistory,
  playerColors,
  onHandicap,
}: Props) {
  const [foulMode, setFoulMode] = useState(false);
  const [pendingReds, setPendingReds] = useState<number | null>(null);
  const [showRedsConfirm, setShowRedsConfirm] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [showCancelEditConfirm, setShowCancelEditConfirm] = useState(false);
  const [showDeleteBreakConfirm, setShowDeleteBreakConfirm] = useState(false);
  const [showFrameEndConfirm, setShowFrameEndConfirm] = useState(false);
  const [showChartHelp, setShowChartHelp] = useState(false);
  const [frameEndSeen, setFrameEndSeen] = useState(false);
  const [showHCDialog, setShowHCDialog] = useState(false);
  const [hcTarget, setHcTarget] = useState<0 | 1 | null>(null);
  const [hcInput, setHcInput] = useState("");
  const redsMode = pendingReds !== null;
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const initialBreakBallsRef = useRef<string>(JSON.stringify(bbState.breakBalls));
  const { redsRemaining, phase, colorsOnlyIndex, freeBallAvailable, foulByPlayerIndex, breakBalls, breakTotal, frameOver } = bbState;
  const hasEditChanges = isEditMode && JSON.stringify(breakBalls) !== initialBreakBallsRef.current;

  const COLOR_NAMES_DE: Record<string, string> = {
    red: "Rot", yellow: "Gelb", green: "Grün", brown: "Braun",
    blue: "Blau", pink: "Pink", black: "Schwarz",
  };

  let redsInStreak = 0;
  for (let i = breakBalls.length - 1; i >= 0; i--) {
    if (breakBalls[i].ball === "red" || breakBalls[i].ball === "freeball") redsInStreak++;
    else break;
  }

  const phaseLabel = frameOver
    ? breakBalls.length === 0 ? "Frame beendet – Frame beenden klicken" : "Frame beendet – Break-Ende klicken"
    : phase === "colors_only"
    ? `${COLOR_NAMES_DE[COLORS_ORDER[colorsOnlyIndex]] ?? COLORS_ORDER[colorsOnlyIndex]} ist dran`
    : phase === "color"
    ? redsRemaining > 0
      ? `Farbe oder ${redsInStreak + 1}. Rote wählen`
      : "Farbe wählen"
    : "Rot wählen";

  function isBallEnabled(ball: BBBallColor): boolean {
    if (frameOver) return false;
    if (phase === "red") return ball === "red" && redsRemaining > 0;
    if (phase === "color") {
      if (ball === "red") return redsRemaining > 0;
      return true;
    }
    if (phase === "colors_only") return ball === COLORS_ORDER[colorsOnlyIndex];
    return false;
  }

  function handleBallClick(ball: BBBallColor) {
    if (foulMode) {
      onFoul(ball);
      setFoulMode(false);
    } else if (isBallEnabled(ball)) {
      onPot(ball);
    }
  }

  const playerColor = playerIndex === 0 ? "#5599ff" : "#ff8833";

  function handlePanelPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button:not(:disabled), input, select")) return;
    e.stopPropagation();
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragRef.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top, sx: e.clientX, sy: e.clientY };
    panel.setPointerCapture(e.pointerId);
  }

  function handlePanelPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.sx) > 6 || Math.abs(e.clientY - d.sy) > 6) {
      setIsDragging(true);
      setPos({ x: e.clientX - d.ox, y: e.clientY - d.oy });
    }
  }

  function handlePanelPointerUp() {
    dragRef.current = null;
    setIsDragging(false);
  }

  const topRowBalls: BBBallColor[] = ["yellow", "green", "brown"];
  const bottomRowBalls: BBBallColor[] = ["blue", "pink", "black"];

  const isFrameStart = !frameOver && (frameScores?.[0] ?? 0) === 0 && (frameScores?.[1] ?? 0) === 0;

  const isLastBlackDecided = phase === "colors_only" && colorsOnlyIndex === 5 &&
    frameScores !== undefined && Math.abs(frameScores[0] - frameScores[1]) > 7;
  const shouldShowFrameEndPopup = isLastBlackDecided && !frameOver && !!frameScores;

  const panelTop = redsMode ? "32vh" : "5vh";
  const defaultStyle = pos !== null
    ? { position: "fixed" as const, top: pos.y, left: pos.x }
    : playerIndex === 0
      ? { position: "fixed" as const, top: panelTop, left: "2vw" }
      : { position: "fixed" as const, top: panelTop, right: "2vw" };

  function handleOverlayClick() {
    if (redsMode) {
      setPendingReds(null);
    } else if (foulMode) {
      setFoulMode(false);
    } else if (isEditMode && onCancelEdit) {
      if (hasEditChanges) {
        setShowCancelEditConfirm(true);
      } else {
        onCancelEdit();
      }
    } else if (breakBalls.length > 0) {
      setShowCloseWarning(true);
    } else {
      onClose();
    }
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.18)" }}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePanelPointerDown}
        onPointerMove={handlePanelPointerMove}
        onPointerUp={handlePanelPointerUp}
        style={{
          background: "rgba(20,20,20,0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: "12px",
          border: "2px solid #b8970088",
          padding: "1.4vh 1.6vw",
          display: "flex",
          flexDirection: "column",
          gap: "1vh",
          width: "27vw",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          ...defaultStyle,
        }}
      >

        {/* Phase label */}
        <span style={{ color: foulMode ? "#ff5555" : redsMode ? "#f0c040" : "#ccc", fontSize: redsMode ? "1.5vw" : "1vw", fontWeight: "bold" }}>
          {foulMode ? "⚠ FOUL – Welche Farbe war betroffen?" : redsMode ? `Rote anpassen von ${redsRemaining} auf ...` : phaseLabel}
        </span>

        {/* Ball row 1: Red, Yellow, Green, Brown */}
        {!redsMode && <div style={{ display: "flex", gap: "0.7vw", alignItems: "flex-end", justifyContent: "flex-start" }}>
          {phase !== "colors_only" && (!foulMode || redsRemaining > 0) && (
            <BallButton
              hex={BALL_HEX.red}
              enabled={foulMode || isBallEnabled("red")}
              dimmed={!foulMode && !isBallEnabled("red")}
              onClick={() => handleBallClick("red")}
              centerLabel={foulMode ? undefined : String(redsRemaining)}
              centerFontSize={foulMode ? undefined : "2.2vw"}
              bottomLabel={foulMode ? `+${foulPoints("red")}` : undefined}
              foulLabelColor="#ff4444"
            />
          )}
          {topRowBalls.map((ball) => {
            const ballIndexInPlay = phase !== "colors_only" || COLORS_ORDER.indexOf(ball) >= colorsOnlyIndex;
            if (foulMode && !ballIndexInPlay) return null;
            const enabled = foulMode || isBallEnabled(ball);
            const dimmed = !foulMode && !isBallEnabled(ball);
            return (
              <BallButton
                key={ball}
                hex={BALL_HEX[ball]}
                enabled={enabled}
                dimmed={dimmed}
                onClick={() => handleBallClick(ball)}
                centerLabel={undefined}
                bottomLabel={foulMode ? `+${foulPoints(ball)}` : undefined}
                foulLabelColor="#ff4444"
              />
            );
          })}
        </div>}

        {/* Ball row 2: Blue, Pink, Black, Freeball */}
        {!redsMode && <div style={{ display: "flex", gap: "0.7vw", alignItems: "flex-end", justifyContent: "flex-start" }}>
          {bottomRowBalls.map((ball) => {
            const ballIndexInPlay = phase !== "colors_only" || COLORS_ORDER.indexOf(ball) >= colorsOnlyIndex;
            if (foulMode && !ballIndexInPlay) return null;
            const enabled = foulMode || isBallEnabled(ball);
            const dimmed = !foulMode && !isBallEnabled(ball);
            return (
              <BallButton
                key={ball}
                hex={BALL_HEX[ball]}
                enabled={enabled}
                dimmed={dimmed}
                onClick={() => handleBallClick(ball)}
                centerLabel={undefined}
                bottomLabel={foulMode ? `+${foulPoints(ball)}` : undefined}
                foulLabelColor="#ff4444"
              />
            );
          })}
          {freeBallAvailable && !foulMode && playerIndex !== foulByPlayerIndex && (() => {
            const fbColor = phase === "red" ? "red"
              : phase === "colors_only" ? COLORS_ORDER[colorsOnlyIndex] as BBBallColor
              : null;
            const fbName = fbColor ? COLOR_NAMES_DE[fbColor] ?? fbColor : "Farbe";
            const fbHex = fbColor ? BALL_HEX[fbColor] : "#aaa";
            return (
              <BallButton
                gradient={`conic-gradient(from 0deg, ${BALL_HEX.yellow}, ${BALL_HEX.green}, ${BALL_HEX.brown}, ${BALL_HEX.blue}, ${BALL_HEX.pink}, ${BALL_HEX.black}, ${BALL_HEX.yellow})`}
                enabled={true}
                onClick={() => onPot("freeball")}
                centerLabel="Freeball"
                centerFontSize="0.95vw"
                bottomLabel={`als ${fbName}`}
                foulLabelColor={fbHex}
                borderColor={fbHex}
                extraClass="bbb-freeball"
              />
            );
          })()}
        </div>}

        {/* Player name — only during active break */}
        {!foulMode && !redsMode && breakBalls.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6vw" }}>
            <span style={{ color: playerColor, fontSize: "1.5vw", fontWeight: "bold", maxWidth: "20vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {playerName}
            </span>
            {isEditMode && <span style={{ color: "#f0c040", fontSize: "1.1vw" }}>[Bearb.]</span>}
          </div>
        )}

        {/* Action row */}
        {!foulMode && !redsMode && (
          breakBalls.length > 0 ? (
            /* Break running: Undo | Break-Ende | Redo, then Break X + Abbrechen below */
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3vh" }}>
              <div style={{ display: "flex", gap: "0.5vw" }}>
                <button className="bbb-btn-undo" onClick={onUndo} style={{ ...actionBtnLg("#1a1a40", "#6688ff"), flex: 1, minWidth: 0, padding: "1.2vh 0.3vw", fontSize: "1.3vw", boxSizing: "border-box" }}>
                  <span style={{ fontFamily: "'Wingdings 3'" }}>L</span>{" Undo"}
                </button>
                <button
                  className="bbb-btn-ok"
                  onClick={() => { if (shouldShowFrameEndPopup && !frameEndSeen) { setShowFrameEndConfirm(true); } else { onMiss(); onClose(); } }}
                  style={{ ...actionBtnLg("#1a3a1a", "#4ade80"), flex: 1, minWidth: 0, padding: "1.2vh 0.3vw", fontSize: "1.3vw", border: "1.5px solid #4ade80", boxSizing: "border-box" }}
                >
                  Break-Ende
                </button>
                <button
                  className="bbb-btn-ok"
                  disabled={!onRedo}
                  onClick={onRedo ?? undefined}
                  style={{ ...actionBtnLg("#0a2a1a", "#4ade80"), flex: 1, minWidth: 0, padding: "1.2vh 0.3vw", fontSize: "1.3vw", opacity: onRedo ? 1 : 0.3, cursor: onRedo ? "pointer" : "default", boxSizing: "border-box" }}
                >
                  {"Redo "}<span style={{ fontFamily: "'Wingdings 3'" }}>M</span>
                </button>
              </div>
              {(breakTotal > 0 || (isEditMode && onCancelEdit)) && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                  {breakTotal > 0 && (
                    <span style={{ color: "#f0c040", fontSize: "2.6vw", fontWeight: "bold", whiteSpace: "nowrap" }}>
                      Break {breakTotal}
                    </span>
                  )}
                  {isEditMode && onCancelEdit && (
                    <button
                      className="bbb-btn-cancel"
                      onClick={() => hasEditChanges ? setShowCancelEditConfirm(true) : onCancelEdit()}
                      style={{ ...actionBtnLg("#3a1a1a", "#ff4444"), flex: 1, minWidth: 0, padding: "1.2vh 0.3vw", fontSize: "1.3vw", border: "1px solid #553333", boxSizing: "border-box" }}
                    >
                      Abbrechen
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : frameOver ? (
            /* Frame is over but break was already cleared — just end frame */
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                className="bbb-btn-ok"
                onClick={() => { onMiss(); onClose(); }}
                style={{ ...actionBtnLg("#1a3a1a", "#4ade80"), border: "1.5px solid #4ade80" }}
              >
                Frame beenden
              </button>
            </div>
          ) : null
        )}

        {/* Secondary row: exclusive modes — foul / reds / initial */}
        {foulMode ? (
          <div style={{ display: "flex", gap: "0.6vw", alignItems: "center" }}>
            <button className="bbb-btn-cancel" onClick={() => setFoulMode(false)} style={actionBtn("#3a1a1a", "#ff4444")}>Abbrechen</button>
          </div>
        ) : redsMode ? (
          <div style={{ display: "flex", gap: "0.6vw", alignItems: "center" }}>
            <button className="bbb-btn-stepper" onClick={() => setPendingReds(Math.max(0, pendingReds! - 1))} disabled={pendingReds! <= 0} style={{ ...actionBtnLg("#222", "#aaa"), padding: "1.1vh 0.95vw", opacity: pendingReds! <= 0 ? 0.3 : 1, cursor: pendingReds! <= 0 ? "not-allowed" : "pointer" }}>−</button>
            <span style={{ color: "#f0c040", fontSize: "1.7vw", fontWeight: "bold", minWidth: "2vw", textAlign: "center" }}>{pendingReds}</span>
            <button className="bbb-btn-stepper" onClick={() => setPendingReds(Math.min(15, pendingReds! + 1))} disabled={pendingReds! >= 15} style={{ ...actionBtnLg("#222", "#aaa"), padding: "1.1vh 0.95vw", opacity: pendingReds! >= 15 ? 0.3 : 1, cursor: pendingReds! >= 15 ? "not-allowed" : "pointer" }}>+</button>
            <span style={{ color: "#f0c040", fontSize: "1.5vw" }}>Rote</span>
            {pendingReds !== redsRemaining && (
              <button className="bbb-btn-ok" onClick={() => setShowRedsConfirm(true)} style={{ ...actionBtnLg("#1a3a1a", "#4ade80"), border: "1px solid #4ade80" }}>OK</button>
            )}
            <button className="bbb-btn-cancel" onClick={() => setPendingReds(null)} style={{ ...actionBtnLg("#2a1a1a", "#ff4444"), border: "1px solid #ff444466" }}>✕</button>
          </div>
        ) : breakBalls.length === 0 && !frameOver ? (
          isEditMode && onDeleteBreak ? (
            /* Edit mode, fully undone back to break start: only Break löschen / Redo / Abbrechen — no Rote/Foul/Handicap */
            <div style={{ display: "flex", gap: "0.5vw" }}>
              <button
                className="bbb-btn-cancel"
                onClick={() => setShowDeleteBreakConfirm(true)}
                style={{ ...actionBtnLg("#3a1a1a", "#ff4444"), flex: 1, minWidth: 0, padding: "1.2vh 0.3vw", fontSize: "1.3vw", border: "1px solid #553333", boxSizing: "border-box" }}
              >
                Break löschen
              </button>
              <button
                className="bbb-btn-ok"
                disabled={!onRedo}
                onClick={onRedo ?? undefined}
                style={{ ...actionBtnLg("#0a2a1a", "#4ade80"), flex: 1, minWidth: 0, padding: "1.2vh 0.3vw", fontSize: "1.3vw", opacity: onRedo ? 1 : 0.3, cursor: onRedo ? "pointer" : "default", boxSizing: "border-box" }}
              >
                {"Redo "}<span style={{ fontFamily: "'Wingdings 3'" }}>M</span>
              </button>
              <button
                className="bbb-btn-cancel"
                onClick={onClose}
                style={{ ...actionBtnLg("#3a1a1a", "#ff4444"), flex: 1, minWidth: 0, padding: "1.2vh 0.3vw", fontSize: "1.3vw", border: "1px solid #ff888866", boxSizing: "border-box" }}
              >
                Abbrechen
              </button>
            </div>
          ) : (
            /* Combined grid: Foul + Handicap/Rote on top, Abbrechen below — column 2 is shared so left edges align */
            (() => {
              const showHandicap = isFrameStart && !!onHandicap;
              const redsEditor = phase !== "colors_only" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", border: "1px solid #666", borderRadius: "6px", padding: "0.4vh 0.6vw" }}>
                  <span style={{ color: "#777", fontSize: "1.5vw" }}>Rote:</span>
                  <button className="bbb-btn-stepper" onClick={() => setPendingReds(Math.max(0, redsRemaining - 1))} disabled={redsRemaining <= 0} style={{ ...actionBtnLg("#222", "#aaa"), padding: "1.1vh 0.95vw", opacity: redsRemaining <= 0 ? 0.3 : 1, cursor: redsRemaining <= 0 ? "not-allowed" : "pointer", border: "1.5px solid #c0c0c0" }}>−</button>
                  <span style={{ color: "#bbb", fontSize: "1.5vw", minWidth: "1.5vw", textAlign: "center" }}>{redsRemaining}</span>
                  <button className="bbb-btn-stepper" onClick={() => setPendingReds(Math.min(15, redsRemaining + 1))} disabled={redsRemaining >= 15} style={{ ...actionBtnLg("#222", "#aaa"), padding: "1.1vh 0.95vw", opacity: redsRemaining >= 15 ? 0.3 : 1, cursor: redsRemaining >= 15 ? "not-allowed" : "pointer", border: "1.5px solid #c0c0c0" }}>+</button>
                </div>
              ) : <div />;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "min-content 1fr", gap: "0.6vh 0.8vw", alignItems: "center", width: "100%" }}>
                  <button className="bbb-btn-foul" onClick={() => setFoulMode(true)} style={{ ...actionBtnLg("#5c1a1a", "#ff5555"), border: "1.5px solid #ff5555", whiteSpace: "nowrap" }}>Foul</button>
                  {showHandicap ? (
                    <button
                      className="bbb-btn-handicap"
                      onClick={() => { setHcTarget(playerIndex); setHcInput(""); setShowHCDialog(true); }}
                      style={{ ...actionBtnLg("#3a2800", "#c87832"), border: "1.5px solid #c87832", width: "100%" }}
                    >
                      Handicap
                    </button>
                  ) : redsEditor}
                  <div />
                  {showHandicap ? redsEditor : (
                    <button className="bbb-btn-cancel" onClick={onClose} style={{ ...actionBtnLg("#3a1a1a", "#ff4444"), border: "1px solid #ff888866", width: "100%" }}>
                      Abbrechen
                    </button>
                  )}
                  {showHandicap && (
                    <>
                      <div />
                      <button className="bbb-btn-cancel" onClick={onClose} style={{ ...actionBtnLg("#3a1a1a", "#ff4444"), border: "1px solid #ff888866", width: "100%" }}>
                        Abbrechen
                      </button>
                    </>
                  )}
                </div>
              );
            })()
          )
        ) : null}

        {/* Break ball history */}
        {!foulMode && !redsMode && breakBalls.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.35vw", flexWrap: "wrap", borderTop: "1px solid #333", paddingTop: "0.7vh" }}>
            {breakBalls.map((entry, i) => (
              <div key={i} style={{ width: "1.7vw", height: "1.7vw", borderRadius: "50%", background: entry.hex, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65vw", fontWeight: "bold", color: "#fff", textShadow: "0 1px 3px #000", flexShrink: 0, border: "1px solid #444" }}>
                {entry.points}
              </div>
            ))}
          </div>
        )}

      </div>

      {showCloseWarning && (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={(e) => { e.stopPropagation(); setShowCloseWarning(false); }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ background: "#1e1e1e", border: "1px solid #f0c040", borderRadius: "14px", padding: "3.5vh 3.5vw", display: "flex", flexDirection: "column", gap: "2vh", alignItems: "center", maxWidth: "50vw", textAlign: "center" }}
        >
          <div style={{ color: "#f0c040", fontSize: "1.8vw", fontWeight: "bold" }}>⚠ Break noch nicht beendet</div>
          <div style={{ color: "#ccc", fontSize: "1.4vw", lineHeight: 1.6 }}>
            Es läuft noch ein Break. Bitte das Break zuerst über den Button <strong style={{ color: "#4ade80" }}>Break-Ende</strong> sauber beenden.
          </div>
          <button
            className="menu-btn-info"
            onClick={() => setShowCloseWarning(false)}
            style={{ background: "#1a3a6a", color: "#88aaff", border: "none", borderRadius: "8px", padding: "1vh 3vw", fontSize: "1.4vw", fontWeight: "bold", cursor: "pointer" }}
          >
            OK
          </button>
        </div>
      </div>
    )}

    {showRedsConfirm && pendingReds !== null && (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: "#1e1e1e", border: "1px solid #555", borderRadius: "14px", padding: "4vh 4vw", display: "flex", flexDirection: "column", gap: "2.5vh", alignItems: "center", minWidth: "42vw" }}>
          <div style={{ color: "#fff", fontSize: "2vw", fontWeight: "bold" }}>Rote korrigieren?</div>
          <div style={{ color: "#ccc", fontSize: "1.9vw" }}>
            Von <span style={{ fontWeight: "bold" }}>{redsRemaining}</span> → <span style={{ color: "#f0c040", fontWeight: "bold" }}>{pendingReds}</span> rote Bälle
          </div>
          <div style={{ display: "flex", gap: "1.5vw" }}>
            <button
              className="bbb-btn-ok"
              onClick={() => { onCorrectReds(pendingReds); setPendingReds(null); setShowRedsConfirm(false); }}
              style={{ background: "#1a3a1a", color: "#4ade80", border: "1px solid #2a5a2a", borderRadius: "8px", padding: "1.2vh 3vw", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
            >
              Bestätigen
            </button>
            <button
              className="bbb-btn-cancel"
              onClick={() => { setPendingReds(null); setShowRedsConfirm(false); }}
              style={{ background: "#3a1a1a", color: "#ff4444", border: "1px solid #553333", borderRadius: "8px", padding: "1.2vh 3vw", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    )}

    {showCancelEditConfirm && onCancelEdit && (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: "#1e1e1e", border: "1px solid #555", borderRadius: "14px", padding: "4vh 4vw", display: "flex", flexDirection: "column", gap: "2.5vh", alignItems: "center", minWidth: "42vw" }}>
          <div style={{ color: "#fff", fontSize: "2vw", fontWeight: "bold" }}>Änderungen verwerfen?</div>
          <div style={{ color: "#ccc", fontSize: "1.7vw", textAlign: "center" }}>
            Die Änderungen an diesem Break gehen verloren.
          </div>
          <div style={{ display: "flex", gap: "1.5vw" }}>
            <button
              className="bbb-btn-ok"
              onClick={onCancelEdit}
              style={{ background: "#1a3a1a", color: "#4ade80", border: "1px solid #2a5a2a", borderRadius: "8px", padding: "1.2vh 3vw", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
            >
              Ja, verwerfen
            </button>
            <button
              className="bbb-btn-cancel"
              onClick={() => setShowCancelEditConfirm(false)}
              style={{ background: "#3a1a1a", color: "#ff4444", border: "1px solid #553333", borderRadius: "8px", padding: "1.2vh 3vw", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
            >
              Zurück
            </button>
          </div>
        </div>
      </div>
    )}

    {showDeleteBreakConfirm && onDeleteBreak && (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: "#1e1e1e", border: "1px solid #555", borderRadius: "14px", padding: "4vh 4vw", display: "flex", flexDirection: "column", gap: "2.5vh", alignItems: "center", minWidth: "42vw" }}>
          <div style={{ color: "#fff", fontSize: "2vw", fontWeight: "bold" }}>Break löschen?</div>
          <div style={{ color: "#ccc", fontSize: "1.7vw", textAlign: "center" }}>
            Dieses Break wird endgültig entfernt.
          </div>
          <div style={{ display: "flex", gap: "1.5vw" }}>
            <button
              className="bbb-btn-ok"
              onClick={onDeleteBreak}
              style={{ background: "#1a3a1a", color: "#4ade80", border: "1px solid #2a5a2a", borderRadius: "8px", padding: "1.2vh 3vw", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
            >
              Ja, löschen
            </button>
            <button
              className="bbb-btn-cancel"
              onClick={() => setShowDeleteBreakConfirm(false)}
              style={{ background: "#3a1a1a", color: "#ff4444", border: "1px solid #553333", borderRadius: "8px", padding: "1.2vh 3vw", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
            >
              Zurück
            </button>
          </div>
        </div>
      </div>
    )}

    {showFrameEndConfirm && frameScores && (
      <div
        style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: "#1e1e1e", border: "1px solid #555", borderRadius: "14px", padding: "4vh 4vw", display: "flex", flexDirection: "column", gap: "2vh", alignItems: "center", minWidth: "62vw" }}>
          <div style={{ color: "#fff", fontSize: "2.2vw", fontWeight: "bold" }}>{frameNumber ? `${frameNumber}. Frame beenden?` : "Frame beenden?"}</div>

          {/* Frame score display */}
          <div style={{ width: "100%", background: "#111", borderRadius: "10px", padding: "2vh 2vw", display: "flex", alignItems: "center", gap: "1vw" }}>
            {(() => {
              const s0 = frameScores[0];
              const s1 = frameScores[1];
              const p0wins = s0 > s1;
              const p1wins = s1 > s0;
              const activeName = playerName;
              const opponentN = opponentName ?? "Gegner";
              const name0 = playerIndex === 0 ? activeName : opponentN;
              const name1 = playerIndex === 1 ? activeName : opponentN;
              const effCol0 = playerColors?.[0] ?? "#5599ff";
              const effCol1 = playerColors?.[1] ?? "#ff8833";
              return (
                <>
                  <span style={{ flex: 1, textAlign: "left", color: effCol0, fontSize: "1.8vw", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {name0}{p0wins && " 🏆"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", background: "#222", borderRadius: "8px", padding: "0.8vh 1.5vw" }}>
                    <span style={{ color: p0wins ? "#ffee44" : "#888", fontSize: "3vw", fontWeight: "bold" }}>{s0}</span>
                    <span style={{ color: "#555", fontSize: "1.8vw" }}>:</span>
                    <span style={{ color: p1wins ? "#ffee44" : "#888", fontSize: "3vw", fontWeight: "bold" }}>{s1}</span>
                  </div>
                  <span style={{ flex: 1, textAlign: "right", color: effCol1, fontSize: "1.8vw", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p1wins && "🏆 "}{name1}
                  </span>
                </>
              );
            })()}
          </div>

          {/* Frame stats */}
          {frameHistory && (() => {
            const name0 = playerIndex === 0 ? playerName : (opponentName ?? "Spieler 2");
            const name1 = playerIndex === 1 ? playerName : (opponentName ?? "Spieler 1");
            const effCol0 = playerColors?.[0] ?? "#5599ff";
            const effCol1 = playerColors?.[1] ?? "#ff8833";
            const hBreaks0 = [...frameHistory.filter(e => e.kind === "break" && e.playerIndex === 0 && (e.points ?? 0) > 7).map(e => e.points!), ...(playerIndex === 0 && breakTotal > 7 ? [breakTotal] : [])].sort((a, b) => b - a);
            const hBreaks1 = [...frameHistory.filter(e => e.kind === "break" && e.playerIndex === 1 && (e.points ?? 0) > 7).map(e => e.points!), ...(playerIndex === 1 && breakTotal > 7 ? [breakTotal] : [])].sort((a, b) => b - a);
            const fouls0 = frameHistory.filter(e => e.kind === "foul" && e.playerIndex === 0).reduce((s, e) => s + (e.points ?? 0), 0);
            const fouls1 = frameHistory.filter(e => e.kind === "foul" && e.playerIndex === 1).reduce((s, e) => s + (e.points ?? 0), 0);
            const foulCount0 = frameHistory.filter(e => e.kind === "foul" && e.playerIndex === 0).length;
            const foulCount1 = frameHistory.filter(e => e.kind === "foul" && e.playerIndex === 1).length;
            const hc0 = frameHistory.filter(e => e.kind === "handicap" && e.playerIndex === 0).reduce((s, e) => s + (e.points ?? 0), 0);
            const hc1 = frameHistory.filter(e => e.kind === "handicap" && e.playerIndex === 1).reduce((s, e) => s + (e.points ?? 0), 0);
            const showHandicap = hc0 > 0 || hc1 > 0;
            const reracks = frameHistory.filter(e => e.kind === "rerack").length;
            const corrections = frameHistory.filter(e => e.kind === "correction");
            const startTs = frameHistory.find(e => e.timestamp)?.timestamp;
            const durationStr = startTs ? formatFrameDuration(startTs) : null;
            const fmtTime = (ts: string | number) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
            const startTimeStr = startTs ? fmtTime(startTs) : null;
            const endTimeStr = fmtTime(Date.now());
            return (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.2vh", borderTop: "1px solid #333", paddingTop: "1.5vh" }}>
                {breakTotal > 0 && (
                  <div style={{ color: "#f0c040", fontSize: "1.45vw" }}>
                    🔴 <strong>{playerName}</strong> – laufendes Break: {breakTotal} Pkt.
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", columnGap: "0.8vw", rowGap: "0.35vh", fontSize: "1.35vw", alignItems: "baseline" }}>
                  <div style={{ color: effCol0, textAlign: "right" }}>{hBreaks0.length > 0 ? [...hBreaks0].sort((a,b)=>a-b).join(", ") : "—"}</div>
                  <div style={{ color: "#ccc", textAlign: "center", whiteSpace: "nowrap" }}>Breaks &gt;7</div>
                  <div style={{ color: effCol1, textAlign: "left" }}>{hBreaks1.length > 0 ? [...hBreaks1].sort((a,b)=>b-a).join(", ") : "—"}</div>
                  <div style={{ color: "#ff4444", textAlign: "right" }}>{fouls0 > 0 ? <><span style={{ fontWeight: "normal" }}>({foulCount0 === 1 ? "1 Foul" : `${foulCount0} Fouls`})</span>{"   "}{fouls0}</> : "—"}</div>
                  <div style={{ color: "#ccc", textAlign: "center", whiteSpace: "nowrap" }}>Foulpunkte</div>
                  <div style={{ color: "#ff4444", textAlign: "left" }}>{fouls1 > 0 ? <>{fouls1}{"   "}<span style={{ fontWeight: "normal" }}>({foulCount1 === 1 ? "1 Foul" : `${foulCount1} Fouls`})</span></> : "—"}</div>
                  {showHandicap && (
                    <>
                      <div style={{ color: "#c87832", textAlign: "right" }}>{hc0 > 0 ? hc0 : "—"}</div>
                      <div style={{ color: "#ccc", textAlign: "center", whiteSpace: "nowrap" }}>Handicap</div>
                      <div style={{ color: "#c87832", textAlign: "left" }}>{hc1 > 0 ? hc1 : "—"}</div>
                    </>
                  )}
                  {reracks > 0 && (
                    <div style={{ gridColumn: "1 / 4", color: "#ffa040" }}>🔴 Re-racks: {reracks}</div>
                  )}
                  {corrections.map((e, i) => (
                    <div key={`corr-${i}`} style={{ gridColumn: "1 / 4", color: "#f0c040" }}>{e.label}</div>
                  ))}
                </div>
                {frameScores && (() => {
                  const svgW = 500, svgH = 150, px = 32, py = 20;
                  const cW = svgW - 2 * px, cH = svgH - 2 * py;
                  const fs0 = frameScores[0], fs1 = frameScores[1];
                  if (fs0 === 0 && fs1 === 0) return null;
                  const yMax = Math.max(fs0, fs1) + Math.max(1, Math.ceil(Math.max(fs0, fs1) * 0.1));
                  const lastRerackIdx = frameHistory.reduce((idx, e, i) => e.kind === "rerack" ? i : idx, -1);
                  const eventsAfterRerack = lastRerackIdx >= 0 ? frameHistory.slice(lastRerackIdx + 1) : frameHistory;
                  const initHC0 = eventsAfterRerack.filter(e => e.kind === "handicap" && e.playerIndex === 0).reduce((s, e) => s + (e.points ?? 0), 0);
                  const initHC1 = eventsAfterRerack.filter(e => e.kind === "handicap" && e.playerIndex === 1).reduce((s, e) => s + (e.points ?? 0), 0);
                  const scoreData: Array<{ s: [number, number]; b?: 0 | 1; f?: 0 | 1 }> = [{ s: [initHC0, initHC1] }];
                  let acc0 = initHC0, acc1 = initHC1;
                  for (const e of eventsAfterRerack) {
                    if (e.kind === "handicap") continue;
                    let n0 = acc0, n1 = acc1;
                    if (e.kind === "break") {
                      if (e.playerIndex === 0) n0 = Math.min(fs0, acc0 + (e.points ?? 0));
                      else if (e.playerIndex === 1) n1 = Math.min(fs1, acc1 + (e.points ?? 0));
                    } else if (e.kind === "foul") {
                      if (e.playerIndex === 0) n1 = Math.min(fs1, acc1 + (e.points ?? 0));
                      else if (e.playerIndex === 1) n0 = Math.min(fs0, acc0 + (e.points ?? 0));
                    } else {
                      continue;
                    }
                    if (n0 >= acc0 && n1 >= acc1 && (n0 !== acc0 || n1 !== acc1)) {
                      acc0 = n0; acc1 = n1;
                      const isFoul = e.kind === "foul";
                      scoreData.push({
                        s: [acc0, acc1],
                        b: !isFoul ? (e.playerIndex as 0 | 1) : undefined,
                        f: isFoul ? (e.playerIndex === 0 ? 1 : 0) : undefined,
                      });
                    }
                  }
                  const last = scoreData[scoreData.length - 1];
                  if (last.s[0] !== fs0 || last.s[1] !== fs1) scoreData.push({ s: [fs0, fs1] });
                  const firstEvent = eventsAfterRerack.find(e => e.kind === "break" || e.kind === "foul");
                  const p0First = firstEvent ? (firstEvent.kind === "break" ? firstEvent.playerIndex === 0 : firstEvent.playerIndex === 1) : true;
                  const n = scoreData.length;
                  const toX = (i: number) => px + (n > 1 ? (i / (n - 1)) * cW : cW / 2);
                  const toY = (score: number) => py + cH - (score / yMax) * cH;
                  const pts0 = scoreData.map((pt, i) => `${toX(i).toFixed(1)},${toY(pt.s[0]).toFixed(1)}`).join(" ");
                  const pts1 = scoreData.map((pt, i) => `${toX(i).toFixed(1)},${toY(pt.s[1]).toFixed(1)}`).join(" ");
                  const midY = toY(Math.max(fs0, fs1) / 2);
                  const col0 = effCol0;
                  const col1 = effCol1;
                  const lastX = toX(n - 1);
                  const lastY0 = toY(fs0);
                  const lastY1 = toY(fs1);
                  const lcMin = 14;
                  const lcGap0 = initHC0 > 0 && initHC1 === 0 ? toY(0) - toY(initHC0) : Infinity;
                  const lcGap1 = initHC1 > 0 && initHC0 === 0 ? toY(0) - toY(initHC1) : Infinity;
                  const lcHC0y = lcGap0 < lcMin ? (toY(initHC0) + toY(0)) / 2 - lcMin / 2 : toY(initHC0);
                  const lcHC1y = lcGap1 < lcMin ? (toY(initHC1) + toY(0)) / 2 - lcMin / 2 : toY(initHC1);
                  const lcZ1y  = lcGap0 < lcMin ? (toY(initHC0) + toY(0)) / 2 + lcMin / 2 : toY(0);
                  const lcZ0y  = lcGap1 < lcMin ? (toY(initHC1) + toY(0)) / 2 + lcMin / 2 : toY(0);
                  const rcGap = Math.abs(lastY0 - lastY1);
                  const rcMid = (lastY0 + lastY1) / 2;
                  const rcFs0y = rcGap < lcMin ? (lastY0 <= lastY1 ? rcMid - lcMin / 2 : rcMid + lcMin / 2) : lastY0;
                  const rcFs1y = rcGap < lcMin ? (lastY0 <= lastY1 ? rcMid + lcMin / 2 : rcMid - lcMin / 2) : lastY1;
                  return (
                    <div style={{ width: "100%", background: "#111", borderRadius: "8px", padding: "0.5vh 0.3vw", position: "relative" }}>
                      <div style={{ position: "absolute", top: "1.5vh", left: "calc(6.4% - 5mm)", display: "flex", alignItems: "center", gap: "0.5vw", zIndex: 1 }}>
                        <span style={{ color: "#666", fontSize: "1.5vw", fontWeight: "normal" }}>Frameverlauf</span>
                        <button onClick={(e) => { e.stopPropagation(); setShowChartHelp(v => !v); }} style={{ width: "2.1vw", height: "2.1vw", minWidth: "24px", minHeight: "24px", borderRadius: "50%", background: "#1a6bc4", border: "none", color: "#fff", fontWeight: "bold", fontSize: "1.35vw", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>?</button>
                      </div>
                      {showChartHelp && (
                        <div onClick={(e) => { e.stopPropagation(); setShowChartHelp(false); }} style={{ position: "absolute", top: "3.5vh", left: "1vw", right: "1vw", zIndex: 10, background: "#1a2535", border: "1px solid #1a6bc4", borderRadius: "10px", padding: "1.2vh 1.2vw", fontSize: "1.1vw", color: "#ddd", lineHeight: 1.6, cursor: "pointer", fontWeight: "normal" }}>
                          Der <strong>Frameverlauf</strong>-Chart zeigt, wie sich die Punkte der beiden Spieler im Lauf des Frames aufgebaut haben. Die horizontale Achse stellt die zeitliche Abfolge der Breaks und Fouls dar, die vertikale die Punktzahl. Jede Linie gehört einem Spieler (in seiner Farbe) — steigt sie steil an, hat der Spieler in diesem Moment ein grösseres Break gespielt. Beschriftete Punkte auf der Linie zeigen die Grösse eines Breaks; Punkte mit «F» davor (z. B. «F6») markieren Fouls, deren Punkte dem Gegner gutgeschrieben wurden. Liegt eine Linie von Beginn weg höher als bei null, hat dieser Spieler ein Handicap erhalten.
                        </div>
                      )}
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" style={{ width: "100%", height: "36vh", display: "block", overflow: "visible" }}>
                        {(() => {
                          const bw = Math.max(String(fs0).length, String(fs1).length) * 7 + 4;
                          const bx = lastX + 5; const fx = bx + bw / 2;
                          const ty = Math.min(rcFs0y, rcFs1y) - 7;
                          return <><rect x={bx} y={ty} width={bw} height={Math.max(rcFs0y, rcFs1y) - ty + 7} rx={3} fill="#0d3d0d" opacity={0.9} /><line x1={fx - 4} y1={ty - 10} x2={fx - 4} y2={ty} stroke="#999" strokeWidth={1.5} strokeLinecap="round" /><text x={fx} y={ty - 10} textAnchor="middle" dominantBaseline="text-bottom" fontSize={9}>🏁</text></>;
                        })()}
                        <line x1={4} y1={toY(Math.max(fs0, fs1))} x2={svgW - 4} y2={toY(Math.max(fs0, fs1))} stroke="#383838" strokeWidth="1.5" strokeDasharray="6,4" />
                        <line x1={4} y1={midY} x2={svgW - 4} y2={midY} stroke="#383838" strokeWidth="1.5" strokeDasharray="6,4" />
                        <line x1={4} y1={toY(0)} x2={svgW - 4} y2={toY(0)} stroke="#383838" strokeWidth="1.5" strokeDasharray="6,4" />
                        {initHC0 > 0 && <text x={px - 4} y={lcHC0y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={col0}>{initHC0}</text>}
                        {initHC1 > 0 && <text x={px - 4} y={lcHC1y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={col1}>{initHC1}</text>}
                        {initHC0 === 0 && initHC1 > 0 && <text x={px - 4} y={lcZ0y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={col0}>0</text>}
                        {initHC1 === 0 && initHC0 > 0 && <text x={px - 4} y={lcZ1y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={col1}>0</text>}
                        {initHC0 === 0 && initHC1 === 0 && <text x={px - 4} y={toY(0) - lcMin / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={p0First ? col0 : col1}>0</text>}
                        {initHC0 === 0 && initHC1 === 0 && <text x={px - 4} y={toY(0) + lcMin / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={p0First ? col1 : col0}>0</text>}
                        <polyline points={pts0} fill="none" stroke={col0} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                        <polyline points={pts1} fill="none" stroke={col1} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                        {scoreData.map((pt, i) => pt.b === 0 ? <circle key={`b0-${i}`} cx={toX(i)} cy={toY(pt.s[0])} r={3} fill={col0} /> : null)}
                        {scoreData.map((pt, i) => pt.b === 1 ? <circle key={`b1-${i}`} cx={toX(i)} cy={toY(pt.s[1])} r={3} fill={col1} /> : null)}
                        {scoreData.map((pt, i) => pt.f === 0 ? <circle key={`f0-${i}`} cx={toX(i)} cy={toY(pt.s[0])} r={3} fill={col1} /> : null)}
                        {scoreData.map((pt, i) => pt.f === 1 ? <circle key={`f1-${i}`} cx={toX(i)} cy={toY(pt.s[1])} r={3} fill={col0} /> : null)}
                        <circle cx={lastX} cy={lastY0} r={4} fill={col0} />
                        <circle cx={lastX} cy={lastY1} r={4} fill={col1} />
                        <text x={svgW + 8} y={svgH - py} textAnchor="start" dominantBaseline="middle" fontSize={14} fill="#666">0</text>
                        <text x={svgW + 8} y={midY} textAnchor="start" dominantBaseline="middle" fontSize={14} fill="#666">{Math.floor(Math.max(fs0, fs1) / 2)}</text>
                        <text x={svgW + 8} y={toY(Math.max(fs0, fs1))} textAnchor="start" dominantBaseline="middle" fontSize={14} fill="#666">{Math.max(fs0, fs1)}</text>
                        {(() => { const bw = Math.max(String(fs0).length, String(fs1).length) * 7 + 4; const fx = lastX + 5 + bw / 2; const s0c = String(fs0).length < String(fs1).length; const s1c = String(fs1).length < String(fs0).length; return <><text x={s0c ? fx : lastX + 7} y={rcFs0y} textAnchor={s0c ? "middle" : "start"} dominantBaseline="middle" fontSize={12} fill={col0}>{fs0}</text><text x={s1c ? fx : lastX + 7} y={rcFs1y} textAnchor={s1c ? "middle" : "start"} dominantBaseline="middle" fontSize={12} fill={col1}>{fs1}</text></>; })()}
                      </svg>
                    </div>
                  );
                })()}
                {durationStr && startTs && (
                  <div style={{ display: "flex", gap: "4vw", fontSize: "1.3vw", color: "#aaa" }}>
                    <span>Start:{" "}<span style={{ color: "#ccc" }}>{(() => {
                      const d = new Date(startTs);
                      const today = new Date();
                      const prefix = d.toDateString() !== today.toDateString()
                        ? `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} `
                        : "";
                      return prefix + (startTimeStr ?? "");
                    })()}</span></span>
                    <span>Framedauer:{" "}<span style={{ color: "#fff", fontWeight: "bold" }}>{Math.floor((Date.now() - new Date(startTs).getTime()) / 60000)} min</span></span>
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ display: "flex", gap: "1.5vw", width: "100%" }}>
            <button
              className="bbb-btn-cancel"
              onClick={() => { setShowFrameEndConfirm(false); setFrameEndSeen(true); }}
              style={{ flex: 1, background: "#3a1a1a", color: "#ff4444", border: "1px solid #553333", borderRadius: "8px", padding: "1.5vh 0", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
            >
              Abbrechen
            </button>
            <button
              onClick={() => { setShowFrameEndConfirm(false); onMiss(); onClose(); }}
              className="frame-end-btn-glow"
              style={{ flex: 1, background: "#1a5c1a", color: "#4ade80", border: "2.5px solid #4ade80", borderRadius: "8px", padding: "1.5vh 0", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
            >
              Frame beenden
            </button>
          </div>
        </div>
      </div>
    )}

    {showHCDialog && onHandicap && (() => {
      const name0 = playerIndex === 0 ? playerName : (opponentName ?? "Spieler");
      const name1 = playerIndex === 1 ? playerName : (opponentName ?? "Spieler");
      const col0 = playerColors?.[0] ?? "#5599ff";
      const col1 = playerColors?.[1] ?? "#ff8833";
      const activeCol = hcTarget === 0 ? col0 : hcTarget === 1 ? col1 : "#555";
      const inputNum = hcInput.length > 0 ? parseInt(hcInput) : 0;

      function appendDigit(d: string) {
        setHcInput(prev => {
          const next = prev + d;
          return parseInt(next) > 999 ? prev : next;
        });
      }

      function handleOK() {
        if (hcTarget !== null && inputNum > 0) {
          onHandicap?.(hcTarget, inputNum);
          setHcInput("");
          setHcTarget(null);
          setShowHCDialog(false);
        }
      }

      const numpadKeys = ["1","2","3","4","5","6","7","8","9","←","0","OK"];

      return (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ background: "#1e1e1e", border: "1px solid #c87832", borderRadius: "14px", padding: "2.5vh 2.5vw", display: "flex", flexDirection: "column", gap: "1.5vh", alignItems: "center", minWidth: "36vw" }}>
            <div style={{ color: "#c87832", fontSize: "1.8vw", fontWeight: "bold" }}>Handicap</div>

            {/* Player selector */}
            <div style={{ display: "flex", gap: "1vw", width: "100%" }}>
              {([0, 1] as const).map(idx => {
                const name = idx === 0 ? name0 : name1;
                const col = idx === 0 ? col0 : col1;
                const selected = hcTarget === idx;
                return (
                  <button key={idx}
                    className="bbb-btn-stepper"
                    onClick={() => { setHcTarget(idx); setHcInput(""); }}
                    style={{ flex: 1, background: selected ? "#2a2a2a" : "#141414", color: col, border: `2px solid ${selected ? col : "#333"}`, borderRadius: "8px", padding: "1.2vh 0.5vw", fontSize: "1.4vw", fontWeight: "bold", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >{name}</button>
                );
              })}
            </div>

            {/* Display */}
            <div style={{ width: "100%", background: "#111", borderRadius: "8px", padding: "1.2vh 1.5vw", textAlign: "right", fontSize: "2.8vw", fontWeight: "bold", color: activeCol, minHeight: "5vh", letterSpacing: "0.05em", boxSizing: "border-box" }}>
              {hcInput || (hcTarget !== null ? "0" : "—")}
            </div>

            {/* Numpad */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6vw", width: "100%" }}>
              {numpadKeys.map(k => {
                const isOK = k === "OK";
                const isBksp = k === "←";
                const disabled = hcTarget === null || (isOK && inputNum === 0);
                return (
                  <button key={k}
                    className={isOK ? "bbb-btn-ok" : isBksp ? "bbb-btn-cancel" : "bbb-btn-stepper"}
                    disabled={disabled}
                    onClick={() => {
                      if (isBksp) setHcInput(prev => prev.slice(0, -1));
                      else if (isOK) handleOK();
                      else appendDigit(k);
                    }}
                    style={{
                      background: isOK ? "#1a4a1a" : isBksp ? "#2a1a1a" : "#252525",
                      color: isOK ? "#4ade80" : isBksp ? "#ff6666" : "#fff",
                      border: isOK ? "1px solid #4ade80" : isBksp ? "1px solid #ff444466" : "1px solid #333",
                      borderRadius: "8px",
                      padding: "1.4vh 0",
                      fontSize: "1.8vw",
                      fontWeight: "bold",
                      cursor: disabled ? "default" : "pointer",
                      opacity: disabled ? 0.3 : 1,
                    }}
                  >{k}</button>
                );
              })}
            </div>

            <button className="bbb-btn-cancel" onClick={() => setShowHCDialog(false)}
              style={{ ...actionBtnLg("#3a1a1a", "#ff4444"), border: "1px solid #ff888866", alignSelf: "stretch" }}>Schliessen</button>
          </div>
        </div>
      );
    })()}
    </div>
  );
}

function BallButton({
  hex,
  gradient,
  enabled,
  dimmed,
  onClick,
  centerLabel,
  centerFontSize,
  bottomLabel,
  foulLabelColor,
  borderColor,
  extraClass,
}: {
  hex?: string;
  gradient?: string;
  enabled: boolean;
  dimmed?: boolean;
  onClick: () => void;
  centerLabel?: string;
  centerFontSize?: string;
  bottomLabel?: string;
  foulLabelColor?: string;
  borderColor?: string;
  extraClass?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4vh" }}>
      <button
        className={extraClass ? `bbb-ball-btn ${extraClass}` : "bbb-ball-btn"}
        disabled={!enabled}
        onClick={enabled ? onClick : undefined}
        style={{
          width: "5.5vw",
          height: "5.5vw",
          borderRadius: "50%",
          background: gradient || hex || "#333",
          border: `${borderColor ? "3.5px" : "2px"} solid ${borderColor ?? (enabled && !dimmed ? "#fff" : "#333")}`,
          cursor: enabled ? "pointer" : "default",
          opacity: dimmed ? 0.2 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: centerFontSize ?? "1.5vw",
          fontWeight: "bold",
          color: "#fff",
          textShadow: "0 1px 5px #000, 0 0 10px #000",
          boxShadow: enabled && !dimmed ? "0 0 10px rgba(255,255,255,0.25)" : "none",
          padding: 0,
          transition: "opacity 0.15s, box-shadow 0.15s",
          ...(borderColor ? { "--ball-glow": borderColor } : {}),
        } as CSSProperties}
      >
        {centerLabel ?? ""}
      </button>
      {bottomLabel && (
        <span style={{ color: foulLabelColor ?? "#aaa", fontSize: "0.85vw", fontWeight: "bold" }}>
          {bottomLabel}
        </span>
      )}
    </div>
  );
}

function actionBtn(bg: string, color: string): CSSProperties {
  return {
    background: bg,
    color,
    border: "none",
    borderRadius: "8px",
    padding: "0.9vh 1.2vw",
    fontSize: "1.15vw",
    fontWeight: "bold",
    cursor: "pointer",
  };
}

function actionBtnLg(bg: string, color: string): CSSProperties {
  return {
    background: bg,
    color,
    border: "none",
    borderRadius: "8px",
    padding: "1.2vh 1.6vw",
    fontSize: "1.55vw",
    fontWeight: "bold",
    cursor: "pointer",
  };
}

