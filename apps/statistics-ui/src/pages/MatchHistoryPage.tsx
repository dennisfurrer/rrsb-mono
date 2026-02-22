import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  api,
  type MatchHistoryEntry,
  type MatchHistoryResponse,
  type FrameAction,
} from "../lib/api";

function getBreakClass(value: number): string {
  if (value >= 100) return "century";
  if (value >= 70) return "elite";
  if (value >= 50) return "high";
  if (value >= 20) return "mid";
  return "low";
}

function MatchDetailModal({
  match,
  playerName,
  onClose,
}: {
  match: MatchHistoryEntry;
  playerName: string;
  onClose: () => void;
}) {
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
      <div
        className="modal-content glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: "0.8em", color: "var(--text-muted)" }}>
            {match.date} &middot; Table {match.tableNumber ?? "?"}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
              margin: "12px 0",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{match.player1Name}</div>
              <div
                style={{
                  fontSize: "2em",
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {match.framesPlayer1}
              </div>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9em" }}>
              Best of {match.bestOf}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{match.player2Name}</div>
              <div
                style={{
                  fontSize: "2em",
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {match.framesPlayer2}
              </div>
            </div>
          </div>
        </div>

        {/* Breaks */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.8em",
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              {match.player1Name} breaks
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {match.topBreaksPlayer1.length > 0
                ? match.topBreaksPlayer1.map((b, i) => (
                    <span
                      key={i}
                      className={`break-badge ${getBreakClass(b)}`}
                    >
                      {b}
                    </span>
                  ))
                : <span style={{ color: "var(--text-muted)" }}>-</span>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "0.8em",
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              {match.player2Name} breaks
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {match.topBreaksPlayer2.length > 0
                ? match.topBreaksPlayer2.map((b, i) => (
                    <span
                      key={i}
                      className={`break-badge ${getBreakClass(b)}`}
                    >
                      {b}
                    </span>
                  ))
                : <span style={{ color: "var(--text-muted)" }}>-</span>}
            </div>
          </div>
        </div>

        {/* Frames */}
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
              const acts = frames.filter(
                (f) => f.frameNumber === fn && !f.wasUndone
              );
              return (
                <div
                  key={fn}
                  className="glass-card"
                  style={{
                    marginBottom: 6,
                    padding: "8px 12px",
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
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85em" }}>
                      {acts.length} actions
                    </span>
                  </div>
                  {expandedFrame === fn && (
                    <div style={{ marginTop: 6, fontSize: "0.85em" }}>
                      {acts.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            padding: "3px 0",
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

export function MatchHistoryPage() {
  const { name } = useParams<{ name: string }>();
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<MatchHistoryResponse["metadata"] | null>(
    null
  );
  const [opponents, setOpponents] = useState<string[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<MatchHistoryEntry | null>(
    null
  );

  // Build opponent list from first load
  useEffect(() => {
    if (!name) return;
    api.matches
      .playerHistory(name, 1)
      .then((res) => {
        const opps = new Set<string>();
        res.data.forEach((m) => {
          if (m.player1Name !== name) opps.add(m.player1Name);
          if (m.player2Name !== name) opps.add(m.player2Name);
        });
        setOpponents([...opps].sort());
      })
      .catch(console.error);
  }, [name]);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    api.matches
      .playerHistory(name, page, selectedOpponent || undefined)
      .then((res) => {
        setMatches(res.data);
        setMeta(res.metadata);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [name, page, selectedOpponent]);

  function getResult(match: MatchHistoryEntry): {
    text: string;
    color: string;
  } {
    if (!match.winner) return { text: "DNF", color: "var(--text-muted)" };
    if (match.winner === name)
      return { text: "Won", color: "#22c55e" };
    return { text: "Lost", color: "#ef4444" };
  }

  if (!name) return null;

  return (
    <div className="animate-in">
      <h1 className="page-title">
        <Link to={`/profile/${encodeURIComponent(name)}`}>{name}</Link>
        <span
          style={{
            color: "var(--text-muted)",
            fontWeight: 400,
            fontSize: "0.6em",
            marginLeft: 12,
          }}
        >
          Match History
        </span>
      </h1>

      {/* Filters */}
      <div style={{ marginBottom: 20 }}>
        <select
          className="glass-btn"
          value={selectedOpponent}
          onChange={(e) => {
            setSelectedOpponent(e.target.value);
            setPage(1);
          }}
          style={{ minWidth: 180 }}
        >
          <option value="">All Opponents</option>
          {opponents.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : matches.length === 0 ? (
        <div className="empty-state">No matches found.</div>
      ) : (
        <>
          <div className="glass-card" style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Table</th>
                  <th>Player 1</th>
                  <th>Player 2</th>
                  <th>Best Of</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>P1 Breaks</th>
                  <th>P2 Breaks</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const result = getResult(m);
                  return (
                    <tr
                      key={m.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedMatch(m)}
                    >
                      <td style={{ whiteSpace: "nowrap" }}>{m.date}</td>
                      <td>{m.tableNumber ?? "-"}</td>
                      <td>
                        {m.player1Name === name ? (
                          <strong>{m.player1Name}</strong>
                        ) : (
                          <Link
                            to={`/profile/${encodeURIComponent(m.player1Name)}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {m.player1Name}
                          </Link>
                        )}
                      </td>
                      <td>
                        {m.player2Name === name ? (
                          <strong>{m.player2Name}</strong>
                        ) : (
                          <Link
                            to={`/profile/${encodeURIComponent(m.player2Name)}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {m.player2Name}
                          </Link>
                        )}
                      </td>
                      <td>{m.bestOf}</td>
                      <td>
                        {m.framesPlayer1} - {m.framesPlayer2}
                      </td>
                      <td style={{ color: result.color, fontWeight: 600 }}>
                        {result.text}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 3,
                            flexWrap: "wrap",
                          }}
                        >
                          {m.topBreaksPlayer1.map((b, i) => (
                            <span
                              key={i}
                              className={`break-badge ${getBreakClass(b)}`}
                              style={{
                                fontSize: "0.75em",
                                padding: "2px 6px",
                              }}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 3,
                            flexWrap: "wrap",
                          }}
                        >
                          {m.topBreaksPlayer2.map((b, i) => (
                            <span
                              key={i}
                              className={`break-badge ${getBreakClass(b)}`}
                              style={{
                                fontSize: "0.75em",
                                padding: "2px 6px",
                              }}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="glass-btn"
                disabled={!meta.pagination.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                &larr; Prev
              </button>
              <span style={{ color: "var(--text-secondary)" }}>
                Page {meta.pagination.currentPage} of{" "}
                {meta.pagination.totalPages}
              </span>
              <button
                className="glass-btn"
                disabled={!meta.pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}

      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          playerName={name}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
