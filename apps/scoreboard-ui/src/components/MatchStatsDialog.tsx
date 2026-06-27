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
  rerackIndex: number;   // 0 = first attempt, 1 = after first rerack, …
  isRerack: boolean;     // true if this segment ended with a rerack (not the final result)
  entries: HistoryEntry[];
  scores: [number, number] | null;
  breaks: [number[], number[]];
  fouls: [number, number];
  foulCount: [number, number];
  handicap: [number, number];
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
  // Group all entries by frameNumber, preserving insertion order
  const byFrame = new Map<number, HistoryEntry[]>();
  for (const entry of history) {
    const fn = entry.frameNumber;
    if (fn === undefined) continue;
    if (!byFrame.has(fn)) byFrame.set(fn, []);
    byFrame.get(fn)!.push(entry);
  }

  const result: FrameStat[] = [];

  for (const [frameNumber, entries] of byFrame) {
    // Split at each rerack boundary; the rerack entry is included at the END of its segment
    const segments: HistoryEntry[][] = [];
    let current: HistoryEntry[] = [];
    for (const entry of entries) {
      current.push(entry);
      if (entry.kind === "rerack") {
        segments.push(current);
        current = [];
      }
    }
    segments.push(current);

    segments.forEach((segEntries, rerackIndex) => {
      const isRerack = rerackIndex < segments.length - 1;
      const stat: FrameStat = {
        frameNumber, rerackIndex, isRerack, entries: segEntries,
        scores: null, breaks: [[], []], fouls: [0, 0], foulCount: [0, 0],
        handicap: [0, 0], corrections: [], startTime: null, endTime: null,
      };
      for (const entry of segEntries) {
        if (entry.kind === "rerack") {
          // Snapshot contains the scores just before the rerack
          try { const snap = JSON.parse(entry.snapshot) as MatchState; stat.scores = [snap.players[0].score, snap.players[1].score]; } catch { /* ignore */ }
          if (entry.timestamp) stat.endTime = entry.timestamp;
        } else if (entry.kind === "break" && entry.playerIndex !== undefined && entry.points !== undefined && entry.points > 7) {
          stat.breaks[entry.playerIndex].push(entry.points);
        } else if (entry.kind === "foul" && entry.playerIndex !== undefined && entry.points !== undefined) {
          stat.fouls[entry.playerIndex] += entry.points;
          stat.foulCount[entry.playerIndex]++;
        } else if (entry.kind === "handicap" && entry.playerIndex !== undefined && entry.points !== undefined) {
          stat.handicap[entry.playerIndex] += entry.points;
        } else if (entry.kind === "correction") {
          stat.corrections.push(entry.label);
        } else if (entry.kind === "frame_end") {
          try { const snap = JSON.parse(entry.snapshot) as MatchState; stat.scores = [snap.players[0].score, snap.players[1].score]; } catch { /* ignore */ }
          if (entry.timestamp) stat.endTime = entry.timestamp;
        }
      }
      result.push(stat);
    });
  }

  // Sort by frame then rerack-segment order
  result.sort((a, b) => a.frameNumber !== b.frameNumber ? a.frameNumber - b.frameNumber : a.rerackIndex - b.rerackIndex);

  // Each segment starts when the previous one ended
  for (let i = 0; i < result.length; i++) {
    const firstTs = result[i].entries.find(e => e.timestamp)?.timestamp ?? null;
    result[i].startTime = i === 0
      ? (matchStartedAt ?? firstTs)
      : (result[i - 1].endTime ?? firstTs);
  }
  return result;
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

  const matchStartIso = matchStartedAt ?? frames[0]?.startTime ?? null;
  const isMatchStartToday = matchStartIso !== null && (() => {
    const start = new Date(matchStartIso);
    const now = new Date();
    return start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth() && start.getDate() === now.getDate();
  })();
  const isMatchLive = frames.some(f => f.scores === null && f.frameNumber === currentFrame && !f.isRerack);
  const isMatchFinished = bestOf % 2 === 0
    ? framesP1 + framesP2 >= bestOf
    : framesP1 >= Math.ceil(bestOf / 2) || framesP2 >= Math.ceil(bestOf / 2);
  const completedFrames = frames.filter(f => f.startTime !== null && f.endTime !== null);
  const lastEndIso = completedFrames[completedFrames.length - 1]?.endTime ?? null;
  const matchTotalMins = matchStartIso !== null
    ? Math.floor(((isMatchFinished && lastEndIso ? new Date(lastEndIso).getTime() : Date.now()) - new Date(matchStartIso).getTime()) / 60000)
    : null;

  // Add current frame as empty live entry if no final segment exists yet
  const displayFrames = [...frames];
  if (!isMatchFinished && !displayFrames.some(f => f.frameNumber === currentFrame && !f.isRerack)) {
    const rerackIndex = displayFrames.filter(f => f.frameNumber === currentFrame).length;
    displayFrames.push({
      frameNumber: currentFrame, rerackIndex, isRerack: false, entries: [],
      scores: null, breaks: [[], []], fouls: [0, 0], foulCount: [0, 0],
      handicap: [0, 0], corrections: [], startTime: lastEndIso ?? null, endTime: null,
    });
  }

  // Include live frame in average
  const liveFrame = isMatchLive ? frames.find(f => f.frameNumber === currentFrame && f.scores === null && !f.isRerack && f.startTime !== null) : null;
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

  const [selectedFrame, setSelectedFrame] = useState<FrameStat | null>(null);

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
              <div key={`${frame.frameNumber}-${frame.rerackIndex}`} className={`stats-frame${isLive ? " stats-frame-live" : i % 2 === 1 ? " stats-frame-odd" : ""}`} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setSelectedFrame(frame); }}>
                {/* Left: P1 data */}
                <div className="stats-player-col stats-player-col-left">
                  <span className="stats-grid-val" style={{ color: frame.breaks[0].length > 0 ? c1 : "#555" }}>
                    {frame.breaks[0].length > 0 ? [...frame.breaks[0]].sort((a, b) => b - a).join(", ") : "–"}
                  </span>
                  <span className="stats-grid-label">Breaks:</span>
                  <span className="stats-grid-val" style={{ color: frame.fouls[0] > 0 ? "#ff2222" : "#555" }}>
                    {frame.fouls[0] > 0 ? <>{frame.fouls[0]} Pkt<span className="stats-count"> ({frame.foulCount[0] === 1 ? "1 Foul" : `${frame.foulCount[0]} Fouls`})</span></> : "–"}
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
                    {frame.isRerack ? `Frame ${frame.frameNumber} (Re-rack)` : `Frame ${frame.frameNumber}`}
                  </div>
                  {scores !== null && (
                    <div className="stats-frame-score">
                      <span style={{ color: isLive ? "#aaa" : p1wins ? "#ffee44" : "#999" }}>{scores[0]}</span>
                      <span className="stats-frame-colon">:</span>
                      <span style={{ color: isLive ? "#aaa" : p2wins ? "#ffee44" : "#999" }}>{scores[1]}</span>
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
                    {frame.fouls[1] > 0 ? <>{frame.fouls[1]} Pkt<span className="stats-count"> ({frame.foulCount[1] === 1 ? "1 Foul" : `${frame.foulCount[1]} Fouls`})</span></> : "–"}
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
                {totalFouls[0] > 0 ? <>{totalFouls[0]} Pkt<span className="stats-count"> ({totalFoulCount[0] === 1 ? "1 Foul" : `${totalFoulCount[0]} Fouls`})</span></> : "–"}
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
                {totalFouls[1] > 0 ? <>{totalFouls[1]} Pkt<span className="stats-count"> ({totalFoulCount[1] === 1 ? "1 Foul" : `${totalFoulCount[1]} Fouls`})</span></> : "–"}
              </span>
            </div>
          </div>
        )}
      </div>

      {selectedFrame && (() => {
        const f = selectedFrame;
        const framesSorted = [...displayFrames].sort((a, b) => a.frameNumber !== b.frameNumber ? a.frameNumber - b.frameNumber : a.rerackIndex - b.rerackIndex);
        const fIdx = framesSorted.findIndex(fr => fr.frameNumber === f.frameNumber && fr.rerackIndex === f.rerackIndex);
        const prevFrame = fIdx > 0 ? framesSorted[fIdx - 1] : null;
        const nextFrame = fIdx < framesSorted.length - 1 ? framesSorted[fIdx + 1] : null;
        const isLive = f.scores === null && f.frameNumber === currentFrame;
        const scores = f.scores ?? (isLive ? currentScores : null);
        const fs0 = scores?.[0] ?? 0;
        const fs1 = scores?.[1] ?? 0;
        const p0wins = scores !== null && !isLive && fs0 > fs1;
        const p1wins = scores !== null && !isLive && fs1 > fs0;
        const hasAnyHandicap = f.handicap[0] > 0 || f.handicap[1] > 0;
        const durationStr = f.startTime ? formatDuration(f.startTime, f.endTime) : null;
        const fmtTime = (ts: string | number) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
        const startTimeStr = f.startTime ? fmtTime(f.startTime) : null;
        const endTimeStr = f.endTime ? fmtTime(f.endTime) : fmtTime(Date.now());

        // Chart — uses only this segment's entries (already split at rerack boundaries)
        const chartNode = (() => {
          if (fs0 === 0 && fs1 === 0) return null;
          const svgW = 500, svgH = 150, px = 32, py = 20;
          const cW = svgW - 2 * px, cH = svgH - 2 * py;
          const yMax = Math.max(fs0, fs1) + 5;
          const fh = f.entries;
          const initHC0 = fh.filter(e => e.kind === "handicap" && e.playerIndex === 0).reduce((s, e) => s + (e.points ?? 0), 0);
          const initHC1 = fh.filter(e => e.kind === "handicap" && e.playerIndex === 1).reduce((s, e) => s + (e.points ?? 0), 0);
          const scoreData: Array<{ s: [number, number]; b?: 0 | 1; f?: 0 | 1 }> = [{ s: [initHC0, initHC1] }];
          let acc0 = initHC0, acc1 = initHC1;
          for (const e of fh) {
            if (e.kind === "handicap") continue;
            let n0 = acc0, n1 = acc1;
            if (e.kind === "break") {
              if (e.playerIndex === 0) n0 = Math.min(fs0, acc0 + (e.points ?? 0));
              else if (e.playerIndex === 1) n1 = Math.min(fs1, acc1 + (e.points ?? 0));
            } else if (e.kind === "foul") {
              if (e.playerIndex === 0) n1 = Math.min(fs1, acc1 + (e.points ?? 0));
              else if (e.playerIndex === 1) n0 = Math.min(fs0, acc0 + (e.points ?? 0));
            } else { continue; }
            if (n0 >= acc0 && n1 >= acc1 && (n0 !== acc0 || n1 !== acc1)) {
              acc0 = n0; acc1 = n1;
              const isFoul = e.kind === "foul";
              scoreData.push({ s: [acc0, acc1], b: !isFoul ? (e.playerIndex as 0 | 1) : undefined, f: isFoul ? (e.playerIndex === 0 ? 1 : 0) : undefined });
            }
          }
          const last = scoreData[scoreData.length - 1];
          if (last.s[0] !== fs0 || last.s[1] !== fs1) scoreData.push({ s: [fs0, fs1] });
          const firstEvent = fh.find(e => e.kind === "break" || e.kind === "foul");
          const p0First = firstEvent ? (firstEvent.kind === "break" ? firstEvent.playerIndex === 0 : firstEvent.playerIndex === 1) : true;
          const n = scoreData.length;
          const toX = (i: number) => px + (n > 1 ? (i / (n - 1)) * cW : cW / 2);
          const toY = (score: number) => py + cH - (score / yMax) * cH;
          const pts0 = scoreData.map((pt, i) => `${toX(i).toFixed(1)},${toY(pt.s[0]).toFixed(1)}`).join(" ");
          const pts1 = scoreData.map((pt, i) => `${toX(i).toFixed(1)},${toY(pt.s[1]).toFixed(1)}`).join(" ");
          const midY = toY(Math.max(fs0, fs1) / 2);
          const lastX = toX(n - 1);
          const lastY0 = toY(fs0), lastY1 = toY(fs1);
          const lcMin = 14;
          const lcGap0 = initHC0 > 0 && initHC1 === 0 ? toY(0) - toY(initHC0) : Infinity;
          const lcGap1 = initHC1 > 0 && initHC0 === 0 ? toY(0) - toY(initHC1) : Infinity;
          const lcHC0y = lcGap0 < lcMin ? (toY(initHC0) + toY(0)) / 2 - lcMin / 2 : toY(initHC0);
          const lcHC1y = lcGap1 < lcMin ? (toY(initHC1) + toY(0)) / 2 - lcMin / 2 : toY(initHC1);
          const lcZ1y  = lcGap0 < lcMin ? (toY(initHC0) + toY(0)) / 2 + lcMin / 2 : toY(0);
          const lcZ0y  = lcGap1 < lcMin ? (toY(initHC1) + toY(0)) / 2 + lcMin / 2 : toY(0);
          const rcGap = Math.abs(lastY0 - lastY1);
          const rcMid = (lastY0 + lastY1) / 2;
          const rcFs0y = rcGap < lcMin ? (lastY0 <= lastY1 ? rcMid - lcMin / 2 : rcMid + lcMin / 2) : lastY0;
          const rcFs1y = rcGap < lcMin ? (lastY0 <= lastY1 ? rcMid + lcMin / 2 : rcMid - lcMin / 2) : lastY1;
          return (
            <div style={{ width: "100%", background: "#111", borderRadius: "8px", padding: "0.5vh 0.3vw" }}>
              <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", display: "block", overflow: "visible" }}>
                <text x={svgW / 2} y={toY(Math.max(fs0, fs1)) / 2} textAnchor="middle" dominantBaseline="middle" fontSize={15} fill="#666">Frameverlauf</text>
                <line x1={4} y1={toY(Math.max(fs0, fs1))} x2={svgW - 4} y2={toY(Math.max(fs0, fs1))} stroke="#383838" strokeWidth="1.5" strokeDasharray="6,4" />
                <line x1={4} y1={midY} x2={svgW - 4} y2={midY} stroke="#383838" strokeWidth="1.5" strokeDasharray="6,4" />
                <line x1={4} y1={toY(0)} x2={svgW - 4} y2={toY(0)} stroke="#383838" strokeWidth="1.5" strokeDasharray="6,4" />
                {initHC0 > 0 && <text x={px - 4} y={lcHC0y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={c1}>{initHC0}</text>}
                {initHC1 > 0 && <text x={px - 4} y={lcHC1y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={c2}>{initHC1}</text>}
                {initHC0 === 0 && initHC1 > 0 && <text x={px - 4} y={lcZ0y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={c1}>0</text>}
                {initHC1 === 0 && initHC0 > 0 && <text x={px - 4} y={lcZ1y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={c2}>0</text>}
                {initHC0 === 0 && initHC1 === 0 && <text x={px - 4} y={toY(0) - lcMin / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={p0First ? c1 : c2}>0</text>}
                {initHC0 === 0 && initHC1 === 0 && <text x={px - 4} y={toY(0) + lcMin / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={p0First ? c2 : c1}>0</text>}
                <polyline points={pts0} fill="none" stroke={c1} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points={pts1} fill="none" stroke={c2} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {scoreData.map((pt, i) => pt.b === 0 ? <circle key={`b0-${i}`} cx={toX(i)} cy={toY(pt.s[0])} r={3} fill={c1} /> : null)}
                {scoreData.map((pt, i) => pt.b === 1 ? <circle key={`b1-${i}`} cx={toX(i)} cy={toY(pt.s[1])} r={3} fill={c2} /> : null)}
                <circle cx={lastX} cy={lastY0} r={5} fill={c1} />
                <circle cx={lastX} cy={lastY1} r={5} fill={c2} />
                {scoreData.map((pt, i) => pt.f === 0 ? <circle key={`f0-${i}`} cx={toX(i)} cy={toY(pt.s[0])} r={3} fill={c2} /> : null)}
                {scoreData.map((pt, i) => pt.f === 1 ? <circle key={`f1-${i}`} cx={toX(i)} cy={toY(pt.s[1])} r={3} fill={c1} /> : null)}
                <text x={lastX + 7} y={rcFs0y} textAnchor="start" dominantBaseline="middle" fontSize={12} fill={c1}>{fs0}</text>
                <text x={lastX + 7} y={rcFs1y} textAnchor="start" dominantBaseline="middle" fontSize={12} fill={c2}>{fs1}</text>
                <text x={svgW + 8} y={svgH - py} textAnchor="start" dominantBaseline="middle" fontSize={14} fill="#666">0</text>
                <text x={svgW + 8} y={midY} textAnchor="start" dominantBaseline="middle" fontSize={14} fill="#666">{Math.floor(Math.max(fs0, fs1) / 2)}</text>
                <text x={svgW + 8} y={toY(Math.max(fs0, fs1))} textAnchor="start" dominantBaseline="middle" fontSize={14} fill="#666">{Math.max(fs0, fs1)}</text>
              </svg>
            </div>
          );
        })();

        return (
          <div
            onClick={(e) => { e.stopPropagation(); setSelectedFrame(null); }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "inherit", zIndex: 10 }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#1e1e1e", border: "1px solid #555", borderRadius: "14px", padding: "2.5vh 3vw", display: "flex", flexDirection: "column", gap: "1.5vh", alignItems: "center", minWidth: "55vw", maxWidth: "90vw" }}>
              {/* Title */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", width: "100%", justifyContent: "center" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); if (prevFrame) setSelectedFrame(prevFrame); }}
                  disabled={!prevFrame}
                  style={{ background: "none", border: "none", color: prevFrame ? "#aaa" : "#333", fontSize: "2vw", cursor: prevFrame ? "pointer" : "default", padding: "0 0.4vw", lineHeight: 1 }}
                >◀</button>
                <div style={{ color: "#fff", fontSize: "1.8vw", fontWeight: "bold", textAlign: "center" }}>{f.isRerack ? `Frame ${f.frameNumber} (Re-rack)` : `Frame ${f.frameNumber}`}{isLive ? " · Live" : ""}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); if (nextFrame) setSelectedFrame(nextFrame); }}
                  disabled={!nextFrame}
                  style={{ background: "none", border: "none", color: nextFrame ? "#aaa" : "#333", fontSize: "2vw", cursor: nextFrame ? "pointer" : "default", padding: "0 0.4vw", lineHeight: 1 }}
                >▶</button>
              </div>

              {/* Score */}
              {scores !== null && (
                <div style={{ width: "100%", background: "#111", borderRadius: "10px", padding: "1.5vh 2vw", display: "flex", alignItems: "center", gap: "1vw" }}>
                  <span style={{ flex: 1, textAlign: "left", color: c1, fontSize: "1.6vw", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nameP1}{p0wins ? " 🏆" : ""}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", background: "#222", borderRadius: "8px", padding: "0.6vh 1.2vw" }}>
                    <span style={{ color: p0wins ? "#ffee44" : "#888", fontSize: "2.8vw", fontWeight: "bold" }}>{fs0}</span>
                    <span style={{ color: "#555", fontSize: "1.6vw" }}>:</span>
                    <span style={{ color: p1wins ? "#ffee44" : "#888", fontSize: "2.8vw", fontWeight: "bold" }}>{fs1}</span>
                  </div>
                  <span style={{ flex: 1, textAlign: "right", color: c2, fontSize: "1.6vw", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p1wins ? "🏆 " : ""}{nameP2}</span>
                </div>
              )}

              {/* Stats */}
              <div style={{ width: "100%", display: "grid", gridTemplateColumns: "auto 1fr auto 1fr", columnGap: "0.6vw", rowGap: "0.35vh", fontSize: "1.25vw", alignItems: "baseline" }}>
                <div style={{ gridColumn: "1 / 3", color: c1, fontWeight: "bold", fontSize: "1.1vw", paddingBottom: "0.1vh" }}>{nameP1}</div>
                <div style={{ gridColumn: "3 / 5", color: c2, fontWeight: "bold", fontSize: "1.1vw", paddingBottom: "0.1vh" }}>{nameP2}</div>
                <div style={{ color: "#ccc" }}>Breaks &gt;7:</div>
                <div style={{ color: c1 }}>{f.breaks[0].length > 0 ? [...f.breaks[0]].sort((a,b)=>b-a).join(", ") : "—"}</div>
                <div style={{ color: "#ccc" }}>Breaks &gt;7:</div>
                <div style={{ color: c2 }}>{f.breaks[1].length > 0 ? [...f.breaks[1]].sort((a,b)=>b-a).join(", ") : "—"}</div>
                <div style={{ color: "#ccc" }}>Foulpunkte:</div>
                <div style={{ color: "#ff4444" }}>{f.fouls[0] > 0 ? `${f.fouls[0]} Pkt (${f.foulCount[0] === 1 ? "1 Foul" : `${f.foulCount[0]} Fouls`})` : "—"}</div>
                <div style={{ color: "#ccc" }}>Foulpunkte:</div>
                <div style={{ color: "#ff4444" }}>{f.fouls[1] > 0 ? `${f.fouls[1]} Pkt (${f.foulCount[1] === 1 ? "1 Foul" : `${f.foulCount[1]} Fouls`})` : "—"}</div>
                {hasAnyHandicap && <>
                  <div style={{ color: "#ccc" }}>Handicap:</div>
                  <div style={{ color: "#c87832" }}>{f.handicap[0] > 0 ? `${f.handicap[0]} Pkt` : "—"}</div>
                  <div style={{ color: "#ccc" }}>Handicap:</div>
                  <div style={{ color: "#c87832" }}>{f.handicap[1] > 0 ? `${f.handicap[1]} Pkt` : "—"}</div>
                </>}
                {durationStr && <>
                  <div style={{ color: "#aaa" }}>⏱ Framedauer:</div>
                  <div style={{ color: "#fff" }}><strong>{durationStr}{isLive && <span style={{ color: "#44cc44", opacity: tick % 2 === 0 ? 1 : 0 }}> ●</span>}</strong></div>
                  <div style={{ color: "#aaa" }}>{startTimeStr ? "🕐 Zeit:" : ""}</div>
                  <div style={{ color: "#ccc" }}>{startTimeStr ? `${startTimeStr} – ${endTimeStr}` : ""}</div>
                </>}
              </div>

              {/* Chart */}
              {chartNode}

              {/* Close */}
              <button
                onClick={() => setSelectedFrame(null)}
                style={{ width: "100%", padding: "1vh 0", fontSize: "1.4vw", borderRadius: "8px", border: "1px solid #555", background: "#333", color: "#fff", cursor: "pointer", fontWeight: "bold" }}
              >
                Schliessen
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
