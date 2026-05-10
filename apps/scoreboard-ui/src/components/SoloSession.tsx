import { useEffect, useRef } from "react";
import {
  computeSoloStats,
  routineById,
  type SoloSessionState,
  type SoloShot,
} from "../lib/solo";

interface Props {
  session: SoloSessionState;
  onShot: (shot: SoloShot) => void;
  onMenuClick: () => void;
}

export function SoloSession({ session, onShot, onMenuClick }: Props) {
  const stats = computeSoloStats(session.shots);
  const routine = routineById(session.routineId);
  const historyRef = useRef<HTMLDivElement>(null);

  const hitRatePct = Math.round(stats.hitRate * 100);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollLeft = historyRef.current.scrollWidth;
    }
  }, [session.shots.length]);

  return (
    <div className="solo">
      <div className="solo-main">
        {/* Header band: routine + player */}
        <div className="solo-header">
          <div className="solo-header-routine">{routine.name}</div>
          <div className="solo-header-player">{session.playerName}</div>
        </div>

        {/* Tally band — yellow (matches frames) */}
        <div className="solo-tally">
          <div className="solo-tally-cell solo-tally-hits">
            <div className="solo-tally-num">{stats.hits}</div>
            <div className="solo-tally-label">Treffer</div>
          </div>
          <div className="solo-tally-cell solo-tally-total">
            <div className="solo-tally-num">{stats.total}</div>
            <div className="solo-tally-label">Versuche</div>
          </div>
          <div className="solo-tally-cell solo-tally-rate">
            <div className="solo-tally-num">{stats.total === 0 ? "—" : `${hitRatePct}%`}</div>
            <div className="solo-tally-label">Trefferquote</div>
          </div>
        </div>

        {/* Streak band */}
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

        {/* Big hit/miss buttons */}
        <div className="solo-buttons">
          <button
            className="solo-btn solo-btn-hit"
            onClick={() => onShot("hit")}
            disabled={session.finished}
          >
            <div className="solo-btn-icon">✓</div>
            <div className="solo-btn-label">TREFFER</div>
          </button>
          <button
            className="solo-btn solo-btn-miss"
            onClick={() => onShot("miss")}
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
        <div className="menu-btn" onClick={onMenuClick}>
          Menu
        </div>
      </div>
    </div>
  );
}
