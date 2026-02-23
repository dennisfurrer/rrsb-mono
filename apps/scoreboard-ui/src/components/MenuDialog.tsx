import { useState } from "react";

interface Props {
  onUndo: () => void;
  onFrameEnd: () => void;
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
}

export function MenuDialog({
  onUndo,
  onFrameEnd,
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
}: Props) {
  const [confirmMatchEnd, setConfirmMatchEnd] = useState(false);

  const newBestOf = framesP1 + framesP2;
  const p1Wins = framesP1 > framesP2;

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
          <div style={{ color: "#fff", fontSize: "3.16vw", fontWeight: "bold", textAlign: "center" }}>
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
              <span style={{ color: p1Wins ? "#fff" : "#777", flex: 1, textAlign: "left", display: "flex", alignItems: "center", gap: "0.5vw", overflow: "hidden", minWidth: 0 }}>
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
                <span style={{ color: p1Wins ? "#fbbf24" : "#777", fontSize: "2.8vw" }}>
                  {framesP1}
                </span>
                <span style={{ color: "#fff", fontSize: "1.6vw" }}>
                  ({newBestOf})
                </span>
                <span style={{ color: p1Wins ? "#777" : "#fbbf24", fontSize: "2.8vw" }}>
                  {framesP2}
                </span>
              </div>
              {/* Right name */}
              <span style={{ color: p1Wins ? "#777" : "#fff", flex: 1, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5vw", overflow: "hidden", minWidth: 0 }}>
                {!p1Wins && <span style={{ fontSize: "55%", lineHeight: 1, flexShrink: 0 }}>🏆</span>}
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nameP2}</span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "2vw", width: "100%" }}>
            <button
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

  return (
    <div className="overlay" onClick={onClose}>
      <div className="menu-fullscreen" onClick={(e) => e.stopPropagation()}>
        <button className="menu-btn-undo" onClick={onUndo}>
          Undo / Letzte Eingabe löschen
        </button>
        <button className="menu-btn-frame-end" onClick={onFrameEnd}>
          Frame-Ende ({frameLeader} gewinnt)
        </button>
        <button className="menu-btn-rerack" onClick={onRerack}>
          Re-rack
        </button>
        {onMatchEnd && (
          <button className="menu-btn-match-end" onClick={() => setConfirmMatchEnd(true)}>
            Match-Ende ({matchLeader} gewinnt)
          </button>
        )}
        <button className="menu-btn-new-game" onClick={onNewGame}>
          New game / Neues Spiel
        </button>
      </div>
    </div>
  );
}
