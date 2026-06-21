import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiV3, type V3PlayerListItem } from "../lib/apiV3";
import { Flag } from "../components/ui";
import { pct } from "../lib/snooker";

type SortKey = "name" | "matches" | "winrate" | "highbreak";

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
}

export function PlayersPage() {
  const [players, setPlayers] = useState<V3PlayerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("matches");

  useEffect(() => {
    apiV3.players.list().then(setPlayers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const filtered = players.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "matches") return b.matchesPlayed - a.matchesPlayed;
      if (sort === "highbreak") return b.highBreak - a.highBreak;
      return pct(b.matchesWon, b.matchesPlayed) - pct(a.matchesWon, a.matchesPlayed);
    });
    return sorted;
  }, [players, q, sort]);

  return (
    <div className="animate-in">
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Directory</div>
          <h1 className="page-title">Players</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Search players…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 200 }}
          />
          <div className="segmented">
            <button className={sort === "matches" ? "active" : ""} onClick={() => setSort("matches")}>Matches</button>
            <button className={sort === "winrate" ? "active" : ""} onClick={() => setSort("winrate")}>Win %</button>
            <button className={sort === "highbreak" ? "active" : ""} onClick={() => setSort("highbreak")}>High break</button>
            <button className={sort === "name" ? "active" : ""} onClick={() => setSort("name")}>A–Z</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : shown.length === 0 ? (
        <div className="card empty-state">No players yet.</div>
      ) : (
        <div className="grid-auto">
          {shown.map((p) => {
            const wp = pct(p.matchesWon, p.matchesPlayed);
            return (
              <Link key={p.id} to={`/players/${encodeURIComponent(p.name)}`} className="card card-hover" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="profile-avatar" style={{ width: 52, height: 52, borderRadius: 14, fontSize: "1.3rem" }}>
                  {initials(p.name)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <Flag ioc={p.nationalityIOC} />
                  </div>
                  <div style={{ color: "var(--text-3)", fontSize: "0.8rem", marginTop: 3 }}>
                    {p.matchesPlayed} matches · {wp}% won{p.highBreak > 0 ? ` · HB ${p.highBreak}` : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
