import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiV3, type V3Club, type V3Table, type V3TableMatch } from "../lib/apiV3";
import { Flag, BreakBadge } from "../components/ui";
import { matchTypeLabel } from "../lib/snooker";

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(m: V3TableMatch): string {
  if (m.status === "ACTIVE") return `Started ${shortTime(m.startedAt)}`;
  if (m.status === "ABORTED") return `Stopped ${shortDate(m.finishedAt ?? m.startedAt)}`;
  return `Ended ${shortDate(m.finishedAt ?? m.startedAt)}`;
}

function firstName(n: string): string {
  // Keep surname-style "Losi.M" intact; otherwise show the full name (CSS ellipsizes).
  return n;
}

/** One table card: live match, most-recent score, or zeros. */
function TableCard({ table }: { table: { tableNumber: number | null; match: V3TableMatch | null } }) {
  const m = table.match;
  const n = table.tableNumber;
  const tlabel = n != null ? `Table ${n}` : "No table";

  if (!m) {
    return (
      <div className="tcard empty">
        <div className="tcard-head">
          <span className="tcard-table">{tlabel}</span>
          <span className="tcard-status">—</span>
        </div>
        <div className="tcard-players">
          <span className="tcard-pname dim">—</span>
          <span className="tcard-pname dim right">—</span>
        </div>
        <div className="tcard-stat frames">
          <span className="v dim">0</span><span className="l">Frames</span><span className="v dim">0</span>
        </div>
        <div className="tcard-stat score">
          <span className="v">0</span><span className="l">Score</span><span className="v">0</span>
        </div>
        <div className="tcard-stat breaks">
          <span className="v" /><span className="l">Breaks</span><span className="v" />
        </div>
      </div>
    );
  }

  const [p0, p1] = m.players;
  const active = m.status === "ACTIVE";
  const w = active ? null : p0.framesWon > p1.framesWon ? 0 : p1.framesWon > p0.framesWon ? 1 : null;
  const b0 = [...p0.highBreaks].sort((a, b) => b - a).slice(0, 4);
  const b1 = [...p1.highBreaks].sort((a, b) => b - a).slice(0, 4);

  return (
    <Link to={`/match/${m.id}`} className={`tcard ${active ? "live" : ""}`}>
      <div className="tcard-head">
        <span className="tcard-table">
          {active && <span className="status-dot live" />}
          {tlabel}
        </span>
        <span className={`tcard-status ${active ? "live" : ""}`}>{statusLabel(m)}</span>
        <span className="tcard-expand">⤢</span>
      </div>

      <div className="tcard-type">{matchTypeLabel(m.matchTypeCode, m.matchType)}</div>

      <div className="tcard-players">
        <span className={`tcard-pname ${w === 0 ? "win" : ""}`}>
          <Flag ioc={p0.nationalityIOC} size={16} /> <span className="nm">{firstName(p0.name)}</span>
        </span>
        <span className={`tcard-pname right ${w === 1 ? "win" : ""}`}>
          <span className="nm">{firstName(p1.name)}</span> <Flag ioc={p1.nationalityIOC} size={16} />
        </span>
      </div>

      <div className="tcard-stat frames">
        <span className={`v ${w === 0 ? "win" : ""}`}>{p0.framesWon}</span>
        <span className="l">Frames</span>
        <span className={`v ${w === 1 ? "win" : ""}`}>{p1.framesWon}</span>
      </div>

      <div className="tcard-stat score">
        <span className={`v ${active && m.frameScore[0] > m.frameScore[1] ? "lead" : ""}`}>{m.frameScore[0]}</span>
        <span className="l">Score</span>
        <span className={`v ${active && m.frameScore[1] > m.frameScore[0] ? "lead" : ""}`}>{m.frameScore[1]}</span>
      </div>

      <div className="tcard-stat breaks">
        <span className="v breaks-list">{b0.map((b, i) => <BreakBadge key={i} value={b} small />)}</span>
        <span className="l">Breaks</span>
        <span className="v breaks-list right">{b1.map((b, i) => <BreakBadge key={i} value={b} small />)}</span>
      </div>
    </Link>
  );
}

export function LiveScoresPage() {
  const [clubs, setClubs] = useState<V3Club[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [tables, setTables] = useState<V3Table[]>([]);
  const [otherMatches, setOtherMatches] = useState<V3TableMatch[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval>>(null);

  // Load clubs once, default-select the default club.
  useEffect(() => {
    apiV3.clubs
      .list()
      .then((cs) => {
        setClubs(cs);
        const def = cs.find((c) => c.isDefault) ?? cs[0];
        if (def) setClubId(def.id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadTables = useCallback((id: string) => {
    apiV3.clubs
      .tables(id)
      .then((t) => {
        setTables(t.tables);
        setOtherMatches(t.otherMatches ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Poll the selected club's tables every 5s.
  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    loadTables(clubId);
    timer.current = setInterval(() => loadTables(clubId), 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [clubId, loadTables]);

  const liveCount = tables.filter((t) => t.match?.status === "ACTIVE").length;

  return (
    <div className="animate-in">
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Tables in play</div>
          <h1 className="page-title">Live Scores</h1>
        </div>
        <div className="live-head-controls">
          <span className="chip accent">
            <span className="status-dot live" /> {liveCount} live
          </span>
          {clubs.length > 0 && (
            <select
              className="glass-btn"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              aria-label="Filter by club"
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading && tables.length === 0 ? (
        <div className="spinner" />
      ) : (
        <>
          <div className="tables-grid">
            {tables.map((t) => (
              <TableCard key={t.tableNumber} table={t} />
            ))}
          </div>

          {otherMatches.length > 0 && (
            <div className={`group ${otherOpen ? "open" : ""}`} style={{ marginTop: 16 }}>
              <button className="group-head" onClick={() => setOtherOpen((v) => !v)}>
                <span className="group-chev">›</span>
                <span className="group-name">Unknown table</span>
                <span className="group-count">{otherMatches.length}</span>
              </button>
              {otherOpen && (
                <div className="group-body">
                  <div className="tables-grid">
                    {otherMatches.map((m) => (
                      <TableCard key={m.id} table={{ tableNumber: m.tableNumber ?? null, match: m }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
