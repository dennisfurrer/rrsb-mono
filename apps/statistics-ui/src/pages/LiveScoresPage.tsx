import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, type LiveMatch, type FrameAction } from "../lib/api";

function getBreakClass(value: number): string {
  if (value >= 100) return "century";
  if (value >= 70) return "elite";
  if (value >= 50) return "high";
  if (value >= 20) return "mid";
  return "low";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

interface MatchModalProps {
  match: LiveMatch;
  onClose: () => void;
}

function MatchModal({ match, onClose }: MatchModalProps) {
  const [frames, setFrames] = useState<FrameAction[]>([]);
  const [expandedFrame, setExpandedFrame] = useState<number | null>(null);

  useEffect(() => {
    api.matches
      .frameActions(match.id)
      .then(setFrames)
      .catch(console.error);
  }, [match.id]);

  const frameNumbers = [...new Set(frames.map((f) => f.frameNumber))].sort(
    (a, b) => a - b
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span
            style={{ fontSize: "0.8em", color: "var(--text-muted)" }}
          >
            Table {match.tableNumber ?? "?"}
          </span>
          <span
            className={`status-dot ${match.active ? "live" : match.winner ? "ended" : "paused"}`}
            style={{ marginLeft: 8 }}
          />
        </div>

        <div className="scoreboard-item" style={{ border: "none" }}>
          <div className="match-score">
            <div className="player-side">
              <div className="player-name">
                <Link to={`/profile/${encodeURIComponent(match.player1Name)}`}>
                  {match.player1Name}
                </Link>
              </div>
              <div className="frames-display">{match.framesPlayer1}</div>
            </div>
            <div className="vs">
              Best of {match.bestOf}
            </div>
            <div className="player-side">
              <div className="player-name">
                <Link to={`/profile/${encodeURIComponent(match.player2Name)}`}>
                  {match.player2Name}
                </Link>
              </div>
              <div className="frames-display">{match.framesPlayer2}</div>
            </div>
          </div>
        </div>

        {/* Breaks */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.8em",
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              Breaks
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {match.breaksPlayer1.length > 0
                ? match.breaksPlayer1.map((b, i) => (
                    <span key={i} className={`break-badge ${getBreakClass(b)}`}>
                      {b}
                    </span>
                  ))
                : <span style={{ color: "var(--text-muted)" }}>-</span>}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div
              style={{
                fontSize: "0.8em",
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              Breaks
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {match.breaksPlayer2.length > 0
                ? match.breaksPlayer2.map((b, i) => (
                    <span key={i} className={`break-badge ${getBreakClass(b)}`}>
                      {b}
                    </span>
                  ))
                : <span style={{ color: "var(--text-muted)" }}>-</span>}
            </div>
          </div>
        </div>

        {/* Frame breakdown */}
        {frameNumbers.length > 0 && (
          <div>
            <h3
              style={{
                fontSize: "0.9em",
                color: "var(--text-muted)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Frame Breakdown
            </h3>
            {frameNumbers.map((fn) => {
              const frameActions = frames.filter(
                (f) => f.frameNumber === fn && !f.wasUndone
              );
              return (
                <div
                  key={fn}
                  className="glass-card"
                  style={{
                    marginBottom: 8,
                    padding: "10px 14px",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpandedFrame(expandedFrame === fn ? null : fn)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Frame {fn}</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {frameActions.length} actions
                    </span>
                  </div>
                  {expandedFrame === fn && (
                    <div style={{ marginTop: 8, fontSize: "0.85em" }}>
                      {frameActions.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            padding: "4px 0",
                            borderBottom: "1px solid var(--border-card)",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            {a.playerIndex === 0
                              ? match.player1Name
                              : match.player2Name}
                          </span>
                          <span>
                            {a.actionType === "foul" ? (
                              <span style={{ color: "#ef4444" }}>
                                Foul +{a.points}
                              </span>
                            ) : (
                              <span style={{ color: "var(--accent-green)" }}>
                                +{a.points}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function LiveScoresPage() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const loadMatches = useCallback(() => {
    api.matches
      .live()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMatches();
    timerRef.current = setInterval(loadMatches, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadMatches]);

  // Fill to 9 tables
  const tables: (LiveMatch | null)[] = Array.from({ length: 9 }, (_, i) => {
    const tableNum = i + 1;
    return matches.find((m) => m.tableNumber === tableNum) ?? null;
  });

  return (
    <div className="animate-in">
      <h1 className="page-title">Live Scores</h1>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : (
        <div className="scoreboard-grid">
          {tables.map((match, i) => (
            <div
              key={i}
              className="glass-card scoreboard-item animate-in"
              style={{
                animationDelay: `${i * 0.04}s`,
                opacity: match ? 1 : 0.4,
              }}
            >
              <div className="table-number">Table {i + 1}</div>
              {match ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      padding: "8px 12px 0",
                      gap: 8,
                    }}
                  >
                    <span
                      className={`status-dot ${match.active ? "live" : match.winner ? "ended" : "paused"}`}
                    />
                    <span
                      style={{
                        fontSize: "0.75em",
                        color: "var(--text-muted)",
                      }}
                    >
                      {timeAgo(match.updatedAt)}
                    </span>
                    <button
                      className="glass-btn"
                      style={{ padding: "2px 8px", fontSize: "0.8em" }}
                      onClick={() => setSelectedMatch(match)}
                    >
                      &UpperLeftOrLowerRightArrow;
                    </button>
                  </div>
                  <div className="match-score">
                    <div className="player-side">
                      <div className="player-name">
                        <Link
                          to={`/profile/${encodeURIComponent(match.player1Name)}`}
                        >
                          {match.player1Name}
                        </Link>
                      </div>
                      <div className="frames-display">
                        {match.framesPlayer1}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 3,
                          justifyContent: "center",
                          flexWrap: "wrap",
                          marginTop: 4,
                        }}
                      >
                        {match.breaksPlayer1.map((b, j) => (
                          <span
                            key={j}
                            className={`break-badge ${getBreakClass(b)}`}
                            style={{ fontSize: "0.75em", padding: "2px 6px" }}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="vs">
                      <div
                        style={{
                          fontSize: "0.7em",
                          color: "var(--text-muted)",
                        }}
                      >
                        Best of
                      </div>
                      <div>{match.bestOf}</div>
                    </div>
                    <div className="player-side">
                      <div className="player-name">
                        <Link
                          to={`/profile/${encodeURIComponent(match.player2Name)}`}
                        >
                          {match.player2Name}
                        </Link>
                      </div>
                      <div className="frames-display">
                        {match.framesPlayer2}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 3,
                          justifyContent: "center",
                          flexWrap: "wrap",
                          marginTop: 4,
                        }}
                      >
                        {match.breaksPlayer2.map((b, j) => (
                          <span
                            key={j}
                            className={`break-badge ${getBreakClass(b)}`}
                            style={{ fontSize: "0.75em", padding: "2px 6px" }}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 16px",
                    color: "var(--text-muted)",
                    fontSize: "0.9em",
                  }}
                >
                  No match
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedMatch && (
        <MatchModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
