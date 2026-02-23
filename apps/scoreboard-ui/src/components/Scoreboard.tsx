import { useEffect, useRef } from "react";
import type { MatchState } from "../lib/model";
import { useAutoFontSize } from "../hooks/useAutoFontSize";
import trophyGif from "../assets/trophy.gif";

interface Props {
  match: MatchState;
  onPlayerClick: (playerIndex: number) => void;
  onMenuClick: () => void;
  history: { label: string }[];
}

function AutoSize({
  text,
  deps,
  className,
  scale,
}: {
  text: string;
  deps: unknown[];
  className?: string;
  scale?: number;
}) {
  const ref = useAutoFontSize(deps, scale);
  return (
    <div ref={ref} className={className}>
      {text}
    </div>
  );
}

export function Scoreboard({ match, onPlayerClick, onMenuClick, history }: Props) {
  const [p1, p2] = match.players;
  const p1Active = match.activePlayerIndex === 0;
  const p2Active = match.activePlayerIndex === 1;
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollLeft = historyRef.current.scrollWidth;
    }
  }, [history]);

  return (
    <div className="scoreboard">
      <div className="sb-main">
        {/* Left 40% */}
        <div className="sb-left" onClick={() => onPlayerClick(0)}>
          <div className={`sb-name-row ${!p1Active ? "name-inactive" : ""}`}>
            <AutoSize text={p1.name} deps={[p1.name]} className="name-text lc" scale={0.665} />
          </div>
          <div className="sb-frames-row">
            <AutoSize text={String(p1.frames)} deps={[p1.frames]} className="frames-text lc" scale={1.32} />
          </div>
          <div className={`sb-score-row ${!p1Active ? "score-inactive" : ""}`}>
            <AutoSize text={String(p1.score)} deps={[p1.score]} className="score-text lc" scale={1.32} />
          </div>
          <div className="sb-break-row">
            <div className="break-text">
              {p1.highbreaks.slice(0, 5).join(", ")}
            </div>
          </div>
        </div>

        {/* Center 20% */}
        <div className="sb-center">
          <div className="sb-name-row sb-name-row-center" style={p1.winner ? { justifyContent: "flex-start" } : p2.winner ? { justifyContent: "flex-end" } : undefined}>
            {p1.winner && <img src={trophyGif} alt="trophy" style={{ height: "48%" }} />}
            {p2.winner && <img src={trophyGif} alt="trophy" style={{ height: "48%" }} />}
          </div>
          <div className="sb-frames-row sb-frames-row-center">
            <div>Frames</div>
            <div>({match.bestOf})</div>
          </div>
          <div className="sb-score-row sb-score-row-center">Score</div>
          <div className="sb-break-row sb-break-row-center">« Breaks &gt;7 »</div>
        </div>

        {/* Right 40% */}
        <div className="sb-right" onClick={() => onPlayerClick(1)}>
          <div className={`sb-name-row ${!p2Active ? "name-inactive" : ""}`}>
            <AutoSize text={p2.name} deps={[p2.name]} className="name-text rc" scale={0.665} />
          </div>
          <div className="sb-frames-row">
            <AutoSize text={String(p2.frames)} deps={[p2.frames]} className="frames-text rc" scale={1.32} />
          </div>
          <div className={`sb-score-row ${!p2Active ? "score-inactive" : ""}`}>
            <AutoSize text={String(p2.score)} deps={[p2.score]} className="score-text rc" scale={1.32} />
          </div>
          <div className="sb-break-row">
            <div className="break-text">
              {p2.highbreaks.slice(0, 5).join(", ")}
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <div className="history-log" ref={historyRef}>
          {history.map((h, i) => (
            <span key={i} style={{ letterSpacing: "0.05em" }}>
              ░ {h.label}{" "}
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
