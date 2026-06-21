import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  type PracticeAttempt,
  type PracticeSessionDetail,
} from "../lib/api";

const MISS_LABEL: Record<string, string> = {
  long: "Lange Rote",
  easy: "Einfache",
  difficult: "Schwierige",
  position: "Position",
  foul: "Foul",
};

const FOUL_LABEL: Record<string, string> = {
  white_potted: "Weiss gelocht",
  wrong_ball_hit: "Falscher Ball berührt",
  no_ball_hit: "Kein Ball getroffen",
  white_off_table: "Ball vom Tisch",
  clothing_foul: "Kleiderfoul",
  cue_foul: "Cue-Foul",
};

const BALL_LABEL: Record<string, string> = {
  red: "Rot",
  yellow: "Gelb",
  green: "Grün",
  brown: "Braun",
  blue: "Blau",
  pink: "Pink",
  black: "Schwarz",
};

const POCKET_LABEL: Record<string, string> = {
  corner: "Ecke",
  middle: "Mitte",
  corner_yellow: "Ecke gelb",
  corner_green: "Ecke grün",
  middle_yellow: "Mitte s. gelb",
  middle_green: "Mitte s. grün",
  corner_black_yellow: "Ecke schwarz s. gelb",
  corner_black_green: "Ecke schwarz s. grün",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("de-CH", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
    }) +
    " " +
    d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
  );
}

function durationLabel(startIso: string, endIso: string | null): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  }
  return `${mins}m ${secs}s`;
}

function attemptValueLabel(a: PracticeAttempt): string {
  if (a.kind === "cleared") return `${a.value ?? "?"} (Aufgeräumt)`;
  if (a.kind === "missed") return "—";
  if (a.kind === "hit") return "Treffer";
  if (a.kind === "miss") return "Fehler";
  return String(a.value ?? "?");
}

function attemptTagLabel(a: PracticeAttempt): string {
  const parts: string[] = [];
  if (a.missType) parts.push(MISS_LABEL[a.missType] ?? a.missType);
  if (a.foulType) parts.push(FOUL_LABEL[a.foulType] ?? a.foulType);
  if (a.ball) parts.push(BALL_LABEL[a.ball] ?? a.ball);
  if (a.pocket) parts.push(POCKET_LABEL[a.pocket] ?? a.pocket);
  return parts.length > 0 ? `(${parts.join(", ")})` : "";
}

function attemptColor(a: PracticeAttempt): string {
  if (a.kind === "cleared") return "#fbbf24";
  if (a.kind === "missed" || a.kind === "miss") return "#f87171";
  return "#4ade80";
}

