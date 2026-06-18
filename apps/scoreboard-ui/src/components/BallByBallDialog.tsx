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
}: Props) {
  const [foulMode, setFoulMode] = useState(false);
  const [pendingReds, setPendingReds] = useState<number | null>(null);
  const [showRedsConfirm, setShowRedsConfirm] = useState(false);
  const [redsAlreadyCorrected, setRedsAlreadyCorrected] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { redsRemaining, phase, colorsOnlyIndex, freeBallAvailable, foulByPlayerIndex, breakBalls, breakTotal, frameOver } = bbState;

  const COLOR_NAMES_DE: Record<string, string> = {
    yellow: "Gelb", green: "Grün", brown: "Braun",
    blue: "Blau", pink: "Pink", black: "Schwarz",
  };

  let redsInStreak = 0;
  for (let i = breakBalls.length - 1; i >= 0; i--) {
    if (breakBalls[i].ball === "red") redsInStreak++;
    else break;
  }

  const phaseLabel = frameOver
    ? "Frame beendet – Break-Ende klicken"
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
    if ((e.target as HTMLElement).closest("button, input, select")) return;
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

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "2vh",
        background: "rgba(0,0,0,0.18)",
      }}
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
          border: "1px solid rgba(255,255,255,0.09)",
          padding: "1.6vh 2vw",
          display: "flex",
          flexDirection: "column",
          gap: "1.2vh",
          width: "82vw",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          ...(pos !== null ? { position: "fixed", top: pos.y, left: pos.x } : {}),
        }}
      >
        {/* Edit mode cancel button */}
        {isEditMode && onCancelEdit && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onCancelEdit}
              style={{ background: "#3a1a1a", color: "#ff8888", border: "1px solid #553333", borderRadius: "6px", padding: "0.45vh 1.2vw", fontSize: "1vw", fontWeight: "bold", cursor: "pointer" }}
            >
              Abbrechen
            </button>
          </div>
        )}

        {/* Phase label + Ball row — centered as a group so label aligns with first ball */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", flexDirection: "column", gap: "0.5vh", alignItems: "flex-start" }}>
            <span style={{ color: foulMode ? "#ff5555" : "#888", fontSize: "1.1vw", fontWeight: "bold" }}>
              {foulMode ? "⚠ FOUL – Welche Farbe war betroffen?" : phaseLabel}
            </span>
            <div style={{ display: "flex", gap: "0.8vw", alignItems: "flex-end" }}>
              {phase !== "colors_only" && (!foulMode || redsRemaining > 0) && (
                <BallButton
                  hex={BALL_HEX.red}
                  enabled={foulMode || isBallEnabled("red")}
                  dimmed={!foulMode && !isBallEnabled("red")}
                  onClick={() => handleBallClick("red")}
                  centerLabel={foulMode ? undefined : String(redsRemaining)}
                  bottomLabel={foulMode ? `+${foulPoints("red")}` : undefined}
                  foulLabelColor="#ff8888"
                />
              )}
              {ALL_COLORS.filter((b) => b !== "red").map((ball) => {
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
                    centerLabel={
                      !foulMode && phase === "colors_only" && ball === COLORS_ORDER[colorsOnlyIndex]
                        ? String(BALL_VALUES[ball])
                        : undefined
                    }
                    bottomLabel={foulMode ? `+${foulPoints(ball)}` : undefined}
                    foulLabelColor="#ff8888"
                  />
                );
              })}
              {freeBallAvailable && !foulMode && playerIndex !== foulByPlayerIndex && (
                <BallButton
                  gradient={`conic-gradient(from 0deg, ${BALL_HEX.yellow}, ${BALL_HEX.green}, ${BALL_HEX.brown}, ${BALL_HEX.blue}, ${BALL_HEX.pink}, ${BALL_HEX.black}, ${BALL_HEX.yellow})`}
                  enabled={true}
                  onClick={() => onPot("freeball")}
                  centerLabel={String(ballOnValue(bbState))}
                  bottomLabel="Freeball"
                  foulLabelColor="#aaffaa"
                />
              )}
            </div>
          </div>
        </div>

        {/* Player name row */}
        {!foulMode && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6vw" }}>
            <span style={{
              color: playerColor, fontSize: "1.35vw", fontWeight: "bold",
              maxWidth: "40vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {playerName}
            </span>
            {isEditMode && (
              <span style={{ color: "#f0c040", fontSize: "0.9vw", fontWeight: "normal" }}>
                [Bearb.]
              </span>
            )}
          </div>
        )}

        {/* Action + Break-Ende row */}
        <div style={{ display: "flex", gap: "1vw", alignItems: "center" }}>
          {foulMode ? (
            <button onClick={() => setFoulMode(false)} style={actionBtn("#3a1a1a", "#ff8888")}>
              Abbrechen
            </button>
          ) : (
            <>
              {breakTotal > 0 && (
                <span style={{ color: "#f0c040", fontSize: "1.35vw", fontWeight: "bold", flexShrink: 0 }}>
                  Break {breakTotal}
                </span>
              )}
              <button onClick={() => setFoulMode(true)} style={actionBtn("#5c1a1a", "#ff5555")}>
                Foul
              </button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5vw" }}>
                {phase !== "colors_only" && (
                  <>
                    <span style={{ color: redsAlreadyCorrected ? "#444" : "#777", fontSize: "1.35vw" }}>Rote:</span>
                    {redsAlreadyCorrected ? (
                      <span style={{ color: "#444", fontSize: "1.35vw", fontStyle: "italic" }}>korrigiert</span>
                    ) : (
                      <>
                        <button
                          onClick={() => setPendingReds(Math.max(0, (pendingReds ?? redsRemaining) - 1))}
                          disabled={(pendingReds ?? redsRemaining) <= 0}
                          style={{ ...actionBtn("#222", "#aaa"), padding: "1vh 0.9vw", opacity: (pendingReds ?? redsRemaining) <= 0 ? 0.3 : 1, cursor: (pendingReds ?? redsRemaining) <= 0 ? "not-allowed" : "pointer" }}
                        >
                          −
                        </button>
                        <span style={{ color: pendingReds !== null ? "#f0c040" : "#bbb", fontSize: "1.35vw", minWidth: "1.7vw", textAlign: "center" }}>
                          {pendingReds ?? redsRemaining}
                        </span>
                        <button
                          onClick={() => setPendingReds(Math.min(15, (pendingReds ?? redsRemaining) + 1))}
                          disabled={(pendingReds ?? redsRemaining) >= 15}
                          style={{ ...actionBtn("#222", "#aaa"), padding: "1vh 0.9vw", opacity: (pendingReds ?? redsRemaining) >= 15 ? 0.3 : 1, cursor: (pendingReds ?? redsRemaining) >= 15 ? "not-allowed" : "pointer" }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => setShowRedsConfirm(true)}
                          style={{ ...actionBtn("#1a3a1a", "#4ade80"), visibility: (pendingReds !== null && pendingReds !== redsRemaining) ? "visible" : "hidden" }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setPendingReds(null)}
                          style={{ ...actionBtn("#2a2a2a", "#888"), visibility: (pendingReds !== null && pendingReds !== redsRemaining) ? "visible" : "hidden" }}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={breakBalls.length > 0 ? onUndo : undefined}
                style={{ ...actionBtn("#1a1a40", "#6688ff"), opacity: breakBalls.length > 0 ? 1 : 0.3, cursor: breakBalls.length > 0 ? "pointer" : "default" }}
              >
                ↻ Undo
              </button>
              <button
                onClick={() => { onMiss(); onClose(); }}
                style={actionBtn("#1a3a1a", "#4ade80")}
              >
                Break-Ende
              </button>
              <button
                onClick={onRedo ?? undefined}
                style={{ ...actionBtn("#0a2a1a", "#4ade80"), opacity: onRedo ? 1 : 0.3, cursor: onRedo ? "pointer" : "default" }}
              >
                Redo ↺
              </button>
            </>
          )}
        </div>

        {/* Current break ball history */}
        {!foulMode && breakBalls.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4vw",
            flexWrap: "wrap",
            borderTop: "1px solid #333",
            paddingTop: "0.8vh",
          }}>
            <span style={{ color: "#555", fontSize: "0.85vw", marginRight: "0.3vw" }}>Break:</span>
            {breakBalls.map((entry, i) => (
              <div
                key={i}
                style={{
                  width: "2vw",
                  height: "2vw",
                  borderRadius: "50%",
                  background: entry.hex,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75vw",
                  fontWeight: "bold",
                  color: "#fff",
                  textShadow: "0 1px 3px #000",
                  flexShrink: 0,
                  border: "1px solid #444",
                }}
              >
                {entry.points}
              </div>
            ))}
          </div>
        )}

        {showRedsConfirm && pendingReds !== null && (
          <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#1e1e1e", border: "1px solid #555", borderRadius: "14px", padding: "4vh 4vw", display: "flex", flexDirection: "column", gap: "2.5vh", alignItems: "center", minWidth: "42vw" }}>
              <div style={{ color: "#fff", fontSize: "2vw", fontWeight: "bold" }}>Rote korrigieren?</div>
              <div style={{ color: "#ccc", fontSize: "1.9vw" }}>
                {redsRemaining} → <span style={{ color: "#f0c040", fontWeight: "bold" }}>{pendingReds}</span> rote Bälle
              </div>
              <div style={{ display: "flex", gap: "1.5vw" }}>
                <button
                  onClick={() => { onCorrectReds(pendingReds); setPendingReds(null); setShowRedsConfirm(false); setRedsAlreadyCorrected(true); }}
                  style={{ background: "#1a3a1a", color: "#4ade80", border: "1px solid #2a5a2a", borderRadius: "8px", padding: "1.2vh 3vw", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
                >
                  Bestätigen
                </button>
                <button
                  onClick={() => { setPendingReds(null); setShowRedsConfirm(false); }}
                  style={{ background: "#3a1a1a", color: "#ff8888", border: "1px solid #553333", borderRadius: "8px", padding: "1.2vh 3vw", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
  bottomLabel,
  foulLabelColor,
}: {
  hex?: string;
  gradient?: string;
  enabled: boolean;
  dimmed?: boolean;
  onClick: () => void;
  centerLabel?: string;
  bottomLabel?: string;
  foulLabelColor?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4vh" }}>
      <button
        onClick={enabled ? onClick : undefined}
        style={{
          width: "5.5vw",
          height: "5.5vw",
          borderRadius: "50%",
          background: gradient || hex || "#333",
          border: `2px solid ${enabled && !dimmed ? "#fff" : "#333"}`,
          cursor: enabled ? "pointer" : "default",
          opacity: dimmed ? 0.2 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5vw",
          fontWeight: "bold",
          color: "#fff",
          textShadow: "0 1px 5px #000, 0 0 10px #000",
          boxShadow: enabled && !dimmed ? "0 0 10px rgba(255,255,255,0.25)" : "none",
          padding: 0,
          transition: "opacity 0.15s, box-shadow 0.15s",
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
    padding: "1vh 1.7vw",
    fontSize: "1.35vw",
    fontWeight: "bold",
    cursor: "pointer",
  };
}

function corrBtn(disabled: boolean): CSSProperties {
  return {
    background: "#222",
    color: disabled ? "#444" : "#aaa",
    border: "1px solid #444",
    borderRadius: "6px",
    padding: "0.35vh 0.8vw",
    fontSize: "1.2vw",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  };
}
