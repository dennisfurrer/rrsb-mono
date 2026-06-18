import { useEffect, useRef } from "react";
import {
  BALL_COLORS,
  MISS_TYPES,
  POCKETS,
  computeBreakStats,
  computeHitMissStats,
  routineById,
  type BreakAttempt,
  type SoloSessionState,
  type SoloShot,
} from "../lib/solo";

interface Props {
  session: SoloSessionState;
  onHitMissShot?: (shot: SoloShot) => void;
  onUndo?: () => void;
  onNewSession?: () => void;
  onChangeRoutine?: () => void;
  onMenuClick: () => void;
}

export function SoloSession({
  session,
  onHitMissShot,
  onUndo,
  onNewSession,
  onChangeRoutine,
  onMenuClick,
}: Props) {
  const routine = routineById(session.routineId);
  const displayName =
    session.routineId === "ball1521" && session.mode === "break"
      ? `${session.redsCount}er-Ball`
      : routine.name;
  const historyRef = useRef<HTMLDivElement>(null);

  const historyLen =
    session.mode === "hitmiss" ? session.shots.length : session.attempts.length;

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollLeft = historyRef.current.scrollWidth;
    }
  }, [historyLen]);

  if (session.mode === "hitmiss") {
    const stats = computeHitMissStats(session.shots);
    const hitRatePct = Math.round(stats.hitRate * 100);

    return (
      <div className="solo">
        <div className="solo-main">
          <div className="solo-header">
            <div className="solo-header-routine">{displayName}</div>
            <div className="solo-header-player">{session.playerName}</div>
          </div>

          <div className="solo-tally">
            <div className="solo-tally-cell">
              <div className="solo-tally-num">{stats.hits}</div>
              <div className="solo-tally-label">Treffer</div>
            </div>
            <div className="solo-tally-cell">
              <div className="solo-tally-num">{stats.total}</div>
              <div className="solo-tally-label">Versuche</div>
            </div>
            <div className="solo-tally-cell">
              <div className="solo-tally-num">
                {stats.total === 0 ? "—" : `${hitRatePct}%`}
              </div>
              <div className="solo-tally-label">Trefferquote</div>
            </div>
          </div>

          <div className="solo-streaks">
            <div className="solo-streak">
              <span className="solo-streak-label">Aktuelle Serie:</span>
              <span className="solo-streak-value">{stats.currentStreak}</span>
            </div>
            <div className="solo-streak">
              <span className="solo-streak-label">Beste Serie:</span>
              <span className="solo-streak-value">{stats.bestStreak}</span>
            </div>
          </div>

          <div className="solo-buttons">
            <button
              className="solo-btn solo-btn-hit"
              onClick={() => onHitMissShot?.("hit")}
              disabled={session.finished}
            >
              <div className="solo-btn-icon">✓</div>
              <div className="solo-btn-label">TREFFER</div>
            </button>
            <button
              className="solo-btn solo-btn-miss"
              onClick={() => onHitMissShot?.("miss")}
              disabled={session.finished}
            >
              <div className="solo-btn-icon">✕</div>
              <div className="solo-btn-label">FEHLER</div>
            </button>
          </div>
        </div>

        <div className="bottom-bar">
          <div className="history-log" ref={historyRef}>
            {session.shots.map((s, i) => (
              <span
                key={i}
                style={{
                  letterSpacing: "0.05em",
                  color: s === "hit" ? "#4ade80" : "#f87171",
                }}
              >
                {s === "hit" ? "● Treffer" : "○ Fehler"}{" "}
              </span>
            ))}
          </div>
          <button
            className="bottom-bar-secondary bottom-bar-undo"
            onClick={onUndo}
            disabled={session.shots.length === 0}
            type="button"
          >
            ↩ Undo
          </button>
          <button
            className="bottom-bar-secondary"
            onClick={onChangeRoutine}
            type="button"
          >
            ← Zurück
          </button>
          <div className="menu-btn" onClick={onMenuClick}>
            Menu
          </div>
        </div>
      </div>
    );
  }

  // Break-mode UI — stats only, entry happens in MultiEntryDialog
  const stats = computeBreakStats(session.attempts);
  const avg = stats.totalAttempts === 0 ? "—" : stats.averageBreak.toFixed(1);

  return (
    <div className="solo">
      <div className="solo-main">
        <div className="solo-header">
          <div className="solo-header-routine">
            {displayName}
            {!routine.seriesMode && session.routineId !== "ball1521" && session.routineId !== "farben-endlos" && (
              <span className="solo-header-reds-text">
                {session.redsCount} Rote
              </span>
            )}
          </div>
          <div className="solo-header-player">{session.playerName}</div>
        </div>

        <div className="solo-tally solo-tally-4">
          <div className="solo-tally-cell">
            <div className="solo-tally-num">{stats.highestBreak || "—"}</div>
            <div className="solo-tally-label">Höchste</div>
          </div>
          <div className="solo-tally-cell">
            <div className="solo-tally-num">{avg}</div>
            <div className="solo-tally-label">Schnitt</div>
          </div>
          <div className="solo-tally-cell">
            <div className="solo-tally-num">{stats.clearedCount}</div>
            <div className="solo-tally-label">Clearance</div>
          </div>
          <div className="solo-tally-cell">
            <div className="solo-tally-num">{stats.totalAttempts}</div>
            <div className="solo-tally-label">Versuche</div>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <div className="history-log" ref={historyRef}>
          {session.attempts.map((a, i) => (
            <BreakLogEntry key={i} attempt={a} />
          ))}
        </div>
        <button
          className="bottom-bar-secondary"
          onClick={onNewSession}
          type="button"
        >
          Neue Session
        </button>
        <button
          className="bottom-bar-secondary"
          onClick={onChangeRoutine}
          type="button"
        >
          ← Zurück
        </button>
        <div className="menu-btn" onClick={onMenuClick}>
          Menu
        </div>
      </div>
    </div>
  );
}

function BreakLogEntry({ attempt }: { attempt: BreakAttempt }) {
  if (attempt.kind === "missed") {
    return (
      <span style={{ letterSpacing: "0.05em", color: "#f87171" }}>
        ✕ Verfehlt{" "}
      </span>
    );
  }
  const tags: string[] = [];
  if (attempt.missType) {
    const m = MISS_TYPES.find((x) => x.id === attempt.missType);
    if (m) tags.push(m.label);
  }
  if (attempt.ball) {
    const b = BALL_COLORS.find((x) => x.id === attempt.ball);
    if (b) tags.push(b.label);
  }
  if (attempt.pocket) {
    const p = POCKETS.find((x) => x.id === attempt.pocket);
    if (p) tags.push(p.label);
  }
  return (
    <span style={{ letterSpacing: "0.05em", color: "#4ade80" }}>
      ● {attempt.value}
      {attempt.clearance && (
        <span style={{ color: "#ffee44", fontWeight: "bold" }}> ★ Clearance</span>
      )}
      {tags.length > 0 && (
        <span style={{ color: "#888", fontWeight: "normal" }}>
          {" "}({tags.join(", ")})
        </span>
      )}{" "}
    </span>
  );
}
