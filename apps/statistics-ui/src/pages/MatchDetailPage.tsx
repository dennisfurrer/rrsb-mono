import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  apiV3,
  type V3MatchDetail,
  type V3Frame,
  type V3Break,
  type V3Event,
  type V3Capabilities,
} from "../lib/apiV3";
import { Flag, Ball, StatusPill } from "../components/ui";
import { matchTypeLabel, eventLabel, formatDate, durationBetween, HIDDEN_EVENT_TYPES } from "../lib/snooker";

/** Highest break a player made in a given frame (0 if none). */
function frameHighBreak(f: V3Frame, pi: number): number {
  return f.breaks.reduce((m, b) => (b.playerIndex === pi && b.totalPoints > m ? b.totalPoints : m), 0);
}

function endReasonLabel(r: string | null): string {
  if (!r) return "";
  return (
    { MISS: "Missed", FOUL: "Foul", FRAME_END: "Frame won", EDIT: "Edited", RESPOTTED_BLACK: "Re-spot" }[
      r
    ] ?? r
  );
}

/** Per-frame summary: points / high break / visits / fouls, converging on the centre. */
function FrameSummary({
  frame,
  events,
  names,
}: {
  frame: V3Frame;
  events: V3Event[];
  names: [string, string];
}) {
  const fouls = [0, 1].map((pi) => events.filter((e) => e.type === "FOUL" && !e.wasUndone && e.playerIndex === pi));
  const rows = [
    { label: "Points", a: frame.scoreP0, b: frame.scoreP1 },
    { label: "High break", a: frameHighBreak(frame, 0), b: frameHighBreak(frame, 1) },
    { label: "Visits", a: frame.breaks.filter((b) => b.playerIndex === 0).length, b: frame.breaks.filter((b) => b.playerIndex === 1).length },
    { label: "Fouls", a: fouls[0].length, b: fouls[1].length },
  ];
  const meta: string[] = [];
  if (frame.rerackCount > 0) meta.push(`${frame.rerackCount}× re-rack`);
  if (frame.respottedBlack) meta.push("Re-spotted black");
  if (frame.endedAt) meta.push(durationBetween(frame.startedAt, frame.endedAt));

  return (
    <div className="fsum">
      <div className="fsum-h left">{names[0].split(" ")[0]}</div>
      <div className="fsum-h center" />
      <div className="fsum-h right">{names[1].split(" ")[0]}</div>
      {rows.map((r) => (
        <div className="fsum-row" key={r.label}>
          <div className={`fsum-v left ${r.a > r.b ? "hi" : ""}`}>{r.a}</div>
          <div className="fsum-label">{r.label}</div>
          <div className={`fsum-v right ${r.b > r.a ? "hi" : ""}`}>{r.b}</div>
        </div>
      ))}
      {meta.length > 0 && (
        <div className="fsum-meta">
          {meta.map((m, i) => (
            <span className="chip" key={i}>{m}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** One visit (break). Click to reveal its ball sequence (ball-by-ball only). */
function VisitRow({
  brk,
  name,
  open,
  onToggle,
}: {
  brk: V3Break;
  name: string;
  open: boolean;
  onToggle: () => void;
}) {
  const hasBalls = brk.balls.length > 0;
  return (
    <div className={`vrow p${brk.playerIndex} ${open ? "open" : ""}`}>
      <button className="vrow-head" onClick={hasBalls ? onToggle : undefined} style={!hasBalls ? { cursor: "default" } : undefined}>
        <span className="vrow-chev" style={{ visibility: hasBalls ? "visible" : "hidden" }}>›</span>
        <span className="vrow-player">{name}</span>
        <span className="vrow-meta">
          {brk.isManualEntry
            ? brk.ball
              ? `${brk.ball.toLowerCase()}${brk.pocket ? ` · ${brk.pocket.toLowerCase()}` : ""}`
              : "break"
            : `${brk.ballCount} ball${brk.ballCount === 1 ? "" : "s"}`}
          {brk.endReason ? ` · ${endReasonLabel(brk.endReason)}` : ""}
          {brk.isClearance ? " · clearance" : ""}
        </span>
        <span className="vrow-total">{brk.totalPoints}</span>
      </button>
      {open && hasBalls && (
        <div className="vrow-balls">
          {brk.balls.map((b) => (
            <Ball key={b.id} type={b.ballType} size={22} showValue />
          ))}
        </div>
      )}
    </div>
  );
}

/** Raw chronological play-by-play for a frame (the "full details" view). */
function EventFeed({ events, names }: { events: V3Event[]; names: [string, string] }) {
  return (
    <div className="event-feed">
      {events.map((e) => {
        const detail: React.ReactNode[] = [];
        if (e.playerIndex != null) detail.push(<strong key="p">{names[e.playerIndex]}</strong>);
        if (e.ballType) detail.push(<Ball key="b" type={e.ballType} size={18} showValue />);
        if (e.points > 0) detail.push(<span key="pt" className="tnum">+{e.points}</span>);
        if (e.type === "CORRECT_REDS") detail.push(<span key="r">{e.oldReds}→{e.newReds} reds</span>);
        if (e.missType) detail.push(<span key="m">{e.missType.toLowerCase()}</span>);
        return (
          <div key={e.id} className={`event-row ${e.wasUndone ? "undone" : ""}`}>
            <span className="event-seq">{e.seq}</span>
            <span className="event-type">{eventLabel(e.type)}</span>
            <span className="event-detail">{detail.length ? detail : <span style={{ color: "var(--text-dim)" }}>—</span>}</span>
            <span className="event-meta">
              <span className={`src-tag ${e.source === "REMOTE_PHONE" ? "remote" : "display"}`}>
                {e.source === "REMOTE_PHONE" ? `📱 P${(e.remotePlayerIndex ?? 0) + 1}` : "Display"}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** A single expandable frame row: dim when finished, winner name stays bright. */
function FrameItem({
  frame,
  names,
  events,
  caps,
  open,
  onToggle,
}: {
  frame: V3Frame;
  names: [string, string];
  events: V3Event[];
  caps: V3Capabilities;
  open: boolean;
  onToggle: () => void;
}) {
  const [openVisit, setOpenVisit] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const w = frame.winnerPlayerIndex;
  const done = frame.status === "COMPLETED";
  const hb0 = frameHighBreak(frame, 0);
  const hb1 = frameHighBreak(frame, 1);
  const visits = [...frame.breaks].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className={`frame-item ${done ? "done" : "live"} ${open ? "open" : ""}`}>
      <button className="frame-line" onClick={onToggle}>
        <span className="frame-line-no">
          {!done && <span className="status-dot live" />}
          F{frame.frameNumber}
        </span>
        <span className="frame-line-side left">
          <span className={`frame-line-name ${w === 0 ? "win" : ""}`}>{names[0]}</span>
          {hb0 > 0 && <span className="frame-line-hb"><i>HB</i>{hb0}</span>}
        </span>
        <span className="frame-line-score">
          <span className={`s ${w === 0 ? "win" : ""}`}>{frame.scoreP0}</span>
          <span className="sep">:</span>
          <span className={`s ${w === 1 ? "win" : ""}`}>{frame.scoreP1}</span>
        </span>
        <span className="frame-line-side right">
          {hb1 > 0 && <span className="frame-line-hb"><i>HB</i>{hb1}</span>}
          <span className={`frame-line-name ${w === 1 ? "win" : ""}`}>{names[1]}</span>
        </span>
        <span className={`frame-line-caret ${open ? "open" : ""}`}>›</span>
      </button>

      {open && (
        <div className="frame-panel">
          <FrameSummary frame={frame} events={events} names={names} />

          {visits.length > 0 && (
            <>
              <div className="panel-label">Visits</div>
              <div className="vrows">
                {visits.map((b) => (
                  <VisitRow
                    key={b.id}
                    brk={b}
                    name={names[b.playerIndex]}
                    open={openVisit === b.id}
                    onToggle={() => setOpenVisit((v) => (v === b.id ? null : b.id))}
                  />
                ))}
              </div>
            </>
          )}

          {caps.hasPointByPoint && (
            <>
              <button className="full-toggle" onClick={() => setShowFull((v) => !v)}>
                {showFull ? "Hide full play-by-play" : "Show full play-by-play"}
                <span className={`full-caret ${showFull ? "open" : ""}`}>›</span>
              </button>
              {showFull && (
                <div className="full-feed">
                  {(() => {
                    // Hide history-management/destructive meta + undone events from display.
                    const shown = events.filter(
                      (e) => !e.wasUndone && !HIDDEN_EVENT_TYPES.has(e.type)
                    );
                    return shown.length > 0 ? (
                      <EventFeed events={shown} names={names} />
                    ) : (
                      <div style={{ color: "var(--text-3)", fontSize: "0.85rem", padding: "8px 0" }}>No events.</div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<V3MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openFrame, setOpenFrame] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiV3.matches
      .detail(id)
      .then((m) => {
        setMatch(m);
        const live = m.frames.find((f) => f.status === "IN_PROGRESS");
        const last = m.frames[m.frames.length - 1];
        setOpenFrame((live ?? last)?.frameNumber ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Events grouped by frame id for quick lookup.
  const eventsByFrame = useMemo(() => {
    const map = new Map<string, V3Event[]>();
    for (const e of match?.events ?? []) {
      if (!e.frameId) continue;
      const arr = map.get(e.frameId) ?? [];
      arr.push(e);
      map.set(e.frameId, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.seq - b.seq);
    return map;
  }, [match]);

  if (loading) return <div className="spinner" />;
  if (error || !match) return <div className="card empty-state">Match not found.</div>;

  const [p0, p1] = match.players;
  const names: [string, string] = [p0?.name ?? "P1", p1?.name ?? "P2"];
  const win = match.winnerPlayerIndex;
  // Capability flags from the API; default to fully-capable if an older API omits them.
  const caps: V3Capabilities = match.capabilities ?? {
    hasBallByBall: true,
    hasVisits: true,
    hasPointByPoint: true,
    hasFoulSubtypes: true,
    hasPocketDetail: true,
  };
  const framesNewestFirst = [...match.frames].reverse();
  const showDuration = (() => {
    if (!match.finishedAt) return false;
    const ms = new Date(match.finishedAt).getTime() - new Date(match.startedAt).getTime();
    return ms > 0 && ms < 12 * 3_600_000;
  })();

  return (
    <div className="animate-in">
      <Link to="/live" className="back-link">‹ Back to live</Link>

      {/* Clean header */}
      <div className="md-hero">
        <div className="md-hero-bar">
          <span className="chip accent">{matchTypeLabel(match.matchTypeCode, match.matchType)}</span>
          <StatusPill status={match.status} />
          <span className="md-hero-date">
            {formatDate(match.startedAt)}
            {showDuration ? ` · ${durationBetween(match.startedAt, match.finishedAt)}` : ""}
          </span>
        </div>

        <div className="md-scoreline">
          <div className="md-team">
            <div className="md-team-name">
              <Flag ioc={p0?.nationalityIOC} size={24} />
              <Link to={`/players/${encodeURIComponent(p0?.name ?? "")}`} className={win === 0 ? "md-team-win" : ""} style={{ color: "inherit" }}>
                {p0?.name}
              </Link>
            </div>
            {p0?.club && <div className="md-team-club">{p0.club}</div>}
          </div>

          <div className="md-bigscore">
            <span className={`fr ${win === 0 ? "win" : ""}`}>{p0?.framesWon ?? 0}</span>
            <span className="dash">:</span>
            <span className={`fr ${win === 1 ? "win" : ""}`}>{p1?.framesWon ?? 0}</span>
          </div>

          <div className="md-team right">
            <div className="md-team-name">
              <Link to={`/players/${encodeURIComponent(p1?.name ?? "")}`} className={win === 1 ? "md-team-win" : ""} style={{ color: "inherit" }}>
                {p1?.name}
              </Link>
              <Flag ioc={p1?.nationalityIOC} size={24} />
            </div>
            {p1?.club && <div className="md-team-club">{p1.club}</div>}
          </div>
        </div>

        <div className="md-hero-foot">
          Best of {match.bestOf} · {match.inputMode === "BALL_BY_BALL" ? "Ball-by-ball" : "Break entry"} · {match.redsCount} reds
          {match.tableNumber ? ` · Table ${match.tableNumber}` : ""}
        </div>
      </div>

      {/* Frames — newest first, expandable inline */}
      <div className="section-label" style={{ marginTop: 28 }}>Frames</div>
      {caps.hasVisits ? (
        <div className="frame-list">
          {framesNewestFirst.map((f) => (
            <FrameItem
              key={f.id}
              frame={f}
              names={names}
              events={eventsByFrame.get(f.id) ?? []}
              caps={caps}
              open={openFrame === f.frameNumber}
              onToggle={() => setOpenFrame((cur) => (cur === f.frameNumber ? null : f.frameNumber))}
            />
          ))}
        </div>
      ) : (
        // Graceful degradation: this match was recorded at an earlier capability
        // level (no visit/point-by-point detail) — show frame scores only.
        <div className="frame-list">
          {framesNewestFirst.map((f) => (
            <div key={f.id} className="frame-item done">
              <div className="frame-line" style={{ cursor: "default" }}>
                <span className="frame-line-no">F{f.frameNumber}</span>
                <span className="frame-line-side left">
                  <span className={`frame-line-name ${f.winnerPlayerIndex === 0 ? "win" : ""}`}>{names[0]}</span>
                </span>
                <span className="frame-line-score">
                  <span className={`s ${f.winnerPlayerIndex === 0 ? "win" : ""}`}>{f.scoreP0}</span>
                  <span className="sep">:</span>
                  <span className={`s ${f.winnerPlayerIndex === 1 ? "win" : ""}`}>{f.scoreP1}</span>
                </span>
                <span className="frame-line-side right">
                  <span className={`frame-line-name ${f.winnerPlayerIndex === 1 ? "win" : ""}`}>{names[1]}</span>
                </span>
                <span />
              </div>
            </div>
          ))}
          <div style={{ color: "var(--text-3)", fontSize: "0.8rem", marginTop: 4 }}>
            Frame-by-frame detail isn’t available for this match.
          </div>
        </div>
      )}
    </div>
  );
}
