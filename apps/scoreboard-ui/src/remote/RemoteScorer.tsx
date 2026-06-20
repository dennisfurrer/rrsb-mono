import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  BALL_HEX,
  BALL_VALUES,
  COLORS_ORDER,
  applyPot,
  type BBBallColor,
  type BBState,
} from "../lib/ballbyball";
import type { RemoteCommand, RemoteSnapshot } from "../lib/remote";
import type { ConnStatus } from "./RemoteApp";

const COLOR_BALLS: BBBallColor[] = ["yellow", "green", "brown", "blue", "pink", "black"];
const ALL_FOUL_BALLS: BBBallColor[] = ["red", ...COLOR_BALLS];
const FREEBALL_GRADIENT = `conic-gradient(from 0deg, ${BALL_HEX.yellow}, ${BALL_HEX.green}, ${BALL_HEX.brown}, ${BALL_HEX.blue}, ${BALL_HEX.pink}, ${BALL_HEX.black}, ${BALL_HEX.yellow})`;

interface Props {
  snapshot: RemoteSnapshot | null;
  myPlayerIndex: 0 | 1 | null;
  status: ConnStatus;
  onCommand: (cmd: RemoteCommand) => void;
  onDisconnect?: () => void;
}

export function RemoteScorer({ snapshot, myPlayerIndex, status, onCommand, onDisconnect }: Props) {
  const [foulPicking, setFoulPicking] = useState(false);
  const [redsEditing, setRedsEditing] = useState(false);
  const [redsDraft, setRedsDraft] = useState(0);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<0 | 1>(0);
  const [isFoul, setIsFoul] = useState(false);
  const [isHandicap, setIsHandicap] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const active = snapshot?.activePlayerIndex === 0 || snapshot?.activePlayerIndex === 1
    ? (snapshot.activePlayerIndex as 0 | 1)
    : 0;

  // Keep the break-mode entry target following whoever is at the table.
  useEffect(() => {
    setTarget(active);
  }, [active]);

  // Reset transient UI when the snapshot meaningfully changes.
  useEffect(() => {
    setFoulPicking(false);
    setRedsEditing(false);
  }, [snapshot?.bbState?.phase, snapshot?.activePlayerIndex, snapshot?.currentFrame]);

  const banner = renderBanner(status, snapshot);

  if (!snapshot) {
    return (
      <div className="rmt-root">
        {banner}
        <div className="rmt-note">Warte auf den Scoreboard-Bildschirm…</div>
      </div>
    );
  }

  const colorVar = (pi: 0 | 1): CSSProperties => ({ "--pc": snapshot.colors[pi] } as CSSProperties);
  const matchType = snapshot.matchType || "Match";

  return (
    <div className="rmt-root">
      {banner}

      <div className="rmt-meta">
        <span>{matchType}</span>
        <span>Frame {snapshot.currentFrame} · Best of {snapshot.bestOf}</span>
      </div>

      <div className="rmt-players">
        {([0, 1] as const).map((pi) => (
          <button
            key={pi}
            className={`rmt-player${pi === 1 ? " rmt-player--right" : ""}${pi === active ? " rmt-player--active" : ""}`}
            style={colorVar(pi)}
            onClick={() => {
              if (!snapshot.finished && pi !== active) onCommand({ t: "switch_player", playerIndex: pi });
            }}
          >
            <div className="rmt-pname">{snapshot.players[pi].name}</div>
            <div className="rmt-pscore">{snapshot.players[pi].score}</div>
            <div className="rmt-pmeta">Frames: {snapshot.players[pi].frames}</div>
            {pi === active && !snapshot.finished && <span className="rmt-tag">Am Tisch</span>}
          </button>
        ))}
      </div>

      {snapshot.finished ? (
        <div className="rmt-finished">🏆 Match beendet</div>
      ) : snapshot.inputMode === "ballbyball" && snapshot.bbState ? (
        <BallByBallPad
          snapshot={snapshot}
          foulPicking={foulPicking}
          setFoulPicking={setFoulPicking}
          redsEditing={redsEditing}
          setRedsEditing={setRedsEditing}
          redsDraft={redsDraft}
          setRedsDraft={setRedsDraft}
          onCommand={onCommand}
        />
      ) : (
        <BreakPad
          snapshot={snapshot}
          input={input}
          setInput={setInput}
          target={target}
          setTarget={setTarget}
          isFoul={isFoul}
          setIsFoul={setIsFoul}
          isHandicap={isHandicap}
          setIsHandicap={setIsHandicap}
          onCommand={onCommand}
        />
      )}

      {myPlayerIndex !== null && (
        <div className="rmt-note">Fernbedienung für {snapshot.players[myPlayerIndex].name}</div>
      )}

      {onDisconnect && (
        confirmDisconnect ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#1a1a1a", border: "1px solid #444", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ color: "#ccc", fontSize: 14, textAlign: "center" }}>Verbindung wirklich trennen?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="rmt-btn rmt-btn--ghost" style={{ flex: 1 }} onClick={() => setConfirmDisconnect(false)}>
                Abbrechen
              </button>
              <button className="rmt-btn rmt-btn--foul" style={{ flex: 1 }} onClick={onDisconnect}>
                Ja, trennen
              </button>
            </div>
          </div>
        ) : (
          <button className="rmt-btn rmt-btn--wide" style={{ background: "#2a1010", borderColor: "#5a2020", color: "#cc5555", fontSize: 14 }} onClick={() => setConfirmDisconnect(true)}>
            Verbindung trennen
          </button>
        )
      )}
    </div>
  );
}