export function TrainingSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<PracticeSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api.practice
      .session(sessionId)
      .then(setSession)
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const stats = useMemo(() => {
    if (!session) return null;
    if (session.mode === "break") {
      let highest = 0;
      let sum = 0;
      let count = 0;
      let cleared = 0;
      let missed = 0;
      for (const a of session.attempts) {
        if (a.kind === "break" || a.kind === "cleared") {
          const v = a.value ?? 0;
          sum += v;
          count += 1;
          if (v > highest) highest = v;
        } else if (a.kind === "missed") {
          sum += 0;
          count += 1;
          missed += 1;
        }
        if (a.kind === "cleared") cleared += 1;
      }
      return {
        kind: "break" as const,
        total: session.attempts.length,
        highest,
        average: count === 0 ? 0 : sum / count,
        cleared,
        missed,
      };
    }
    let hits = 0;
    let misses = 0;
    let cur = 0;
    let best = 0;
    for (const a of session.attempts) {
      if (a.kind === "hit") {
        hits += 1;
        cur += 1;
        if (cur > best) best = cur;
      } else if (a.kind === "miss") {
        misses += 1;
        cur = 0;
      }
    }
    return {
      kind: "hitmiss" as const,
      total: session.attempts.length,
      hits,
      misses,
      hitRate: hits + misses === 0 ? 0 : hits / (hits + misses),
      bestStreak: best,
    };
  }, [session]);

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: "center" }}>
        Laden...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div
        className="glass-card"
        style={{ textAlign: "center", color: "#f87171" }}
      >
        {error ?? "Session nicht gefunden"}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link
          to="/training"
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9em",
          }}
        >
          ‹ Zurück zur Übersicht
        </Link>
      </div>

      <div className="glass-card training-detail-header">
        <div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "1.8em",
              marginBottom: 4,
            }}
          >
            {session.routineName}
            {session.redsCount != null && (
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontWeight: 400,
                  fontSize: "0.7em",
                  marginLeft: 12,
                }}
              >
                {session.redsCount} Rote
              </span>
            )}
          </h1>
          <Link
            to={`/profile/${encodeURIComponent(session.playerName)}`}
            style={{ fontSize: "1.1em" }}
          >
            {session.playerName}
          </Link>
        </div>
        <div style={{ textAlign: "right", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "0.9em" }}>{formatDate(session.startedAt)}</div>
          <div style={{ fontSize: "0.85em", marginTop: 4 }}>
            Dauer: {durationLabel(session.startedAt, session.finishedAt)}
          </div>
          {session.finalized && (
            <div
              style={{
                marginTop: 4,
                fontSize: "0.8em",
                color: "var(--accent-green)",
              }}
            >
              abgeschlossen
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="training-stats-grid">
          {stats.kind === "break" ? (
            <>
              <StatCard label="Höchstes Break" value={stats.highest || "—"} />
              <StatCard
                label="Schnitt"
                value={stats.total === 0 ? "—" : stats.average.toFixed(1)}
              />
              <StatCard label="Aufgeräumt" value={stats.cleared} />
              <StatCard label="Verfehlt" value={stats.missed} />
              <StatCard label="Versuche" value={stats.total} />
            </>
          ) : (
            <>
              <StatCard label="Treffer" value={stats.hits} />
              <StatCard label="Fehler" value={stats.misses} />
              <StatCard
                label="Trefferquote"
                value={
                  stats.total === 0
                    ? "—"
                    : `${Math.round(stats.hitRate * 100)}%`
                }
              />
              <StatCard label="Beste Serie" value={stats.bestStreak} />
              <StatCard label="Versuche" value={stats.total} />
            </>
          )}
        </div>
      )}

      <div className="glass-card" style={{ marginTop: 20 }}>
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.2em",
            marginBottom: 12,
          }}
        >
          Versuche
        </h2>
        {session.attempts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              padding: 12,
            }}
          >
            Keine Versuche
          </div>
        ) : (
          <div className="training-attempts">
            {session.attempts.map((a) => (
              <div key={a.id} className="training-attempt-row">
                <span
                  className="training-attempt-num"
                  style={{ color: "var(--text-muted)" }}
                >
                  #{a.orderIndex + 1}
                </span>
                <span
                  className="training-attempt-kind"
                  style={{ color: attemptColor(a) }}
                >
                  {a.kind === "cleared"
                    ? "✓"
                    : a.kind === "missed" || a.kind === "miss"
                      ? "✕"
                      : "●"}{" "}
                  {a.kind === "break" ? "Break" : a.kind === "cleared" ? "Cleared" : a.kind === "missed" ? "Verfehlt" : a.kind === "hit" ? "Treffer" : "Fehler"}
                </span>
                <span
                  className="training-attempt-value"
                  style={{ color: "var(--text-primary)", fontWeight: 600 }}
                >
                  {attemptValueLabel(a)}
                </span>
                <span
                  className="training-attempt-tags"
                  style={{ color: "var(--text-muted)" }}
                >
                  {attemptTagLabel(a)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass-card training-stat-card">
      <div className="training-stat-value">{value}</div>
      <div className="training-stat-label">{label}</div>
    </div>
  );
}
