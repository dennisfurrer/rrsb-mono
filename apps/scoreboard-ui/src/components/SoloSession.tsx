import { useEffect, useRef } from "react";
import {
  computeHitMissStats,
  routineById,
  type SoloSessionState,
  type SoloShot,
} from "../lib/solo";

interface Props {
  session: SoloSessionState;
  onHitMissShot?: (shot: SoloShot) => void;
  onUndo?: () => void;
  onChangeRoutine?: () => void;
  onMenuClick: () => void;
}

export function SoloSession({
  session,
  onHitMissShot,
  onUndo,
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

  // Break/series mode has no standalone screen — entry and stats happen in MultiEntryDialog.
  return null;
}