function renderBanner(status: ConnStatus, snapshot: RemoteSnapshot | null) {
  if (status === "reconnecting") {
    return (
      <div className="rmt-banner rmt-banner--reconnecting" style={{ cursor: "pointer" }}
        onClick={() => window.location.reload()}>
        Verbindung unterbrochen — antippen zum Neu laden
      </div>
    );
  }
  if (status === "connecting" || !snapshot) {
    return <div className="rmt-banner rmt-banner--connecting">Verbinde mit dem Scoreboard…</div>;
  }
  return null;
}

// ===== Ball-by-ball pad =====
function BallByBallPad({
  snapshot,
  foulPicking,
  setFoulPicking,
  redsEditing,
  setRedsEditing,
  redsDraft,
  setRedsDraft,
  onCommand,
}: {
  snapshot: RemoteSnapshot;
  foulPicking: boolean;
  setFoulPicking: (b: boolean) => void;
  redsEditing: boolean;
  setRedsEditing: (b: boolean) => void;
  redsDraft: number;
  setRedsDraft: (n: number) => void;
  onCommand: (cmd: RemoteCommand) => void;
}) {
  const bb = snapshot.bbState!;
  const { breakTotal, breakBalls, frameOver } = bb;

  // Optimistic local state: updated immediately on tap, reset when real snapshot arrives.
  const [optBB, setOptBB] = useState<BBState>(bb);
  useEffect(() => { setOptBB(snapshot.bbState!); }, [snapshot]);

  const { phase, redsRemaining, colorsOnlyIndex, freeBallAvailable } = optBB;

  const [lastBreak, setLastBreak] = useState<{ balls: Array<{ hex: string; points: number }>; total: number } | null>(null);
  const prevRef = useRef<{ breakTotal: number; breakBalls: Array<{ hex: string; points: number }>; frame: number } | null>(null);
  const [glowBall, setGlowBall] = useState<string | null>(null);
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerGlow = (ball: string) => {
    if (glowTimer.current) clearTimeout(glowTimer.current);
    setGlowBall(null);
    requestAnimationFrame(() => {
      setGlowBall(ball);
      glowTimer.current = setTimeout(() => setGlowBall(null), 560);
    });
  };

  useEffect(() => {
    const frame = snapshot.currentFrame;
    const prev = prevRef.current;
    if (prev) {
      if (frame !== prev.frame) {
        setLastBreak(null);
      } else if (breakTotal > 0) {
        setLastBreak(null);
      } else if (prev.breakTotal > 0 && breakTotal === 0 && prev.breakBalls.length > 0) {
        setLastBreak({ balls: prev.breakBalls, total: prev.breakTotal });
      }
    }
    prevRef.current = { breakTotal, breakBalls, frame };
  }, [snapshot]);

  const potBall = (ball: Parameters<typeof applyPot>[1]) => {
    navigator.vibrate?.(80);
    triggerGlow(ball);
    setOptBB(prev => applyPot(prev, ball).newState);
    onCommand({ t: "bb_pot", ball });
  };

  const redEnabled = phase !== "colors_only" && redsRemaining > 0;
  const colorEnabled = (c: BBBallColor) => {
    if (phase === "color") return true;
    if (phase === "colors_only") return COLORS_ORDER[colorsOnlyIndex] === c;
    return false;
  };

  if (foulPicking) {
    return (
      <div className="rmt-foul-pick">
        <div className="rmt-foul-pick-title">Foul — welcher Ball?</div>
        <div className="rmt-balls">
          {ALL_FOUL_BALLS.map((c) => (
            <button
              key={c}
              className="rmt-ball"
              style={{ background: BALL_HEX[c] }}
              onClick={() => {
                onCommand({ t: "bb_foul", ball: c });
                setFoulPicking(false);
              }}
            />
          ))}
        </div>
        <button className="rmt-btn rmt-btn--ghost rmt-btn--wide" onClick={() => setFoulPicking(false)}>
          Abbrechen
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rmt-break">
        <span className="rmt-break-total">{breakTotal}</span>
        <span style={{ color: "#777", fontSize: 13 }}>Aufnahme</span>
        <div className="rmt-break-balls">
          {breakBalls.map((b, i) => (
            <span key={i} className="rmt-mini-ball" style={{ background: b.hex }} />
          ))}
        </div>
      </div>

      <div className="rmt-section-label">Lochen</div>
      <div className="rmt-balls">
        <button
          className={`rmt-ball rmt-ball--red${glowBall === "red" ? " rmt-ball--glow" : ""}`}
          style={{ background: BALL_HEX.red }}
          disabled={!redEnabled}
          onClick={() => potBall("red")}
        >
          <span className="rmt-ball-count" style={{ fontSize: 22, padding: "0 6px" }}>{redsRemaining}</span>
        </button>
        {COLOR_BALLS.map((c) => (
          <button
            key={c}
            className={`rmt-ball${glowBall === c ? " rmt-ball--glow" : ""}`}
            style={{ background: BALL_HEX[c] }}
            disabled={!colorEnabled(c)}
            onClick={() => potBall(c)}
          />
        ))}
        {freeBallAvailable && (() => {
          const fbHex = phase === "red" ? BALL_HEX.red
            : phase === "colors_only" ? BALL_HEX[COLORS_ORDER[colorsOnlyIndex]]
            : "#aaa";
          return (
            <button
              className="rmt-ball"
              style={{ background: FREEBALL_GRADIENT, color: "#fff", border: `3px solid ${fbHex}`, boxShadow: `0 0 8px ${fbHex}`, fontSize: 10, fontWeight: "bold", textShadow: "0 1px 4px #000" }}
              onClick={() => potBall("freeball")}
            >
              Freeball
            </button>
          );
        })()}
      </div>

      <button className="rmt-btn rmt-btn--miss rmt-btn--wide" onClick={() => onCommand({ t: "bb_miss" })}>
        {breakTotal > 0 ? "Break-Ende" : "Aufnahme beenden / Fehlstoss"}
      </button>

      <div className="rmt-actions">
        <button className="rmt-btn rmt-btn--foul" onClick={() => setFoulPicking(true)}>
          Foul
        </button>
        <button className="rmt-btn rmt-btn--undo" onClick={() => onCommand({ t: "undo" })}>
          ↶ Undo
        </button>
      </div>

      {redsEditing ? (
        <div className="rmt-reds">
          <span style={{ color: "#aaa", fontSize: 14 }}>🔴 Reds:</span>
          <button className="rmt-step" onClick={() => setRedsDraft(Math.max(0, redsDraft - 1))}>−</button>
          <span className="rmt-reds-val">{redsDraft}</span>
          <button className="rmt-step" onClick={() => setRedsDraft(Math.min(15, redsDraft + 1))}>+</button>
          <button
            className="rmt-btn rmt-btn--primary"
            style={{ flex: 1, minHeight: 44 }}
            onClick={() => {
              onCommand({ t: "bb_correct_reds", count: redsDraft });
              setRedsEditing(false);
            }}
          >
            Setzen
          </button>
        </div>
      ) : (
        <button
          className="rmt-btn rmt-btn--ghost rmt-btn--wide"
          onClick={() => {
            setRedsDraft(redsRemaining);
            setRedsEditing(true);
          }}
        >
          🔴 Reds korrigieren ({redsRemaining})
        </button>
      )}

      {frameOver ? (
        <button className="rmt-btn rmt-btn--primary rmt-btn--wide" onClick={() => onCommand({ t: "end_frame" })}>
          Frame beenden ▸
        </button>
      ) : (
        <button className="rmt-btn rmt-btn--ghost rmt-btn--wide" onClick={() => onCommand({ t: "end_frame" })}>
          Frame beenden
        </button>
      )}

      {lastBreak && (
        <button
          className="rmt-btn rmt-btn--ghost rmt-btn--wide"
          style={{ flexDirection: "column", alignItems: "center", gap: 8, height: "auto", padding: "10px 14px" }}
          onClick={() => {
            onCommand({ t: "edit_last_break" });
            setLastBreak(null);
          }}
        >
          <span style={{ fontSize: 12, color: "#aaa" }}>↶ Letztes Break bearbeiten ({lastBreak.total} Pkt.) — antippen zum Editieren</span>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
            {lastBreak.balls.map((b, i) => (
              <span key={i} className="rmt-mini-ball" style={{ background: b.hex }} />
            ))}
          </div>
        </button>
      )}
    </>
  );
}

// ===== Break / points keypad =====
function BreakPad({
  snapshot,
  input,
  setInput,
  target,
  setTarget,
  isFoul,
  setIsFoul,
  isHandicap,
  setIsHandicap,
  onCommand,
}: {
  snapshot: RemoteSnapshot;
  input: string;
  setInput: (s: string) => void;
  target: 0 | 1;
  setTarget: (n: 0 | 1) => void;
  isFoul: boolean;
  setIsFoul: (b: boolean) => void;
  isHandicap: boolean;
  setIsHandicap: (b: boolean) => void;
  onCommand: (cmd: RemoteCommand) => void;
}) {
  const value = input === "" ? 0 : parseInt(input, 10);
  const press = (d: string) => {
    setInput((input + d).replace(/^0+(?=\d)/, "").slice(0, 4));
  };

  const submit = () => {
    if (value <= 0) return;
    onCommand({ t: "add_points", playerIndex: target, points: value, isFoul, isHandicap });
    setInput("");
    setIsFoul(false);
    setIsHandicap(false);
  };

  return (
    <>
      <div className="rmt-tabs">
        {([0, 1] as const).map((pi) => (
          <button
            key={pi}
            className={`rmt-tab${pi === target ? " rmt-tab--on" : ""}`}
            style={{ "--pc": snapshot.colors[pi] } as CSSProperties}
            onClick={() => setTarget(pi)}
          >
            {snapshot.players[pi].name}
          </button>
        ))}
      </div>

      <div className="rmt-input-display">{input === "" ? "0" : input}</div>

      <div className="rmt-toggles">
        <button
          className={`rmt-toggle${isFoul ? " rmt-toggle--on" : ""}`}
          onClick={() => { setIsFoul(!isFoul); if (!isFoul) setIsHandicap(false); }}
        >
          Foul (an Gegner)
        </button>
        <button
          className={`rmt-toggle${isHandicap ? " rmt-toggle--hc-on" : ""}`}
          onClick={() => { setIsHandicap(!isHandicap); if (!isHandicap) setIsFoul(false); }}
        >
          Handicap
        </button>
      </div>

      <div className="rmt-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} className="rmt-key" onClick={() => press(d)}>{d}</button>
        ))}
        <button className="rmt-key" onClick={() => setInput("")}>C</button>
        <button className="rmt-key" onClick={() => press("0")}>0</button>
        <button className="rmt-key" onClick={() => setInput(input.slice(0, -1))}>⌫</button>
      </div>

      <button className="rmt-btn rmt-btn--primary rmt-btn--wide" disabled={value <= 0} onClick={submit}>
        Eintragen
      </button>

      <button className="rmt-btn rmt-btn--undo rmt-btn--wide" onClick={() => onCommand({ t: "undo" })}>
        ↶ Undo
      </button>
    </>
  );
}
