import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { api, type PlayerProfile } from "../lib/api";

Chart.register(...registerables, ChartDataLabels);

function getBreakClass(value: number): string {
  if (value >= 100) return "century";
  if (value >= 70) return "elite";
  if (value >= 50) return "high";
  if (value >= 20) return "mid";
  return "low";
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

export function PlayerProfilePage() {
  const { name } = useParams<{ name: string }>();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    setError(null);
    api.players
      .profile(name)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [name]);

  // Win rate chart
  useEffect(() => {
    if (!chartRef.current || !profile) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const matchWinRate =
      profile.matchesCompleted > 0
        ? Math.round((profile.matchesWon / profile.matchesCompleted) * 100)
        : 0;
    const frameWinRate =
      profile.framesWon + profile.framesLost > 0
        ? Math.round(
            (profile.framesWon / (profile.framesWon + profile.framesLost)) * 100
          )
        : 0;
    const deciderRate = Math.round(profile.deciderWinRate);

    chartInstance.current = new Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Match Win %", "Frame Win %", "Decider Win %"],
        datasets: [
          {
            data: [matchWinRate, frameWinRate, deciderRate],
            backgroundColor: [
              "rgba(234,179,8,0.9)",
              "rgba(20,255,236,0.9)",
              "rgba(139,92,246,0.9)",
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#94a3b8", padding: 16 },
          },
          datalabels: {
            color: "#fff",
            font: { weight: "bold", size: 14 },
            formatter: (val: number) => `${val}%`,
          },
        },
      },
    });

    return () => {
      chartInstance.current?.destroy();
    };
  }, [profile]);

  if (loading) return <div className="empty-state">Loading...</div>;
  if (error) return <div className="empty-state">Error: {error}</div>;
  if (!profile) return <div className="empty-state">Player not found.</div>;

  const matchWinRate =
    profile.matchesCompleted > 0
      ? Math.round((profile.matchesWon / profile.matchesCompleted) * 100)
      : 0;
  const frameWinRate =
    profile.framesWon + profile.framesLost > 0
      ? Math.round(
          (profile.framesWon / (profile.framesWon + profile.framesLost)) * 100
        )
      : 0;

  const topBreaks = [...profile.highBreaks].sort((a, b) => b - a).slice(0, 10);
  const hasCentury = profile.highBreaks.some((b) => b >= 100);

  const stats = [
    { label: "Matches Won", value: profile.matchesWon },
    { label: "Matches Lost", value: profile.matchesLost },
    { label: "Match Win Rate", value: matchWinRate, suffix: "%" },
    { label: "Frames Won", value: profile.framesWon },
    { label: "Frames Lost", value: profile.framesLost },
    { label: "Frame Win Rate", value: frameWinRate, suffix: "%" },
    { label: "Avg Break / Match", value: Math.round(profile.averageBreakPerMatch) },
    { label: "Win Streak", value: profile.longestWinStreak },
    { label: "Decider Win Rate", value: Math.round(profile.deciderWinRate), suffix: "%" },
  ];

  return (
    <div className="animate-in">
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 className="page-title" style={{ marginBottom: 8 }}>
          {profile.name}
        </h1>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {hasCentury && (
            <span className="break-badge century" style={{ fontSize: "0.8em" }}>
              Century Maker
            </span>
          )}
          {profile.matchesWon > 100 && (
            <span
              className="break-badge elite"
              style={{ fontSize: "0.8em" }}
            >
              Champion
            </span>
          )}
          {matchWinRate >= 70 && profile.matchesCompleted >= 10 && (
            <span
              className="break-badge high"
              style={{ fontSize: "0.8em" }}
            >
              Win Rate Master
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid-auto" style={{ marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="glass-card stat-card animate-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="stat-value">
              <AnimatedNumber value={s.value} />
              {s.suffix ?? ""}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts and top breaks row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Win rate chart */}
        <div className="glass-card" style={{ height: 300, padding: 16 }}>
          <h3
            style={{
              fontSize: "0.9em",
              color: "var(--text-muted)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Win Rate Analysis
          </h3>
          <div style={{ height: "calc(100% - 30px)" }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* Top 10 breaks */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3
            style={{
              fontSize: "0.9em",
              color: "var(--text-muted)",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Top 10 Breaks
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: 8,
            }}
          >
            {topBreaks.map((b, i) => (
              <div
                key={i}
                className={`break-badge ${getBreakClass(b)} animate-in`}
                style={{
                  animationDelay: `${i * 0.08}s`,
                  fontSize: "1.1em",
                  padding: "8px 12px",
                  textAlign: "center",
                }}
              >
                {b}
              </div>
            ))}
            {topBreaks.length === 0 && (
              <span style={{ color: "var(--text-muted)" }}>No breaks yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Most frequent opponent */}
      {profile.mostFrequentOpponent && (
        <div className="glass-card" style={{ marginBottom: 32 }}>
          <h3
            style={{
              fontSize: "0.9em",
              color: "var(--text-muted)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Rivalry
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link
              to={`/profile/${encodeURIComponent(profile.mostFrequentOpponent.opponent)}`}
              style={{ fontWeight: 600, fontSize: "1.1em" }}
            >
              {profile.mostFrequentOpponent.opponent}
            </Link>
            <span style={{ color: "var(--text-secondary)" }}>
              {profile.mostFrequentOpponent.total_matches} matches &middot;{" "}
              {profile.mostFrequentOpponent.wins} wins &middot;{" "}
              {Math.round(profile.mostFrequentOpponent.win_percentage)}% win rate
            </span>
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: "center" }}>
        <Link
          to={`/matches/${encodeURIComponent(profile.name)}`}
          className="glass-btn active"
          style={{ padding: "12px 24px", fontSize: "1em" }}
        >
          View Match History
        </Link>
      </div>
    </div>
  );
}
