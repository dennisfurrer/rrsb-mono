import type { MatchState } from "../lib/model";
import { useAutoFontSize } from "../hooks/useAutoFontSize";

interface Props {
  match: MatchState;
  onPlayerClick: (playerIndex: number) => void;
  onMenuClick: () => void;
  history: { label: string }[];
}

function AutoSizeText({
  text,
  deps,
}: {
  text: string;
  deps: unknown[];
}) {
  const ref = useAutoFontSize(deps);
  return (
    <div ref={ref} style={{ whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
}

export function Scoreboard({ match, onPlayerClick, onMenuClick, history }: Props) {
  const [p1, p2] = match.players;

  return (
    <div className="scoreboard">
      <div className="scoreboard-main">
        {/* Player 1 */}
        <div
          className={`player-panel ${match.activePlayerIndex !== 0 ? "inactive" : ""}`}
          onClick={() => onPlayerClick(0)}
        >
          <div className="player-name auto-size">
            <AutoSizeText text={p1.name} deps={[p1.name]} />
          </div>
          <div className="player-frames auto-size">
            <AutoSizeText text={String(p1.frames)} deps={[p1.frames]} />
          </div>
          <div className="player-score auto-size">
            <AutoSizeText text={String(p1.score)} deps={[p1.score]} />
          </div>
          <div className="player-breaks">
            {p1.highbreaks
              .slice(0, 5)
              .map((b, i) => (
                <span key={i}>{b}</span>
              ))}
          </div>
        </div>

        {/* Center */}
        <div className="center-panel">
          <div className="center-row name-row">
            {p1.winner && <span>🏆</span>}
            {p2.winner && <span>🏆</span>}
            {!p1.winner && !p2.winner && (
              <span style={{ fontSize: "0.6em", color: "#666" }}>
                Best of {match.bestOf}
              </span>
            )}
          </div>
          <div className="center-row frames-row">
            <AutoSizeText text="Frames" deps={[]} />
          </div>
          <div className="center-row score-row">
            <AutoSizeText text="Score" deps={[]} />
          </div>
          <div className="center-row breaks-row">Breaks &gt;7</div>
        </div>

        {/* Player 2 */}
        <div
          className={`player-panel ${match.activePlayerIndex !== 1 ? "inactive" : ""}`}
          onClick={() => onPlayerClick(1)}
        >
          <div className="player-name auto-size">
            <AutoSizeText text={p2.name} deps={[p2.name]} />
          </div>
          <div className="player-frames auto-size">
            <AutoSizeText text={String(p2.frames)} deps={[p2.frames]} />
          </div>
          <div className="player-score auto-size">
            <AutoSizeText text={String(p2.score)} deps={[p2.score]} />
          </div>
          <div className="player-breaks">
            {p2.highbreaks
              .slice(0, 5)
              .map((b, i) => (
                <span key={i}>{b}</span>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bottom-bar">
        <div className="history-log">
          {history.map((h, i) => (
            <span key={i} style={{ marginRight: 12 }}>
              {h.label}
            </span>
          ))}
        </div>
        <button className="menu-btn" onClick={onMenuClick}>
          Menu
        </button>
      </div>
    </div>
  );
}
