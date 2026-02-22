import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { api, type BreakEntry, type BreakMatrixEntry } from "../lib/api";

Chart.register(...registerables, ChartDataLabels);

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getBreakClass(value: number): string {
  if (value >= 100) return "century";
  if (value >= 70) return "elite";
  if (value >= 50) return "high";
  if (value >= 20) return "mid";
  return "low";
}

export function BreaksPage() {
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [dailyBreaks, setDailyBreaks] = useState<BreakEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Historical
  const [years, setYears] = useState<number[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [leaderboard, setLeaderboard] = useState<BreakEntry[]>([]);
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixData, setMatrixData] = useState<BreakMatrixEntry[]>([]);

  const dailyChartRef = useRef<HTMLCanvasElement>(null);
  const dailyChartInstance = useRef<Chart | null>(null);
  const matrixChartRef = useRef<HTMLCanvasElement>(null);
  const matrixChartInstance = useRef<Chart | null>(null);

  // Load available years
  useEffect(() => {
    api.data.years().then(setYears).catch(console.error);
  }, []);

  // Load daily breaks
  useEffect(() => {
    setLoading(true);
    api.breaks
      .byDate(date)
      .then((data) => {
        setDailyBreaks(
          data.sort(
            (a, b) =>
              Math.max(...(b.highBreaks.length ? b.highBreaks : [0])) -
              Math.max(...(a.highBreaks.length ? a.highBreaks : [0]))
          )
        );
      })
      .catch(() => setDailyBreaks([]))
      .finally(() => setLoading(false));
  }, [date]);

  // Load leaderboard
  useEffect(() => {
    const p =
      selectedPeriod === "all"
        ? api.breaks.leaderboard()
        : api.breaks.byYear(Number(selectedPeriod));
    p.then(setLeaderboard).catch(() => setLeaderboard([]));
  }, [selectedPeriod]);

  // Daily chart
  useEffect(() => {
    if (!dailyChartRef.current || dailyBreaks.length === 0) return;
    if (dailyChartInstance.current) dailyChartInstance.current.destroy();

    const allBreaks = dailyBreaks.flatMap((e) => e.highBreaks);
    const ranges = [
      { label: "< 20", min: 0, max: 20, color: "rgba(156,163,175,0.8)" },
      { label: "20-49", min: 20, max: 50, color: "rgba(59,130,246,0.8)" },
      { label: "50-69", min: 50, max: 70, color: "rgba(139,92,246,0.8)" },
      { label: "70-99", min: 70, max: 100, color: "rgba(234,179,8,0.8)" },
      { label: "100+", min: 100, max: Infinity, color: "rgba(236,72,153,0.8)" },
    ];

    dailyChartInstance.current = new Chart(dailyChartRef.current, {
      type: "bar",
      data: {
        labels: ranges.map((r) => r.label),
        datasets: [
          {
            data: ranges.map(
              (r) => allBreaks.filter((b) => b >= r.min && b < r.max).length
            ),
            backgroundColor: ranges.map((r) => r.color),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            color: "#fff",
            font: { weight: "bold" },
            display: (ctx) => (ctx.dataset.data[ctx.dataIndex] as number) > 0,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "#94a3b8", stepSize: 1 },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
          x: {
            ticks: { color: "#94a3b8" },
            grid: { display: false },
          },
        },
      },
    });

    return () => {
      dailyChartInstance.current?.destroy();
    };
  }, [dailyBreaks]);

  // Matrix chart
  const renderMatrix = useCallback(() => {
    if (!matrixChartRef.current || matrixData.length === 0) return;
    if (matrixChartInstance.current) matrixChartInstance.current.destroy();

    const top15 = [...matrixData]
      .sort((a, b) => b["Highest Break"] - a["Highest Break"])
      .slice(0, 15);

    const breakRanges = [
      { key: "20+" as const, color: "rgba(59,130,246,0.8)" },
      { key: "30+" as const, color: "rgba(99,102,241,0.8)" },
      { key: "40+" as const, color: "rgba(139,92,246,0.8)" },
      { key: "50+" as const, color: "rgba(168,85,247,0.8)" },
      { key: "60+" as const, color: "rgba(192,132,252,0.8)" },
      { key: "70+" as const, color: "rgba(234,179,8,0.8)" },
      { key: "80+" as const, color: "rgba(245,158,11,0.8)" },
      { key: "90+" as const, color: "rgba(249,115,22,0.8)" },
      { key: "100+" as const, color: "rgba(236,72,153,0.8)" },
    ];

    matrixChartInstance.current = new Chart(matrixChartRef.current, {
      type: "bar",
      data: {
        labels: top15.map((p) => p.player_name),
        datasets: breakRanges.map((r) => ({
          label: r.key,
          data: top15.map((p) => p[r.key]),
          backgroundColor: r.color,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#94a3b8" } },
          datalabels: { display: false },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: "#94a3b8", maxRotation: 45, minRotation: 45 },
            grid: { display: false },
          },
          y: {
            stacked: true,
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
        },
      },
    });
  }, [matrixData]);

  useEffect(() => {
    if (showMatrix) renderMatrix();
    return () => {
      matrixChartInstance.current?.destroy();
    };
  }, [showMatrix, renderMatrix]);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  }

  function handleMatrixToggle() {
    if (!showMatrix && matrixData.length === 0) {
      api.breaks.matrix().then(setMatrixData).catch(console.error);
    }
    setShowMatrix(!showMatrix);
  }

  return (
    <div className="animate-in">
      <h1 className="page-title">Daily Breaks</h1>

      {/* Date selector */}
      <div className="date-selector">
        <button onClick={() => shiftDate(-1)}>&larr;</button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button onClick={() => shiftDate(1)}>&rarr;</button>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : dailyBreaks.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: "3em", marginBottom: "12px" }}>
            {"\u{1F534}\u{1F534}\u{1F534}"}
          </p>
          <p>No breaks recorded for this date.</p>
          <p style={{ marginTop: 8, fontSize: "0.9em" }}>
            Try selecting a different date.
          </p>
        </div>
      ) : (
        <>
          {/* Daily chart */}
          <div
            className="glass-card"
            style={{ marginBottom: 24, height: 220, padding: "16px" }}
          >
            <canvas ref={dailyChartRef} />
          </div>

          {/* Player cards */}
          <div className="grid-auto">
            {dailyBreaks.map((entry, i) => (
              <div
                key={entry.playerName}
                className="glass-card animate-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Link
                    to={`/profile/${encodeURIComponent(entry.playerName)}`}
                    style={{
                      fontWeight: 600,
                      fontSize: "1.05em",
                    }}
                  >
                    {entry.playerName}
                  </Link>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    marginBottom: 8,
                    fontSize: "0.85em",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>
                    High:{" "}
                    <strong>
                      {entry.highBreaks.length
                        ? Math.max(...entry.highBreaks)
                        : 0}
                    </strong>
                  </span>
                  <span style={{ margin: "0 6px" }}>|</span>
                  <span>
                    Count: <strong>{entry.highBreaks.length}</strong>
                  </span>
                  <span style={{ margin: "0 6px" }}>|</span>
                  <span>
                    Avg:{" "}
                    <strong>
                      {entry.highBreaks.length
                        ? Math.round(
                            entry.highBreaks.reduce((a, b) => a + b, 0) /
                              entry.highBreaks.length
                          )
                        : 0}
                    </strong>
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {[...entry.highBreaks]
                    .sort((a, b) => b - a)
                    .map((b, j) => (
                      <span
                        key={j}
                        className={`break-badge ${getBreakClass(b)}`}
                      >
                        {b}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Historical section */}
      <div style={{ marginTop: 48 }}>
        <h2 className="page-title" style={{ fontSize: "1.4em" }}>
          Historical Breaks
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <select
            className="glass-btn"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ minWidth: 140 }}
          >
            <option value="all">All-time</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          <button className="glass-btn" onClick={handleMatrixToggle}>
            {showMatrix ? "Show Leaderboard" : "Break Matrix"}
          </button>
        </div>

        {showMatrix ? (
          <div className="glass-card" style={{ height: 400, padding: "16px" }}>
            <canvas ref={matrixChartRef} />
          </div>
        ) : (
          <div className="glass-card" style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Highest</th>
                  <th>Top Breaks</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => {
                  const sorted = [...entry.highBreaks].sort((a, b) => b - a);
                  return (
                    <tr key={entry.playerName}>
                      <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                      <td>
                        <Link
                          to={`/profile/${encodeURIComponent(entry.playerName)}`}
                        >
                          {entry.playerName}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={`break-badge ${getBreakClass(sorted[0] ?? 0)}`}
                        >
                          {sorted[0] ?? "-"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            flexWrap: "wrap",
                          }}
                        >
                          {sorted.slice(1, 6).map((b, j) => (
                            <span
                              key={j}
                              className={`break-badge ${getBreakClass(b)}`}
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
        )}
      </div>
    </div>
  );
}
