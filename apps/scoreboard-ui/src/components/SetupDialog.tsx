import { useState } from "react";

interface Props {
  onComplete: (
    name1: string,
    name2: string,
    nat1: string,
    nat2: string,
    bestOf: number
  ) => void;
  defaultBestOf: number;
}

export function SetupDialog({ onComplete, defaultBestOf }: Props) {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [nat1, setNat1] = useState("SUI");
  const [nat2, setNat2] = useState("SUI");
  const [bestOf, setBestOf] = useState(defaultBestOf);

  const handleOk = () => {
    const p1 = name1.trim() || "Player 1";
    const p2 = name2.trim() || "Player 2";
    onComplete(p1, p2, nat1, nat2, bestOf);
  };

  return (
    <div className="setup-overlay">
      <div className="setup-content">
        {/* Player 1 */}
        <div className="setup-player-section">
          <div className="setup-player-header setup-player1-header">
            Player 1:
          </div>
          <input
            className="setup-player-input"
            value={name1}
            onChange={(e) => setName1(e.target.value)}
            placeholder="Player 1"
            autoFocus
          />
          <input
            className="setup-player-input setup-nat-input"
            value={nat1}
            onChange={(e) => setNat1(e.target.value.toUpperCase())}
            placeholder="IOC (e.g. SUI)"
          />
        </div>

        {/* Player 2 */}
        <div className="setup-player-section">
          <div className="setup-player-header setup-player2-header">
            Player 2:
          </div>
          <input
            className="setup-player-input"
            value={name2}
            onChange={(e) => setName2(e.target.value)}
            placeholder="Player 2"
          />
          <input
            className="setup-player-input setup-nat-input"
            value={nat2}
            onChange={(e) => setNat2(e.target.value.toUpperCase())}
            placeholder="IOC (e.g. GER)"
          />
        </div>

        {/* Best of */}
        <div className="setup-bestof-section">
          <div className="setup-bestof-label">Best of frames:</div>
          <div className="setup-bestof-row">
            <button onClick={() => setBestOf((v) => Math.max(1, v - 5))}>
              --
            </button>
            <button onClick={() => setBestOf((v) => Math.max(1, v - 1))}>
              -
            </button>
            <div className="setup-bestof-value">{bestOf}</div>
            <button onClick={() => setBestOf((v) => v + 1)}>+</button>
            <button onClick={() => setBestOf((v) => v + 5)}>++</button>
          </div>
        </div>

        {/* OK */}
        <button className="setup-ok" onClick={handleOk}>
          OK
        </button>
      </div>
    </div>
  );
}
