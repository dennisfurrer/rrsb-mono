import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  type PracticeSessionSummary,
  type PracticeMode,
} from "../lib/api";

const ROUTINE_OPTIONS = [
  { id: "", label: "Alle Übungen" },
  { id: "lineup", label: "Line-Up" },
  { id: "tline", label: "T-Line" },
  { id: "opentable", label: "Offener Tisch" },
  { id: "blackspot", label: "Schwarze vom Spot" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("de-CH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }) +
    " " +
    d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
  );
}

function modeLabel(mode: PracticeMode): string {
  return mode === "break" ? "Break" : "Hit/Miss";
}

export function TrainingPage() {
  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [playerFilter, setPlayerFilter] = useState("");
  const [routineFilter, setRoutineFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.players
      .list()
      .then(setPlayers)
      .catch(() => setPlayers([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.practice
      .list({
        player: playerFilter || undefined,
        routine: routineFilter || undefined,
        page,
        limit: 20,
      })
      .then((res) => {
        setSessions(res.data ?? []);
        setTotalPages(res.metadata?.pagination?.totalPages ?? 1);
        setTotalSessions(res.metadata?.pagination?.totalSessions ?? 0);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [playerFilter, routineFilter, page]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [playerFilter, routineFilter]);

  const playerOptions = useMemo(() => players.slice().sort(), [players]);

  return (
    <div>
      <h1 className="page-title">Solo Training</h1>

      <div
        className="glass-card"
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9em" }}>
            Spieler:
          </span>
          <select
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value)}
            className="training-select"
          >
            <option value="">Alle</option>
            {playerOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9em" }}>
            Übung:
          </span>
          <select
            value={routineFilter}
            onChange={(e) => setRoutineFilter(e.target.value)}
            className="training-select"
          >
            {ROUTINE_OPTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <span
          style={{
            marginLeft: "auto",
            color: "var(--text-muted)",
            fontSize: "0.9em",
          }}
        >
          {totalSessions} Sessions
        </span>
      </div>

      {loading && (
        <div className="glass-card" style={{ textAlign: "center" }}>
          Laden...
        </div>
      )}
      {error && (
        <div
          className="glass-card"
          style={{ textAlign: "center", color: "#f87171" }}
        >
          Fehler: {error}
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div
          className="glass-card"
          style={{ textAlign: "center", color: "var(--text-secondary)" }}
        >
          Keine Sessions gefunden.
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="training-list">
          {sessions.map((s) => (
            <Link
              key={s.id}
              to={`/training/${s.id}`}
              className="glass-card training-row"
            >
              <div className="training-row-main">
                <div className="training-row-routine">
                  <span className="training-row-routine-name">
                    {s.routineName}
                  </span>
                  {s.redsCount != null && (
                    <span className="training-row-reds">
                      {s.redsCount} Rote
                    </span>
                  )}
                  <span
                    className={`training-row-mode mode-${s.mode}`}
                  >
                    {modeLabel(s.mode)}
                  </span>
                </div>
                <div className="training-row-player">{s.playerName}</div>
              </div>
              <div className="training-row-meta">
                <span>{s.attemptCount ?? 0} Versuche</span>
                <span>{formatDate(s.startedAt)}</span>
                {s.finalized && (
                  <span className="training-row-finalized">abgeschlossen</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="training-pagination">
          <button
            className="glass-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Zurück
          </button>
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9em",
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Seite {page} von {totalPages}
          </span>
          <button
            className="glass-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Weiter ›
          </button>
        </div>
      )}
    </div>
  );
}
