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
              <span style={{ color: isTied ? "#fff" : (p1Wins ? "#fff" : "#777"), flex: 1, textAlign: "left", display: "flex", alignItems: "center", gap: "0.5vw", overflow: "hidden", minWidth: 0 }}>
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
              <span style={{ color: isTied ? "#fff" : (p1Wins ? "#777" : "#fff"), flex: 1, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5vw", overflow: "hidden", minWidth: 0 }}>
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
        <button className="menu-btn-new-game" onClick={matchFinished || !hasEntries ? onNewGame : () => setConfirmNewGame(true)}>
          New game / Neues Spiel
        </button>
        {!matchFinished && (
          <button className="menu-btn-rerack" onClick={() => setConfirmRerack(true)}>
            Re-rack
          </button>
        )}
        {((onFrameEnd !== undefined && !isFrameTied) || !!onMatchEnd) && (
          <div style={{ display: "flex", gap: "0.8vw" }}>
            <AutoTextButton
              className="menu-btn-frame-end"
              onClick={onFrameEnd !== undefined && !isFrameTied ? onFrameEnd : undefined}
              disabled={onFrameEnd === undefined || isFrameTied}
              style={{
                flex: 1,
                ...(onFrameEnd === undefined
                  ? { opacity: 0.3, cursor: "not-allowed" }
                  : isFrameTied
                    ? { opacity: 0.4, cursor: "not-allowed" }
                    : {}),
              }}
            >
              🔴 {onFrameEnd !== undefined
                ? (isFrameTied ? "Frame-Ende (Unentschieden!)" : `Frame-Ende (${frameLeader} gewinnt Frame)`)
                : "Frame-Ende"}
            </AutoTextButton>
            <AutoTextButton
              className="menu-btn-match-end"
              style={{ flex: 1, background: "#265c26", color: "#00e600", ...(!onMatchEnd ? { opacity: 0.3, cursor: "not-allowed" } : {}) }}
              onClick={onMatchEnd ? () => setConfirmMatchEnd(true) : undefined}
              disabled={!onMatchEnd}
            >
              🏁 {onMatchEnd
                ? (isTied ? "Match-Ende (Unentschieden)" : `Match-Ende (${matchLeader} gewinnt)`)
                : "Match-Ende"}
            </AutoTextButton>
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
              <span style={{ fontFamily: "'Wingdings 3'" }}>L</span>{" Undo / Letzte Eingabe löschen"}
            </AutoTextButton>
            <AutoTextButton
              className="menu-btn-redo"
              style={{ flex: 1, background: "#1a3a1a", color: "#4ade80", borderColor: "#2a5a2a", ...(!onRedo ? { opacity: 0.3, cursor: "not-allowed" } : {}) }}
              onClick={onRedo}
              disabled={!onRedo}
            >
              {"Redo / Gelöschtes wiederherstellen. "}<span style={{ fontFamily: "'Wingdings 3'" }}>M</span>
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.6vw" }}>
                <span style={{ color: "#8899cc", fontSize: "1.9vw", fontWeight: "bold" }}>
                  Ausspielziel ändern
                </span>
                <button
                  className="menu-btn-info"
                  onClick={(e) => { e.stopPropagation(); setShowBestOfInfo(true); }}
                  type="button"
                  style={{ background: "#1a3a6a", color: "#66aaff", border: "1.5px solid #3366aa", borderRadius: "50%", width: "2.2vw", height: "2.2vw", fontSize: "1.2vw", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
                >
                  ?
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
                <button
                  className="menu-btn-bestof"
                  onClick={() => setPendingBestOf((v) => Math.max(totalFrames, v - 1))}
                  disabled={pendingBestOf <= totalFrames}
                  style={{ background: "#2a2a3a", color: "#ccc", border: "1px solid #555", borderRadius: "6px", fontSize: "2vw", fontWeight: "bold", padding: "0.6vh 1.5vw", cursor: "pointer", width: "auto", textAlign: "center", height: "auto" }}
                >
                  −
                </button>
                <span style={{ color: pendingChanged ? "#f0c040" : "#fff", fontSize: "2.2vw", fontWeight: "bold", minWidth: "7vw", textAlign: "center" }}>
                  Best of {pendingBestOf}
                </span>
                <button
                  className="menu-btn-bestof"
                  onClick={() => setPendingBestOf((v) => v + 1)}
                  style={{ background: "#2a2a3a", color: "#ccc", border: "1px solid #555", borderRadius: "6px", fontSize: "2vw", fontWeight: "bold", padding: "0.6vh 1.5vw", cursor: "pointer", width: "auto", textAlign: "center", height: "auto" }}
                >
                  +
                </button>
              </div>
            </div>
            {pendingChanged && (
              <div style={{ display: "flex", gap: "1vw" }}>
                <button
                  onClick={() => setPendingBestOf(bestOf)}
                  style={{ flex: 1, background: "#3a1a1a", color: "#f87171", border: "none", borderRadius: "6px", fontSize: "1.8vw", fontWeight: "bold", padding: "0.8vh 0", cursor: "pointer", width: "auto", textAlign: "center", height: "auto" }}
                >
                  Abbrechen
                </button>
                <button
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
