import { useCallback, useRef, useState } from "react";
import csvText from "../assets/spielerliste.csv?raw";
import { type MatchAssignment, type NamesListEntry } from "../lib/api";

const SETTINGS_CLICKS = 8;
const CLICK_RESET_MS = 2000;

interface PlayerEntry {
  name: string;
  ioc: string;
}

function parseCSV(text: string): PlayerEntry[] {
  const rows = text.split("\n");
  const players: PlayerEntry[] = [];
  for (let i = 2; i < rows.length; i++) {
    const cols = rows[i].split(";");
    const name = (cols[4] || "").trim();
    if (!name) continue;
    const ioc = (cols[24] || "").replace(/\r|\n/g, "").trim();
    players.push({ name, ioc });
  }
  return players;
}

interface Props {
  onComplete: (
    name1: string,
    name2: string,
    nat1: string,
    nat2: string,
    bestOf: number
  ) => void;
  defaultBestOf: number;
  playerList?: NamesListEntry[] | null;
  pendingAssignment?: MatchAssignment | null;
  onStartAssignment?: (a: MatchAssignment) => void;
  onSettingsClick?: () => void;
}

export function SetupDialog({
  onComplete,
  defaultBestOf,
  playerList,
  pendingAssignment,
  onStartAssignment,
  onSettingsClick,
}: Props) {
  const [players] = useState<PlayerEntry[]>(() => {
    if (playerList && playerList.length > 0) {
      return playerList.map((e) => ({
        name: e.playerName,
        ioc: e.nationalityIOC,
      }));
    }
    return parseCSV(csvText);
  });
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [bestOf, setBestOf] = useState(defaultBestOf);

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

  const handleOk = () => {
    const p1 = name1 || "Player 1";
    const p2 = name2 || "Player 2";
    onComplete(p1, p2, getIOC(p1), getIOC(p2), bestOf);
  };

  return (
    <div className="setup-overlay">
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
        <div className="setup-player-header setup-player1-header">
          Spieler 1:
        </div>
        <select
          className="setup-player-select"
          value={name1}
          onChange={(e) => setName1(e.target.value)}
        >
          <option value="" disabled>
            Spieler wählen...
          </option>
          {players.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="setup-player-header setup-player2-header" onClick={handleP2LabelClick}>
          Spieler 2:
        </div>
        <select
          className="setup-player-select"
          value={name2}
          onChange={(e) => setName2(e.target.value)}
        >
          <option value="" disabled>
            Spieler wählen...
          </option>
          {players.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="setup-bestof-label">Best of frames:</div>
        <div className="setup-bestof-buttons">
          <button
            className="bestof-double"
            onClick={() => setBestOf((v) => Math.max(1, v - 5))}
          >
            --
          </button>
          <button
            className="bestof-single"
            onClick={() => setBestOf((v) => Math.max(1, v - 1))}
          >
            -
          </button>
          <div className="setup-bestof-value">{bestOf}</div>
          <button
            className="bestof-single"
            onClick={() => setBestOf((v) => v + 1)}
          >
            +
          </button>
          <button
            className="bestof-double"
            onClick={() => setBestOf((v) => v + 5)}
          >
            ++
          </button>
        </div>
        <button className="setup-ok" onClick={handleOk}>
          OK
        </button>
      </div>
    </div>
  );
}
