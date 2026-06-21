import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  apiV3,
  type V3PlayerProfile,
  type V3PlayerListItem,
} from "../lib/apiV3";
import { Flag, BreakBadge, StatTile } from "../components/ui";
import { matchTypeLabel, pct, formatDate } from "../lib/snooker";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

/** SVG donut showing a win-rate percentage. */
function WinRing({ value, label }: { value: number; label: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div className="winrate-ring">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#wr)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <defs>
          <linearGradient id="wr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2ee6c4" />
            <stop offset="100%" stopColor="#34d0ff" />
          </linearGradient>
        </defs>
        <text x="60" y="56" textAnchor="middle" fontFamily="Space Grotesk" fontSize="26" fontWeight="700" fill="var(--text)">
          {value}%
        </text>
        <text x="60" y="76" textAnchor="middle" fontSize="10" fill="var(--text-3)" letterSpacing="1.2">
          {label}
        </text>
      </svg>
    </div>
  );
}

function ComparePanel({ me, players }: { me: V3PlayerProfile; players: V3PlayerListItem[] }) {
  const [oppName, setOppName] = useState("");
  const [opp, setOpp] = useState<V3PlayerProfile | null>(null);

  useEffect(() => {
    if (!oppName) {
      setOpp(null);
      return;
    }
    apiV3.players.profile(oppName).then(setOpp).catch(() => setOpp(null));
  }, [oppName]);

  const rows: { label: string; a: number; b: number; suffix?: string }[] = opp
    ? [
        { label: "Matches", a: me.lifetime.matchesPlayed, b: opp.lifetime.matchesPlayed },
        { label: "Win %", a: pct(me.lifetime.matchesWon, me.lifetime.matchesPlayed), b: pct(opp.lifetime.matchesWon, opp.lifetime.matchesPlayed), suffix: "%" },
        { label: "Frames won", a: me.lifetime.framesWon, b: opp.lifetime.framesWon },
        { label: "Frame win %", a: pct(me.lifetime.framesWon, me.lifetime.framesWon + me.lifetime.framesLost), b: pct(opp.lifetime.framesWon, opp.lifetime.framesWon + opp.lifetime.framesLost), suffix: "%" },
        { label: "High break", a: me.lifetime.highBreak, b: opp.lifetime.highBreak },
        { label: "Centuries", a: me.lifetime.centuries, b: opp.lifetime.centuries },
        { label: "Breaks 8+", a: me.lifetime.breaksOver7, b: opp.lifetime.breaksOver7 },
      ]
    : [];

  return (
    <div className="card">
      <div className="section-label">Compare</div>
      <select
        className="glass-btn"
        value={oppName}
        onChange={(e) => setOppName(e.target.value)}
        style={{ width: "100%", marginBottom: 16 }}
      >
        <option value="">Select a player to compare…</option>
        {players
          .filter((p) => p.name !== me.name)
          .map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
      </select>

      {opp && (
        <div className="compare-grid animate-in">
          <div className="compare-val left" style={{ color: "var(--accent)" }}>{me.name.split(" ")[0]}</div>
          <div className="compare-metric" />
          <div className="compare-val right" style={{ color: "var(--violet)" }}>{opp.name.split(" ")[0]}</div>
          {rows.map((r) => (
            <div className="compare-row" key={r.label}>
              <div className={`compare-val left ${r.a >= r.b ? "win" : ""}`}>{r.a}{r.suffix ?? ""}</div>
              <div className="compare-metric">{r.label}</div>
              <div className={`compare-val right ${r.b >= r.a ? "win" : ""}`}>{r.b}{r.suffix ?? ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlayerProfilePage() {
  const { name } = useParams<{ name: string }>();
  const [profile, setProfile] = useState<V3PlayerProfile | null>(null);
  const [players, setPlayers] = useState<V3PlayerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    setError(false);
    apiV3.players
      .profile(name)
      .then(setProfile)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    apiV3.players.list().then(setPlayers).catch(() => {});
  }, [name]);

  const filteredMatches = useMemo(() => {
    if (!profile) return [];
    if (typeFilter === "ALL") return profile.recentMatches;
    return profile.recentMatches.filter((m) => m.matchType === typeFilter);
  }, [profile, typeFilter]);

  if (loading) return <div className="spinner" />;
  if (error || !profile) return <div className="card empty-state">Player not found.</div>;

  const lt = profile.lifetime;
  const winPct = pct(lt.matchesWon, lt.matchesPlayed);
  const framePct = pct(lt.framesWon, lt.framesWon + lt.framesLost);
  const avgFor = lt.matchesPlayed ? Math.round(lt.pointsFor / lt.matchesPlayed) : 0;
  const topBreaks = [...lt.highBreaks].sort((a, b) => b - a).slice(0, 8);
  const matchTypes = Array.from(new Set(profile.recentMatches.map((m) => m.matchType)));

  return (
    <div className="animate-in">
      <Link to="/players" className="back-link">‹ All players</Link>

      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-avatar">{initials(profile.name)}</div>
        <div className="profile-id">
          <div className="profile-name">
            {profile.name}
            <Flag ioc={profile.nationalityIOC} size={26} />
          </div>
          <div className="profile-meta">
            {profile.club && <span>{profile.club}</span>}
            {profile.club && <span>·</span>}
            <span>{lt.matchesPlayed} matches</span>
            <span>·</span>
            <span>{lt.framesWon + lt.framesLost} frames</span>
            {lt.highBreak > 0 && (
              <>
                <span>·</span>
                <span>High break {lt.highBreak}</span>
              </>
            )}
          </div>
        </div>
        <div className="profile-spacer" />
        <WinRing value={winPct} label="Win rate" />
      </div>

      {/* Key stats */}
      <div className="stat-grid" style={{ marginTop: 18 }}>
        <StatTile label="Matches won" value={lt.matchesWon} sub={`${lt.matchesLost} lost`} accent />
        <StatTile label="Frame win %" value={<span className="grad-text">{framePct}%</span>} sub={`${lt.framesWon}–${lt.framesLost}`} />
        <StatTile label="High break" value={lt.highBreak} sub={`${lt.breaksOver7} breaks 8+`} />
        <StatTile label="Centuries" value={<span className="gold-text">{lt.centuries}</span>} />
        <StatTile label="Avg points / match" value={avgFor} />
        <StatTile label="Fouls conceded" value={lt.foulPointsConceded} sub={`${lt.foulsCommitted} fouls`} />
      </div>

      <div className="two-col" style={{ marginTop: 18 }}>
        <div className="col-stack">
          {/* By match type */}
          {profile.byMatchType.length > 0 && (
            <div className="card">
              <div className="section-label">By format</div>
              {profile.byMatchType.map((s) => {
                const wp = pct(s.matchesWon, s.matchesPlayed);
                return (
                  <div className="bar-row" key={s.matchType}>
                    <div className="bar-label">{matchTypeLabel(s.matchType)}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${wp}%` }} />
                    </div>
                    <div className="bar-val">{s.matchesWon}/{s.matchesPlayed} · {wp}%</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent matches */}
          <div className="card">
            <div className="frame-detail-head" style={{ marginBottom: 14 }}>
              <div className="section-label" style={{ margin: 0 }}>Recent matches</div>
              {matchTypes.length > 1 && (
                <select className="glass-btn" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="ALL">All formats</option>
                  {matchTypes.map((t) => (
                    <option key={t} value={t}>{matchTypeLabel("", t)}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-stack">
              {filteredMatches.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 0" }}>No matches.</div>
              ) : (
                filteredMatches.map((m) => {
                  const res = m.isWinner ? "w" : m.status !== "ACTIVE" && m.framesWon === m.framesLost ? "d" : "l";
                  return (
                    <Link key={m.matchId} to={`/match/${m.matchId}`} className="match-row">
                      <span className={`match-row-result ${res}`}>{res.toUpperCase()}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="match-row-opp">vs {m.opponent ?? "—"}</div>
                        <div className="match-row-sub">{matchTypeLabel("", m.matchType)} · {formatDate(m.startedAt)}{m.highBreak > 0 ? ` · HB ${m.highBreak}` : ""}</div>
                      </div>
                      <span className="match-row-score">{m.framesWon}–{m.framesLost}</span>
                      <span style={{ color: "var(--text-dim)" }}>›</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-stack">
          {/* Top breaks */}
          <div className="card">
            <div className="section-label">Top breaks</div>
            {topBreaks.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {topBreaks.map((b, i) => (
                  <BreakBadge key={i} value={b} />
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--text-3)", fontSize: "0.88rem" }}>No breaks above 7 yet.</div>
            )}
          </div>

          {/* Compare */}
          <ComparePanel me={profile} players={players} />
        </div>
      </div>
    </div>
  );
}
