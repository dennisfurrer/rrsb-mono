import { useEffect, useRef, useState } from "react";
import type { MatchState } from "../lib/model";
import { iocToFlag } from "../lib/flags";
import { NorthernIrelandFlagIcon } from "./NorthernIrelandFlagIcon";

function flagNode(ioc?: string): React.ReactNode {
  if (ioc?.toUpperCase() === "NIR") {
    return <NorthernIrelandFlagIcon style={{ width: "1.1em", height: "0.82em", verticalAlign: "middle" }} />;
  }
  return (ioc && iocToFlag(ioc)) || "🏳️";
}

interface HistoryEntry {
  label: string;
  kind?: string;
  playerIndex?: 0 | 1;
  points?: number;
  frameNumber?: number;
  snapshot: string;
  timestamp?: string;
}

interface FrameStat {
  frameNumber: number;
  scores: [number, number] | null;
  breaks: [number[], number[]];
  fouls: [number, number];
  foulCount: [number, number];
  handicap: [number, number];
  reracks: number;
  corrections: string[];
  startTime: string | null;
  endTime: string | null;
}

function formatHHMMColon(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

function formatDuration(startIso: string, endIso?: string | null): string {
  const ms = (endIso ? new Date(endIso).getTime() : Date.now()) - new Date(startIso).getTime();
  const totalMins = Math.floor(ms / 60000);
  return `${totalMins} Min.`;
}

function deriveFrameStats(history: HistoryEntry[], matchStartedAt?: string | null): FrameStat[] {
  const map = new Map<number, FrameStat>();
  const firstTimestamps = new Map<number, string>();

  for (const entry of history) {
    const fn = entry.frameNumber;
    if (fn === undefined) continue;
    if (!map.has(fn)) {
      map.set(fn, { frameNumber: fn, scores: null, breaks: [[], []], fouls: [0, 0], foulCount: [0, 0], handicap: [0, 0], reracks: 0, corrections: [], startTime: null, endTime: null });
    }
    if (entry.timestamp && !firstTimestamps.has(fn)) {
      firstTimestamps.set(fn, entry.timestamp);
    }
    const frame = map.get(fn)!;
    if (entry.kind === "rerack") {
      frame.reracks += 1;
      frame.handicap = [0, 0];
    } else if (entry.kind === "break" && entry.playerIndex !== undefined && entry.points !== undefined && entry.points > 7) {
      frame.breaks[entry.playerIndex].push(entry.points);
    } else if (entry.kind === "foul" && entry.playerIndex !== undefined && entry.points !== undefined) {
      frame.fouls[entry.playerIndex] += entry.points;
      frame.foulCount[entry.playerIndex]++;
    } else if (entry.kind === "handicap" && entry.playerIndex !== undefined && entry.points !== undefined) {
      frame.handicap[entry.playerIndex] += entry.points;
    } else if (entry.kind === "correction") {
      frame.corrections.push(entry.label);
    } else if (entry.kind === "frame_end") {
      try {
        const snap = JSON.parse(entry.snapshot) as MatchState;
        frame.scores = [snap.players[0].score, snap.players[1].score];
      } catch {
        /* ignore */
      }
      if (entry.timestamp) frame.endTime = entry.timestamp;
    }
  }

  const sorted = Array.from(map.values()).sort((a, b) => a.frameNumber - b.frameNumber);
  for (let i = 0; i < sorted.length; i++) {
    sorted[i].startTime = i === 0
      ? (matchStartedAt ?? firstTimestamps.get(sorted[0].frameNumber) ?? null)
      : (sorted[i - 1].endTime ?? firstTimestamps.get(sorted[i].frameNumber) ?? null);
  }
  return sorted;
}

interface Props {
  history: HistoryEntry[];
  matchStartedAt?: string | null;
  nameP1: string;
  nameP2: string;
  iocP1?: string;
  iocP2?: string;
  bestOf: number;
  framesP1: number;
  framesP2: number;
  currentFrame: number;
  currentScores: [number, number];
  colorP1?: string;
  colorP2?: string;
  onClose: () => void;
}

export function MatchStatsDialog({ history, matchStartedAt, nameP1, nameP2, iocP1, iocP2, bestOf, framesP1, framesP2, currentFrame, currentScores, colorP1, colorP2, onClose }: Props) {
  const flag1 = flagNode(iocP1);
  const flag2 = flagNode(iocP2);
  const c1 = colorP1 ?? "#5599ff";
  const c2 = colorP2 ?? "#ff8833";
  const frames = deriveFrameStats(history, matchStartedAt);

  const totalBreakPts: [number, number] = [
    frames.reduce((sum, f) => sum + f.breaks[0].reduce((s, b) => s + b, 0), 0),
    frames.reduce((sum, f) => sum + f.breaks[1].reduce((s, b) => s + b, 0), 0),
  ];
  const top5Breaks: [number[], number[]] = [
    frames.flatMap(f => f.breaks[0]).sort((a, b) => b - a).slice(0, 5),
    frames.flatMap(f => f.breaks[1]).sort((a, b) => b - a).slice(0, 5),
  ];
  const totalFouls: [number, number] = [
    frames.reduce((sum, f) => sum + f.fouls[0], 0),
    frames.reduce((sum, f) => sum + f.fouls[1], 0),
  ];
  const totalBreakCount: [number, number] = [
    frames.reduce((sum, f) => sum + f.breaks[0].length, 0),
    frames.reduce((sum, f) => sum + f.breaks[1].length, 0),
  ];
  const totalFoulCount: [number, number] = [0, 0];
  for (const entry of history) {
    if (entry.kind === "foul" && entry.playerIndex !== undefined) {
      totalFoulCount[entry.playerIndex]++;
    }
  }
  const totalPts: [number, number] = [0, 0];
  for (const entry of history) {
    if (entry.kind === "break" && entry.playerIndex !== undefined && entry.points !== undefined && entry.label !== "") {
      totalPts[entry.playerIndex] += entry.points;
    } else if (entry.kind === "foul" && entry.playerIndex !== undefined && entry.points !== undefined) {
      totalPts[entry.playerIndex === 0 ? 1 : 0] += entry.points;
    } else if (entry.kind === "handicap" && entry.playerIndex !== undefined && entry.points !== undefined) {
      totalPts[entry.playerIndex] += entry.points;
    }
  }
  const hasAnyHandicapTotal = frames.some(f => f.handicap[0] > 0 || f.handicap[1] > 0);
  const rerackCount = history.filter(e => e.kind === "rerack").length;

  const matchStartIso = matchStartedAt ?? frames[0]?.startTime ?? null;
  const isMatchStartToday = matchStartIso !== null && (() => {
    const start = new Date(matchStartIso);
    const now = new Date();
    return start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth() && start.getDate() === now.getDate();
  })();
  const isMatchLive = frames.some(f => f.scores === null && f.frameNumber === currentFrame);
  const isMatchFinished = bestOf % 2 === 0
    ? framesP1 + framesP2 >= bestOf
    : framesP1 >= Math.ceil(bestOf / 2) || framesP2 >= Math.ceil(bestOf / 2);
  const completedFrames = frames.filter(f => f.startTime !== null && f.endTime !== null);
  const lastEndIso = completedFrames[completedFrames.length - 1]?.endTime ?? null;
  const matchTotalMins = matchStartIso !== null
    ? Math.floor(((isMatchFinished && lastEndIso ? new Date(lastEndIso).getTime() : Date.now()) - new Date(matchStartIso).getTime()) / 60000)
    : null;

  // Add current frame as empty live frame if not yet in history
  const displayFrames = [...frames];
  if (!isMatchFinished && !displayFrames.some(f => f.frameNumber === currentFrame)) {
    displayFrames.push({
      frameNumber: currentFrame,
      scores: null,
      breaks: [[], []],
      fouls: [0, 0],
      foulCount: [0, 0],
      handicap: [0, 0],
      reracks: 0,
      corrections: [],
      startTime: lastEndIso ?? null,
      endTime: null,
    });
  }

  // Include live frame in average
  const liveFrame = isMatchLive ? frames.find(f => f.frameNumber === currentFrame && f.startTime !== null) : null;
  const liveDurationMins = liveFrame?.startTime ? (Date.now() - new Date(liveFrame.startTime).getTime()) / 60000 : 0;
  const totalFrameCount = completedFrames.length + (liveFrame ? 1 : 0);
  const totalFrameMins = completedFrames.reduce((sum, f) =>
    sum + (new Date(f.endTime!).getTime() - new Date(f.startTime!).getTime()) / 60000, 0
  ) + liveDurationMins;
  const avgFrameMins = totalFrameCount > 0 ? Math.round(totalFrameMins / totalFrameCount) : null;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="stats-dialog" onClick={onClose}>
        <div className="stats-header">
          <span className="stats-name" style={{ color: c1, position: "relative", overflow: "visible" }}>
            {nameP1}
            <span style={{ position: "absolute", left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: "calc(0.6em - 1.5vw)", whiteSpace: "nowrap" }}>{flag1}</span>
          </span>
          <span className="stats-vs">vs</span>
          <span className="stats-name" style={{ color: c2, position: "relative", overflow: "visible" }}>
            <span style={{ position: "absolute", right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: "calc(0.6em - 1.5vw)", whiteSpace: "nowrap" }}>{flag2}</span>
            {nameP2}
          </span>
        </div>

        <div className="stats-col-labels">
          <span className="stats-col-frames" style={{ color: "#fff" }}>{framesP1}</span>
          <div>
            <div style={{ color: "#aaa", textAlign: "center" }}>Best of {bestOf}</div>
            {matchStartIso && (
              <div style={{ color: "#888", fontSize: "0.75vw", fontWeight: "normal", textAlign: "center", marginTop: "0.2vh" }}>
                Start: {isMatchStartToday ? "Heute" : formatDDMMYYYY(matchStartIso)} um {formatHHMM(matchStartIso)}
              </div>
            )}
          </div>
          <span className="stats-col-frames" style={{ color: "#fff" }}>{framesP2}</span>
        </div>

        <div className="stats-scroll" ref={scrollRef}>
          {displayFrames.length === 0 && (
            <div className="stats-empty">Noch keine Statistik vorhanden</div>
          )}
          {displayFrames.map((frame, i) => {
            const isLive = frame.scores === null && frame.frameNumber === currentFrame;
            const scores = frame.scores ?? (isLive ? currentScores : null);
            const p1wins = scores !== null && !isLive && scores[0] > scores[1];
            const p2wins = scores !== null && !isLive && scores[1] > scores[0];
            const hasAnyHandicap = frame.handicap[0] > 0 || frame.handicap[1] > 0;

            return (
              <div key={frame.frameNumber} className={`stats-frame${isLive ? " stats-frame-live" : i % 2 === 1 ? " stats-frame-odd" : ""}`}>
                {/* Left: P1 data */}
                <div className="stats-player-col stats-player-col-left">
                  <span className="stats-grid-val" style={{ color: frame.breaks[0].length > 0 ? c1 : "#555" }}>
                    {frame.breaks[0].length > 0 ? [...frame.breaks[0]].sort((a, b) => b - a).join(", ") : "–"}
                  </span>
                  <span className="stats-grid-label">Breaks:</span>
                  <span className="stats-grid-val" style={{ color: frame.fouls[0] > 0 ? "#ff2222" : "#555" }}>
                    {frame.fouls[0] > 0 ? <>{frame.fouls[0]} Pkt<span className="stats-count"> ({frame.foulCount[0]})</span></> : "–"}
                  </span>
                  <span className="stats-grid-label">Fouls:</span>
                  {hasAnyHandicap && <>
                    <span className="stats-grid-val" style={{ color: frame.handicap[0] > 0 ? "#cc8800" : "#555" }}>
                      {frame.handicap[0] > 0 ? `${frame.handicap[0]} Pkt` : "–"}
                    </span>
                    <span className="stats-grid-label">HC:</span>
                  </>}
                </div>

                {/* Center: frame number + score */}
                <div className="stats-frame-center">
                  <div className="stats-frame-num">
                    Frame {frame.frameNumber}
                  </div>
                  {scores !== null && (
                    <div className="stats-frame-score">
                      <span style={{ color: isLive ? "#aaa" : p1wins ? "#ffee44" : "#999" }}>{scores[0]}</span>
                      <span className="stats-frame-colon">:</span>
                      <span style={{ color: isLive ? "#aaa" : p2wins ? "#ffee44" : "#999" }}>{scores[1]}</span>
                    </div>
                  )}
                  {frame.reracks > 0 && (
                    <div style={{ color: "#888", fontSize: "0.75vw", marginTop: "0.2vh" }}>
                      {frame.reracks === 1 ? "1 Rerack" : `${frame.reracks} Reracks`}
                    </div>
                  )}
                  {frame.corrections.map((label, i) => (
                    <div key={i} style={{ color: "#f0c040", fontSize: "0.75vw", marginTop: "0.2vh" }}>{label}</div>
                  ))}
                  {frame.startTime && (
                    <div style={{ display: "flex", alignItems: "center", width: "100%", fontSize: "0.92vw", color: "#bbb", letterSpacing: "0.03em", fontWeight: "normal" }}>
                      <span style={{ flex: 1, textAlign: "right" }}>{formatHHMM(frame.startTime)}</span>
                      <span style={{ margin: "0 0.3vw", color: "#888" }}>·</span>
                      <span style={{ flex: 1, textAlign: "left" }}>
                        {formatDuration(frame.startTime, frame.endTime)}
                        {isLive && <span style={{ color: "#44cc44", opacity: tick % 2 === 0 ? 1 : 0 }}> ●</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: P2 data */}
                <div className="stats-player-col stats-player-col-right">
                  <span className="stats-grid-label">Breaks:</span>
                  <span className="stats-grid-val" style={{ color: frame.breaks[1].length > 0 ? c2 : "#555" }}>
                    {frame.breaks[1].length > 0 ? [...frame.breaks[1]].sort((a, b) => b - a).join(", ") : "–"}
                  </span>
                  <span className="stats-grid-label">Fouls:</span>
                  <span className="stats-grid-val" style={{ color: frame.fouls[1] > 0 ? "#ff2222" : "#555" }}>
                    {frame.fouls[1] > 0 ? <>{frame.fouls[1]} Pkt<span className="stats-count"> ({frame.foulCount[1]})</span></> : "–"}
                  </span>
                  {hasAnyHandicap && <>
                    <span className="stats-grid-label">HC:</span>
                    <span className="stats-grid-val" style={{ color: frame.handicap[1] > 0 ? "#cc8800" : "#555" }}>
                      {frame.handicap[1] > 0 ? `${frame.handicap[1]} Pkt` : "–"}
                    </span>
                  </>}
                </div>
              </div>
            );
          })}
        </div>

        {frames.length > 0 && (
          <div className="stats-totals">
            <div className="stats-totals-col stats-totals-left">
              <span className="stats-grid-val" style={{ color: totalBreakPts[0] > 0 ? c1 : "#555" }}>
                {totalBreakPts[0] > 0 ? <>{totalBreakPts[0]}<span className="stats-count"> ({totalBreakCount[0]})</span></> : "–"}
              </span>
              <span className="stats-grid-label">Break-Pkt:</span>
              <span className="stats-grid-val" style={{ color: top5Breaks[0].length > 0 ? c1 : "#555" }}>
                {top5Breaks[0].length > 0 ? top5Breaks[0].join(", ") : "–"}
              </span>
              <span className="stats-grid-label">Top Breaks:</span>
              <span className="stats-grid-val" style={{ color: totalFouls[0] > 0 ? "#ff2222" : "#555" }}>
                {totalFouls[0] > 0 ? <>{totalFouls[0]} Pkt<span className="stats-count"> ({totalFoulCount[0]})</span></> : "–"}
              </span>
              <span className="stats-grid-label">Fouls:</span>
            </div>
            <div className="stats-totals-center">
              <div className="stats-totals-label">Total</div>
              <div className="stats-totals-score">
                <span style={{ color: totalPts[0] >= totalPts[1] ? "#ffee44" : "#aaa" }}>{totalPts[0]}</span>
                <span className="stats-frame-colon">:</span>
                <span style={{ color: totalPts[1] > totalPts[0] ? "#ffee44" : "#aaa" }}>{totalPts[1]}</span>
              </div>
              {rerackCount > 0 && (
                <div style={{ color: "#999", fontSize: "0.8vw", marginTop: "0.3vh" }}>
                  ({rerackCount} {rerackCount === 1 ? "Rerack" : "Reracks"})
                </div>
              )}
              {matchTotalMins !== null && (
                isMatchFinished && lastEndIso ? (
                  <div style={{ display: "flex", alignItems: "center", width: "100%", fontSize: "0.9vw", color: "#bbb", fontWeight: "normal", marginTop: "0.4vh" }}>
                    <span style={{ flex: 1, textAlign: "right", color: "#888" }}>{formatHHMM(lastEndIso)}</span>
                    <span style={{ margin: "0 0.3vw", color: "#888" }}>·</span>
                    <span style={{ flex: 1, textAlign: "left" }}>{matchTotalMins} Min.</span>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.9vw", color: "#bbb", fontWeight: "normal", marginTop: "0.4vh" }}>
                    {matchTotalMins} Min.
                    <span style={{ opacity: tick % 2 === 0 ? 1 : 0 }}> ●</span>
                  </div>
                )
              )}
              {avgFrameMins !== null && (
                <div style={{ color: "#999", fontSize: "0.8vw", fontWeight: "normal" }}>
                  Ø {avgFrameMins} Min./Frame
                </div>
              )}
            </div>
            <div className="stats-totals-col stats-totals-right">
              <span className="stats-grid-label">Break-Pkt:</span>
              <span className="stats-grid-val" style={{ color: totalBreakPts[1] > 0 ? c2 : "#555" }}>
                {totalBreakPts[1] > 0 ? <>{totalBreakPts[1]}<span className="stats-count"> ({totalBreakCount[1]})</span></> : "–"}
              </span>
              <span className="stats-grid-label">Top Breaks:</span>
              <span className="stats-grid-val" style={{ color: top5Breaks[1].length > 0 ? c2 : "#555" }}>
                {top5Breaks[1].length > 0 ? top5Breaks[1].join(", ") : "–"}
              </span>
              <span className="stats-grid-label">Fouls:</span>
              <span className="stats-grid-val" style={{ color: totalFouls[1] > 0 ? "#ff2222" : "#555" }}>
                {totalFouls[1] > 0 ? <>{totalFouls[1]} Pkt<span className="stats-count"> ({totalFoulCount[1]})</span></> : "–"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
