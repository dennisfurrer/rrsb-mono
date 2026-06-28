import React, { useCallback, useRef, useState } from "react";
import csvText from "../assets/spielerliste.csv?raw";
import { type MatchAssignment, type NamesListEntry } from "../lib/api";
import { iocToFlag } from "../lib/flags";
import { NorthernIrelandFlagIcon } from "./NorthernIrelandFlagIcon";

const SETTINGS_CLICKS = 8;
const CLICK_RESET_MS = 2000;
const HOME_CLUB = "Round Robin Sports";

export const PRACTICE_MODE_VALUE = "__practice__";

interface PlayerEntry {
  name: string;
  ioc: string;
  club: string;
}

function parseCSV(text: string): PlayerEntry[] {
  const rows = text.split("\n");
  const players: PlayerEntry[] = [];
  for (let i = 2; i < rows.length; i++) {
    const cols = rows[i].split(";");
    const name = (cols[4] || "").trim();
    if (!name) continue;
    const ioc = (cols[24] || "").replace(/\r|\n/g, "").trim();
    const club = (cols[5] || "").replace(/\r|\n/g, "").trim();
    players.push({ name, ioc, club });
  }
  return players;
}

function PlayerPicker({
  players,
  title,
  onSelect,
  onCancel,
  extraOption,
}: {
  players: PlayerEntry[];
  title: React.ReactNode;
  onSelect: (val: string) => void;
  onCancel: () => void;
  extraOption?: { label: string; value: string };
}) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const availableLetters = Array.from(
    new Set(players.map(p => p.name[0]?.toUpperCase()).filter(Boolean))
  ).sort((a, b) => {
    const aAlpha = /[A-Z]/.test(a);
    const bAlpha = /[A-Z]/.test(b);
    if (aAlpha && !bAlpha) return -1;
    if (!aAlpha && bAlpha) return 1;
    return a.localeCompare(b);
  });

  const filtered = activeLetter
    ? players.filter(p => p.name[0]?.toUpperCase() === activeLetter)
    : players;

  return (
    <div className="picker-overlay">
      <div className="picker-header">{title}</div>
      <div className="picker-alphabet">
        {[availableLetters.slice(0, 13), availableLetters.slice(13)].map((row, ri) => (
          <div key={ri} className="picker-alphabet-row">
            {row.map(l => (
              <button
                key={l}
                className={`picker-letter${activeLetter === l ? " picker-letter-active" : ""}`}
                onClick={() => setActiveLetter(activeLetter === l ? null : l)}
              >
                {l}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="picker-list">
        {extraOption && (
          <div className="picker-item picker-item-extra" onClick={() => onSelect(extraOption.value)}>
            {extraOption.label}
          </div>
        )}
        {filtered.map(p => {
          const isNIR = p.ioc?.toUpperCase() === "NIR";
          const flag = !isNIR && p.ioc ? iocToFlag(p.ioc) : "";
          const isHomeClub = p.club === HOME_CLUB;
          return (
            <div key={p.name} className={`picker-item${isHomeClub ? " picker-item-home" : ""}`} onClick={() => onSelect(p.name)}>
              {isNIR ? (
                <span style={{ marginRight: "0.5em", display: "inline-block", width: "1.4em", textAlign: "center" }}>
                  <NorthernIrelandFlagIcon style={{ width: "1.1em", height: "0.82em", verticalAlign: "middle" }} />
                </span>
              ) : flag ? (
                <span style={{ marginRight: "0.5em", display: "inline-block", width: "1.4em", textAlign: "center" }}>{flag}</span>
              ) : (
                <span style={{ marginRight: "0.5em", display: "inline-block", width: "1.4em", textAlign: "center", color: "#e0a030", fontWeight: "bold" }}>?</span>
              )}
              {p.name}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="picker-no-result">Keine Spieler unter diesem Buchstaben</div>
        )}
      </div>
      <button className="picker-cancel" onClick={onCancel}>Abbrechen</button>
    </div>
  );
}

const REDS_OPTIONS = [1, 3, 6, 10, 15];

const MATCH_TYPES = [
  "6-Reds",
  "Liga A-Match",
  "Liga B/C-Match",
  "Open-Turnier",
  "QT",
  "Sonstiges Turnier",
  "Swiss Snooker Cup",
  "Trainings-Spiel",
  "Wochenturnier",
] as const;

interface Props {
  onComplete: (
    name1: string,
    name2: string,
    nat1: string,
    nat2: string,
    club1: string,
    club2: string,
    bestOf: number,
    inputMode: "break" | "ballbyball",
    redsCount: number,
    matchType: string,
  ) => void;
  onPracticeStart: (playerName: string) => void;
  defaultBestOf: number;
  defaultName1?: string;
  defaultName2?: string;
  defaultInputMode?: "break" | "ballbyball";
  defaultRedsCount?: number;
  playerList?: NamesListEntry[] | null;
  pendingAssignment?: MatchAssignment | null;
  onStartAssignment?: (a: MatchAssignment) => void;
  onSettingsClick?: () => void;
}

export function SetupDialog({
  onComplete,
  onPracticeStart,
  defaultBestOf,
  defaultName1,
  defaultName2,
  defaultInputMode,
  defaultRedsCount,
  playerList,
  pendingAssignment,
  onStartAssignment,
  onSettingsClick,
}: Props) {
  const [players] = useState<PlayerEntry[]>(() => {
    const csvPlayers = parseCSV(csvText);
    if (playerList && playerList.length > 0) {
      const csvByName = new Map(csvPlayers.map(p => [p.name, p]));
      return playerList.map((e) => {
        const csv = csvByName.get(e.playerName);
        return {
          name: e.playerName,
          ioc: e.nationalityIOC || csv?.ioc || "",
          club: csv?.club || "",
        };
      });
    }
    return csvPlayers;
  });
  const [name1, setName1] = useState(defaultName1 ?? "");
  const [name2, setName2] = useState(defaultName2 ?? "");
  const [bestOf, setBestOf] = useState<number>(() => {
    const saved = localStorage.getItem("lastBestOf");
    return saved ? parseInt(saved) : defaultBestOf;
  });
  const [inputMode, setInputMode] = useState<"break" | "ballbyball">(() =>
    (localStorage.getItem("lastInputMode") as "break" | "ballbyball") ?? defaultInputMode ?? "break"
  );
  const [redsCount, setRedsCount] = useState(defaultRedsCount ?? 15);
  const [picking, setPicking] = useState<1 | 2 | null>(null);
  const [showBestOfNumpad, setShowBestOfNumpad] = useState(false);
  const [numpadDisplay, setNumpadDisplay] = useState("");
  const [showBestOfInfo, setShowBestOfInfo] = useState(false);
  const [showRedsInfo, setShowRedsInfo] = useState(false);
  const [showBreakModeInfo, setShowBreakModeInfo] = useState(false);
  const [showMatchTypeInfo, setShowMatchTypeInfo] = useState(false);
  const [showPlayerInfo, setShowPlayerInfo] = useState(false);
  const [showMatchTypePicker, setShowMatchTypePicker] = useState(false);
  const [hoveredMatchType, setHoveredMatchType] = useState<string | null>(null);
  const hoveredMatchTypeRef = useRef<string | null>(null);
  const [matchType, setMatchType] = useState<string>(
    () => localStorage.getItem("lastMatchType") ?? "Trainings-Spiel"
  );

  const changeBestOf = (val: number) => {
    setBestOf(val);
    localStorage.setItem("lastBestOf", String(val));
  };

  const SIX_REDS_TYPES = ["6-Reds", "Swiss Snooker Cup", "Wochenturnier"];

  const changeInputMode = (mode: "break" | "ballbyball") => {
    setInputMode(mode);
    localStorage.setItem("lastInputMode", mode);
    if (mode === "ballbyball") {
      setRedsCount(SIX_REDS_TYPES.includes(matchType) ? 6 : 15);
    }
  };

  const changeMatchType = (newType: string) => {
    setMatchType(newType);
    localStorage.setItem("lastMatchType", newType);
    const defaultsForType: Record<string, number> = {
      "Wochenturnier": 1,
      "Liga A-Match": 6,
      "Liga B/C-Match": 4,
      "QT": 3,
      "Swiss Snooker Cup": 3,
      "6-Reds": 3,
      "Trainings-Spiel": 5,
    };
    if (newType in defaultsForType) {
      changeBestOf(defaultsForType[newType]);
    }
    if (inputMode === "ballbyball") {
      setRedsCount(SIX_REDS_TYPES.includes(newType) ? 6 : 15);
    }
  };

  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleP2LabelClick = useCallback(() => {
    if (!onSettingsClick) return;
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= SETTINGS_CLICKS) {
      clickCount.current = 0;
      onSettingsClick();
      return;
    }
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, CLICK_RESET_MS);
  }, [onSettingsClick]);

  function getIOC(name: string): string {
    return players.find((p) => p.name === name)?.ioc || "SUI";
  }

  function getClub(name: string): string {
    return players.find((p) => p.name === name)?.club || "?";
  }

  const isPractice = name2 === PRACTICE_MODE_VALUE;
  const isSameName = !isPractice && name1 !== "" && name2 !== "" && name1 === name2;

  const isReady = !isSameName && !!name1 && (isPractice || !!name2);
  const okLabel = !name1
    ? "Wähle Spieler 1"
    : !isPractice && !name2
    ? "Wähle Spieler 2"
    : isSameName
    ? "Gleiche Namen!"
    : isPractice
    ? "Training starten"
    : "Spiel starten";

  const handleOk = () => {
    if (isPractice) {
      const p1 = name1 || "Spieler";
      onPracticeStart(p1);
      return;
    }
    const p1 = name1 || "Player 1";
    const p2 = name2 || "Player 2";
    onComplete(p1, p2, getIOC(p1), getIOC(p2), getClub(p1), getClub(p2), bestOf, inputMode, redsCount, matchType);
  };

  const isPractice2 = name2 === PRACTICE_MODE_VALUE;

  const groupBox: React.CSSProperties = {
    background: "#161616",
    border: "1px solid #555",
    borderRadius: "10px",
    padding: "1.4vh 1.4vw",
    display: "flex",
    flexDirection: "column",
    gap: "0.9vh",
  };

  const groupLabel: React.CSSProperties = {
    borderTop: "none",
    marginTop: 0,
    paddingTop: 0,
  };

  return (
    <div className="setup-overlay">
      {picking !== null && (
        <PlayerPicker
          players={players}
          title={picking === 1 ? "Wähle Spieler 1" : <>Wähle Spieler 2 oder <span style={{ color: "#4ade80", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setName2(PRACTICE_MODE_VALUE); setPicking(null); }}>SOLO-Training</span></>}
          extraOption={picking === 2 ? { label: "SOLO TRAINING", value: PRACTICE_MODE_VALUE } : undefined}
          onSelect={(val) => {
            if (picking === 1) setName1(val);
            else setName2(val);
            setPicking(null);
          }}
          onCancel={() => setPicking(null)}
        />
      )}
      <div className="setup-content">
        {pendingAssignment && onStartAssignment && (
          <div
            className="setup-assignment-banner"
            onClick={() => onStartAssignment(pendingAssignment)}
          >
            <span className="setup-assignment-info">
              {pendingAssignment.player1Name} vs {pendingAssignment.player2Name}
              {" "}(Bo{pendingAssignment.bestOf})
            </span>
            <button className="setup-assignment-start">Start</button>
          </div>
        )}

        {/* Group 1: Spieler nebeneinander */}
        <div style={{ ...groupBox, flexDirection: "row", gap: "1.5vw" }}>
          {/* Spieler 1 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.9vh" }}>
            <div className="setup-player-header setup-player1-header" style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
              Spieler 1:
              <button
                onClick={(e) => { e.stopPropagation(); setShowPlayerInfo(true); }}
                type="button"
                className="setup-info-btn"
                style={{ background: "#1a3a6a", color: "#66aaff", border: "1.5px solid #3366aa", borderRadius: "50%", width: "2.2vw", height: "2.2vw", fontSize: "1.2vw", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
              >
                ?
              </button>
            </div>
            <div className="setup-player-btn-row">
              {name1 && <div style={{ width: "3.8vw", flexShrink: 0 }} />}
              <button className="setup-player-pick-btn" onClick={() => setPicking(1)}>
                {name1 || "Spieler wählen…"}
              </button>
              {name1 && <button className="setup-player-clear-btn" onClick={() => setName1("")}>✕</button>}
            </div>
          </div>

          {/* Spieler 2 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.9vh" }}>
            <div
              className={`setup-player-header ${isPractice2 ? "setup-practice-header" : "setup-player2-header"}`}
              onClick={handleP2LabelClick}
            >
              {isPractice2 ? "Modus:" : "Spieler 2:"}
            </div>
            <div className="setup-player-btn-row">
              {name2 && <div style={{ width: "3.8vw", flexShrink: 0 }} />}
              <button className="setup-player-pick-btn" onClick={() => setPicking(2)}>
                {isPractice2 ? "SOLO TRAINING" : (name2 || "Spieler wählen…")}
              </button>
              {name2 && <button className="setup-player-clear-btn" onClick={() => setName2("")}>✕</button>}
            </div>
          </div>
        </div>

        {isPractice && (
          <button
            type="button"
            className="setup-exit-practice"
            onClick={() => setName2("")}
          >
            ← Zurück zum normalen Spiel-Setup
          </button>
        )}

        {!isPractice && (
          <>
            {/* Group 2: Matchart (links, immer) + Rote zu Beginn (rechts, nur ballbyball) */}
            <div style={{ ...groupBox, flexDirection: "row", gap: "1.5vw" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.9vh" }}>
                <div className="setup-bestof-label" style={{ ...groupLabel, flexDirection: "row", gap: "0.8vw" }}>
                  <span>Matchart:</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMatchTypeInfo(true); }}
                    type="button"
                    className="setup-info-btn"
                    style={{ background: "#1a3a6a", color: "#66aaff", border: "1.5px solid #3366aa", borderRadius: "50%", width: "2.2vw", height: "2.2vw", fontSize: "1.2vw", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
                  >
                    ?
                  </button>
                </div>
                <div style={{ position: "relative", flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => setShowMatchTypePicker((v) => !v)}
                    className="setup-matchtype-btn"
                    style={{
                      width: "100%",
                      minHeight: "9vh",
                      fontSize: "1.55vw",
                      fontWeight: "bold",
                      background: "#1e1e1e",
                      color: "#ddd",
                      border: "1px solid #555",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5vw",
                    }}
                  >
                    <span>{matchType}</span>
                    <span style={{ fontSize: "1vw", color: "#666" }}>▼</span>
                  </button>
                  {showMatchTypePicker && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#252525",
                        border: "1px solid #555",
                        borderRadius: "6px",
                        zIndex: 400,
                        maxHeight: "55vh",
                        overflowY: "auto",
                        marginTop: "0.4vh",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
                      }}
                      onTouchMove={(e) => {
                        const touch = e.touches[0];
                        const el = document.elementFromPoint(touch.clientX, touch.clientY);
                        const btn = el?.closest("[data-mt]");
                        const t = btn?.getAttribute("data-mt") ?? null;
                        hoveredMatchTypeRef.current = t;
                        setHoveredMatchType(t);
                      }}
                      onTouchEnd={() => {
                        const selected = hoveredMatchTypeRef.current;
                        if (selected) { changeMatchType(selected); setShowMatchTypePicker(false); }
                        hoveredMatchTypeRef.current = null;
                        setHoveredMatchType(null);
                      }}
                    >
                      {MATCH_TYPES.map((t) => {
                        const active = t === matchType;
                        const hovered = t === hoveredMatchType;
                        return (
                          <button
                            key={t}
                            type="button"
                            data-mt={t}
                            onClick={() => { changeMatchType(t); setShowMatchTypePicker(false); }}
                            onMouseEnter={() => setHoveredMatchType(t)}
                            onMouseLeave={() => setHoveredMatchType(null)}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "1.2vh 1vw",
                              fontSize: "1.5vw",
                              fontWeight: active || hovered ? "bold" : "normal",
                              background: hovered ? "#2a5a2a" : active ? "#1a3a1a" : "transparent",
                              color: hovered || active ? "#4ade80" : "#ccc",
                              border: "none",
                              borderBottom: "1px solid #333",
                              cursor: "pointer",
                              textAlign: "center",
                              fontFamily: "inherit",
                            }}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.9vh" }}>
                {inputMode === "ballbyball" && (
                  <>
                    <div className="setup-bestof-label" style={{ ...groupLabel, flexDirection: "row", gap: "0.8vw" }}>
                      <span>Rote zu Beginn:</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowRedsInfo(true); }}
                        type="button"
                        className="setup-info-btn"
                    style={{ background: "#1a3a6a", color: "#66aaff", border: "1.5px solid #3366aa", borderRadius: "50%", width: "2.2vw", height: "2.2vw", fontSize: "1.2vw", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
                      >
                        ?
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: "0.5vw", flex: 1 }}>
                      {REDS_OPTIONS.map((n) => (
                        <button
                          key={n}
                          onClick={() => setRedsCount(n)}
                          className="setup-reds-btn"
                          style={{
                            flex: 1,
                            fontSize: "2vw",
                            fontWeight: "bold",
                            minHeight: "9vh",
                            border: "1px solid " + (redsCount === n ? "#4a3010" : "#2a2a2a"),
                            cursor: "pointer",
                            background: redsCount === n ? "#2a1e0a" : "#1e1e1e",
                            color: redsCount === n ? "#ffaa44" : "#555",
                            transition: "all 0.15s",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Group 3: Break-Eingabe */}
            <div style={groupBox}>
              <div className="setup-bestof-label" style={{ ...groupLabel, flexDirection: "row", gap: "0.8vw" }}>
                <span>Break-Eingabe:</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowBreakModeInfo(true); }}
                  type="button"
                  className="setup-info-btn"
                  style={{ background: "#1a3a6a", color: "#66aaff", border: "1.5px solid #3366aa", borderRadius: "50%", width: "2.2vw", height: "2.2vw", fontSize: "1.2vw", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
                >
                  ?
                </button>
              </div>
              <div style={{ display: "flex", gap: "0.5vw" }}>
                {(["break", "ballbyball"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => changeInputMode(mode)}
                    className="setup-mode-btn"
                    style={{
                      flex: 1,
                      fontSize: "1.8vw",
                      fontWeight: "bold",
                      minHeight: "9vh",
                      border: "1px solid " + (inputMode === mode ? "#2a5a2a" : "#2a2a2a"),
                      cursor: "pointer",
                      background: inputMode === mode ? "#1a3a1a" : "#1e1e1e",
                      color: inputMode === mode ? "#4ade80" : "#555",
                      transition: "all 0.15s",
                    }}
                  >
                    {mode === "break" ? "Ganzes Break" : "Ball für Ball"}
                  </button>
                ))}
              </div>
            </div>

            {/* Group 4: Best of frames */}
            <div style={groupBox}>
              <div className="setup-bestof-label" style={{ ...groupLabel, flexDirection: "row", gap: "0.8vw" }}>
                <span>Best of frames:</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowBestOfInfo(true); }}
                  type="button"
                  className="setup-info-btn"
                  style={{ background: "#1a3a6a", color: "#66aaff", border: "1.5px solid #3366aa", borderRadius: "50%", width: "2.2vw", height: "2.2vw", fontSize: "1.2vw", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}
                >
                  ?
                </button>
              </div>
              <div className="setup-bestof-buttons">
                <button
                  className="bestof-single"
                  onClick={() => changeBestOf(Math.max(1, bestOf - 1))}
                >
                  −
                </button>
                <div
                  className="setup-bestof-value"
                  style={{ cursor: "pointer", textDecoration: "underline dotted #555" }}
                  onClick={() => { setNumpadDisplay(""); setShowBestOfNumpad(true); }}
                  title="Direkt eingeben"
                >
                  {bestOf}
                </div>
                <button
                  className="bestof-single"
                  onClick={() => changeBestOf(bestOf + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </>
        )}

        {isSameName && (
          <div className="setup-same-name-warning">
            Beide Spieler haben denselben Namen!
          </div>
        )}
        <button className="setup-ok" onClick={handleOk} disabled={!isReady}>
          {okLabel}
        </button>
      </div>

      {showBestOfInfo && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
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
              onClick={() => setShowBestOfInfo(false)}
              className="menu-btn-info"
              style={{ alignSelf: "center", padding: "1.2vh 4vw", fontSize: "1.7vw", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: "#1a3a6a", color: "#66aaff", fontFamily: "inherit", marginTop: "0.5vh" }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showPlayerInfo && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowPlayerInfo(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1a1e2e", border: "1px solid #3366aa", borderRadius: "14px", padding: "4vh 3.5vw", width: "62vw", display: "flex", flexDirection: "column", gap: "2vh" }}
          >
            <div style={{ color: "#66aaff", fontSize: "2.2vw", fontWeight: "bold" }}>Wähle Spieler 1</div>
            <ul style={{ color: "#ccc", fontSize: "1.65vw", lineHeight: 1.7, paddingLeft: "1.6em", margin: 0, display: "flex", flexDirection: "column", gap: "0.8vh" }}>
              <li>Klicke auf <span style={{ color: "#ffcc00" }}>Spieler wählen…</span> und dann auf einen Buchstaben, um nur Spieler mit diesem Nachnamen anzuzeigen.</li>
              <li>Klicke erneut auf den Buchstaben, damit wieder alle Namen angezeigt werden.</li>
              <li>Unsere Clubspieler sind im Auswahlfenster hell hinterlegt.</li>
            </ul>
            <button
              onClick={() => setShowPlayerInfo(false)}
              className="menu-btn-info"
              style={{ alignSelf: "center", padding: "1.2vh 4vw", fontSize: "1.7vw", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: "#1a3a6a", color: "#66aaff", fontFamily: "inherit", marginTop: "0.5vh" }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {showMatchTypeInfo && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowMatchTypeInfo(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1a1e2e", border: "1px solid #3366aa", borderRadius: "14px", padding: "4vh 3.5vw", width: "62vw", display: "flex", flexDirection: "column", gap: "2vh" }}
          >
            <div style={{ color: "#66aaff", fontSize: "2.2vw", fontWeight: "bold" }}>
              Matchart
            </div>
            <div style={{ color: "#ccc", fontSize: "1.65vw", lineHeight: 1.7 }}>
              Die gewählte Matchart wird auf dem Scoreboard angezeigt und dient der Auswertung und Statistik.
            </div>
            {[
              ["6-Reds", "Kurzformat mit 6 roten Bällen (6 Rote vorgewählt)."],
              ["Liga A-Match", "Offizielle Begegnung in der A-Liga (Best of 6, 15 Rote)."],
              ["Liga B/C-Match", "Offizielle Begegnung in der B- oder C-Liga (Best of 4, 15 Rote)."],
              ["Open-Turnier", "Offenes Turnier für alle Spieler."],
              ["QT", "Qualifikationsturnier."],
              ["Sonstiges Turnier", "Andere Turnierformen, die nicht in die übrigen Kategorien passen."],
              ["Swiss Snooker Cup", "Nationaler Cup-Wettbewerb (6 Rote vorgewählt)."],
              ["Trainings-Spiel", "Übungspartie ohne Turniercharakter."],
              ["Wochenturnier", "Wöchentliches Clubturnier (Best of 1 mit 6 Roten)."],
            ].map(([name, desc]) => (
              <div key={name} style={{ color: "#ccc", fontSize: "1.55vw", lineHeight: 1.5 }}>
                <strong style={{ color: "#fff" }}>{name}</strong> — {desc}
              </div>
            ))}
            <button
              onClick={() => setShowMatchTypeInfo(false)}
              className="menu-btn-info"
              style={{ alignSelf: "center", padding: "1.2vh 4vw", fontSize: "1.7vw", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: "#1a3a6a", color: "#66aaff", fontFamily: "inherit", marginTop: "0.5vh" }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showRedsInfo && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowRedsInfo(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1a1e2e", border: "1px solid #3366aa", borderRadius: "14px", padding: "4vh 3.5vw", width: "58vw", display: "flex", flexDirection: "column", gap: "2.5vh" }}
          >
            <div style={{ color: "#66aaff", fontSize: "2.2vw", fontWeight: "bold" }}>
              Rote zu Beginn
            </div>
            <div style={{ color: "#ccc", fontSize: "1.75vw", lineHeight: 1.75 }}>
              Nur bei Break-Eingabe <strong style={{ color: "#fff" }}>Ball für Ball</strong> notwendig.
            </div>
            <div style={{ color: "#ccc", fontSize: "1.75vw", lineHeight: 1.75 }}>
              Gibt an, mit wie vielen roten Bällen das Frame begonnen wird. Bei einem normalen Snooker-Frame sind es 15. Bei 6-Reds oder Swiss Snooker Cup sind es 6.
            </div>
            <button
              onClick={() => setShowRedsInfo(false)}
              className="menu-btn-info"
              style={{ alignSelf: "center", padding: "1.2vh 4vw", fontSize: "1.7vw", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: "#1a3a6a", color: "#66aaff", fontFamily: "inherit", marginTop: "0.5vh" }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showBreakModeInfo && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowBreakModeInfo(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1a1e2e", border: "1px solid #3366aa", borderRadius: "14px", padding: "4vh 3.5vw", width: "58vw", display: "flex", flexDirection: "column", gap: "2.5vh" }}
          >
            <div style={{ color: "#66aaff", fontSize: "2.2vw", fontWeight: "bold" }}>
              Break-Eingabe
            </div>
            <div style={{ color: "#ccc", fontSize: "1.75vw", lineHeight: 1.75 }}>
              <strong style={{ color: "#fff" }}>Ganzes Break</strong><br />
              Die Gesamtpunktzahl eines Breaks wird auf einmal eingegeben. Einfach und schnell für den normalen Spielbetrieb.
            </div>
            <div style={{ color: "#ccc", fontSize: "1.75vw", lineHeight: 1.75 }}>
              <strong style={{ color: "#fff" }}>Ball für Ball</strong><br />
              Jeder gespielte Ball wird einzeln erfasst. Das System erkennt automatisch Breaks, berechnet den höchsten Break und erstellt detaillierte Statistiken zum Spielverlauf.
            </div>
            <button
              onClick={() => setShowBreakModeInfo(false)}
              className="menu-btn-info"
              style={{ alignSelf: "center", padding: "1.2vh 4vw", fontSize: "1.7vw", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: "#1a3a6a", color: "#66aaff", fontFamily: "inherit", marginTop: "0.5vh" }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showBestOfNumpad && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowBestOfNumpad(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1e1e1e", borderRadius: "14px", padding: "2.5vh 2.5vw", display: "flex", flexDirection: "column", gap: "1.5vh", width: "36vw" }}
          >
            <div style={{ color: "#888", fontSize: "1.4vw", fontWeight: "bold", textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Best of Frames
            </div>
            <div style={{ background: "#111", borderRadius: "8px", padding: "1.2vh 1.5vw", textAlign: "center", fontSize: "4.5vw", fontWeight: "bold", color: numpadDisplay ? "#fff" : "#444", minHeight: "8vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {numpadDisplay || bestOf}
            </div>
            {[
              [1, 2, 3],
              [4, 5, 6],
              [7, 8, 9],
            ].map((row) => (
              <div key={row[0]} style={{ display: "flex", gap: "1vw" }}>
                {row.map((d) => (
                  <button
                    key={d}
                    onClick={() => setNumpadDisplay((p) => p.length >= 2 ? p : p + String(d))}
                    className="bbb-btn-stepper"
                    style={{ flex: 1, fontSize: "2.8vw", fontWeight: "bold", background: "#2a2a2a", color: "#ddd", border: "1px solid #444", borderRadius: "8px", padding: "1.5vh 0", cursor: "pointer" }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            ))}
            <div style={{ display: "flex", gap: "1vw" }}>
              <button
                onClick={() => setNumpadDisplay("")}
                className="bbb-btn-cancel"
                style={{ flex: 1, fontSize: "1.8vw", fontWeight: "bold", background: "#2a1a1a", color: "#f87171", border: "1px solid #553333", borderRadius: "8px", padding: "1.5vh 0", cursor: "pointer" }}
              >
                Löschen
              </button>
              <button
                onClick={() => setNumpadDisplay((p) => p === "" || p.length >= 2 ? p : p + "0")}
                className="bbb-btn-stepper"
                style={{ flex: 1, fontSize: "2.8vw", fontWeight: "bold", background: "#2a2a2a", color: "#ddd", border: "1px solid #444", borderRadius: "8px", padding: "1.5vh 0", cursor: "pointer" }}
              >
                0
              </button>
              <button
                onClick={() => {
                  const val = parseInt(numpadDisplay);
                  if (val >= 1) changeBestOf(val);
                  setShowBestOfNumpad(false);
                }}
                className="bbb-btn-ok"
                style={{ flex: 1, fontSize: "1.8vw", fontWeight: "bold", background: "#1a3a1a", color: "#4ade80", border: "1px solid #2a5a2a", borderRadius: "8px", padding: "1.5vh 0", cursor: "pointer" }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
