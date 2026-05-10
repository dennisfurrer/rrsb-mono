import { useState } from "react";
import {
  computeSoloStats,
  routineById,
  type SoloSessionState,
} from "../lib/solo";

interface Props {
  session: SoloSessionState;
  onUndo: () => void;
  onChangeRoutine: () => void;
  onResetSession: () => void;
  onEndPractice: () => void;
  onClose: () => void;
}

export function SoloMenuDialog({
  session,
  onUndo,
  onChangeRoutine,
  onResetSession,
  onEndPractice,
  onClose,
}: Props) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const stats = computeSoloStats(session.shots);
  const routine = routineById(session.routineId);
  const hitRatePct = Math.round(stats.hitRate * 100);

  if (confirmEnd) {
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
          <div style={{ color: "#fff", fontSize: "2.6vw", fontWeight: "bold", textAlign: "center" }}>
            Übung wirklich beenden?
          </div>
          <div
            style={{
              width: "100%",
              background: "#1a1a1a",
              borderRadius: "8px",
              padding: "2vh 2vw",
              display: "flex",
              flexDirection: "column",
              gap: "1vh",
            }}
          >
            <div style={{ color: "#fbbf24", fontSize: "1.8vw", fontWeight: "bold", textAlign: "center" }}>
              {routine.name} &mdash; {session.playerName}
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", color: "#fff", fontSize: "1.6vw" }}>
              <span>{stats.hits} / {stats.total}</span>
              <span>{stats.total === 0 ? "—" : `${hitRatePct}%`}</span>
              <span>Beste Serie: {stats.bestStreak}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "2vw", width: "100%" }}>
            <button
              onClick={onEndPractice}
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
              onClick={() => setConfirmEnd(false)}
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

  return (
    <div className="overlay" onClick={onClose}>
      <div className="menu-fullscreen" onClick={(e) => e.stopPropagation()}>
        <button
          className="menu-btn-undo"
          onClick={onUndo}
          disabled={session.shots.length === 0}
        >
          Undo / Letzte Eingabe löschen
        </button>
        <button className="menu-btn-rerack" onClick={onResetSession}>
          Übung neu starten
        </button>
        <button className="menu-btn-frame-end" onClick={onChangeRoutine}>
          Andere Übung wählen
        </button>
        <button className="menu-btn-new-game" onClick={() => setConfirmEnd(true)}>
          Practice beenden
        </button>
      </div>
    </div>
  );
}
