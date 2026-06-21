import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiV3, type V3MatchSummary } from "../lib/apiV3";
import { matchTypeLabel, formatDate } from "../lib/snooker";

/** The "normal" match type that stays expanded by default. */
const STANDARD_TYPE = "TRAININGS_SPIEL";
const TOP_N = 10;

interface Group {
  code: string;
  label: string;
  matches: V3MatchSummary[];
  latest: number;
}

/** A single thin archive row. */
function ArchiveRow({ m }: { m: V3MatchSummary }) {
  const [p0, p1] = m.players;
  return (
    <Link to={`/match/${m.id}`} className="archive-row">
      <span className="archive-row-score">
        {p0.framesWon}–{p1.framesWon}
      </span>
      <span className="archive-row-players">
        <span className={`nm ${p0.isWinner ? "win" : ""}`}>{p0.name}</span>
        <span className="vs">vs</span>
        <span className={`nm ${p1.isWinner ? "win" : ""}`}>{p1.name}</span>
      </span>
      <span className="archive-row-date">
        {formatDate(m.startedAt)}
        {m.tableNumber ? ` · T${m.tableNumber}` : ""}
      </span>
      <span className="chev">›</span>
    </Link>
  );
}

/** A collapsible per-type group (used for the non-standard formats). */
function GroupSection({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? group.matches : group.matches.slice(0, TOP_N);
  return (
    <div className={`group ${open ? "open" : ""}`}>
      <button className="group-head" onClick={() => setOpen((v) => !v)}>
        <span className="group-chev">›</span>
        <span className="group-name">{group.label}</span>
        <span className="group-count">{group.matches.length}</span>
        <span className="group-latest">{formatDate(new Date(group.latest).toISOString())}</span>
      </button>
      {open && (
        <div className="group-body">
          <div className="archive-list">
            {rows.map((m) => (
              <ArchiveRow key={m.id} m={m} />
            ))}
          </div>
          {group.matches.length > TOP_N && (
            <button className="show-all" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show fewer" : `Show all ${group.matches.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MatchesPage() {
  const [matches, setMatches] = useState<V3MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stdShowAll, setStdShowAll] = useState(false);

  useEffect(() => {
    apiV3.matches
      .list({ limit: 100 })
      .then((r) => setMatches(r.data.filter((m) => m.players.length === 2 && m.status !== "ACTIVE")))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { standard, others } = useMemo(() => {
    const byCode = new Map<string, V3MatchSummary[]>();
    for (const m of matches) {
      const arr = byCode.get(m.matchTypeCode) ?? [];
      arr.push(m);
      byCode.set(m.matchTypeCode, arr);
    }
    const toGroup = (code: string, arr: V3MatchSummary[]): Group => ({
      code,
      label: matchTypeLabel(code, arr[0]?.matchType),
      matches: arr, // already sorted recent-first by the API
      latest: arr.reduce((t, m) => Math.max(t, new Date(m.startedAt).getTime()), 0),
    });
    const standard = byCode.has(STANDARD_TYPE)
      ? toGroup(STANDARD_TYPE, byCode.get(STANDARD_TYPE)!)
      : null;
    const others = [...byCode.entries()]
      .filter(([code]) => code !== STANDARD_TYPE)
      .map(([code, arr]) => toGroup(code, arr))
      .sort((a, b) => b.latest - a.latest); // most-recent format first
    return { standard, others };
  }, [matches]);

  const stdRows = standard ? (stdShowAll ? standard.matches : standard.matches.slice(0, TOP_N)) : [];

  return (
    <div className="animate-in">
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Archive</div>
          <h1 className="page-title">Matches</h1>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : matches.length === 0 ? (
        <div className="card empty-state">No matches in the archive yet.</div>
      ) : (
        <>
          {standard && (
            <div style={{ marginBottom: 30 }}>
              <div className="section-label">
                {standard.label} <span className="group-count">{standard.matches.length}</span>
              </div>
              <div className="archive-list">
                {stdRows.map((m) => (
                  <ArchiveRow key={m.id} m={m} />
                ))}
              </div>
              {standard.matches.length > TOP_N && (
                <button
                  className="btn btn-ghost"
                  style={{ marginTop: 10 }}
                  onClick={() => setStdShowAll((v) => !v)}
                >
                  {stdShowAll ? "Show fewer" : `Show all ${standard.matches.length}`}
                </button>
              )}
            </div>
          )}

          {others.length > 0 && (
            <>
              <div className="section-label">Other formats</div>
              {others.map((g) => (
                <GroupSection key={g.code} group={g} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
