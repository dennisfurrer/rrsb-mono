import { useState, useEffect } from "react";
import { api, type HighlightPeriods, type HighlightPlayer } from "../lib/api";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function HighlightsPage() {
  const [periods, setPeriods] = useState<HighlightPeriods | null>(null);
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [player, setPlayer] = useState<HighlightPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    api.highlights
      .availablePeriods()
      .then((data) => {
        setPeriods(data);
        // Start at last month
        if (data.months.length > 0) {
          setCurrentIndex(data.months.length - 1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch highlight data when period changes
  useEffect(() => {
    if (!periods) return;
    setRevealed(false);
    setPlayer(null);

    const list = mode === "monthly" ? periods.months : periods.years;
    if (list.length === 0) return;

    const idx = Math.min(currentIndex, list.length - 1);
    setLoading(true);

    if (mode === "monthly") {
      const { year, month } = periods.months[idx];
      api.highlights
        .month(year, month)
        .then((res) => setPlayer(res.playerOfTheMonth))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      const year = periods.years[idx];
      api.highlights
        .year(year)
        .then((res) => setPlayer(res.playerOfTheYear))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [periods, mode, currentIndex]);

  function handleModeSwitch(newMode: "monthly" | "yearly") {
    setMode(newMode);
    if (!periods) return;
    const list = newMode === "monthly" ? periods.months : periods.years;
    setCurrentIndex(Math.max(0, list.length - 1));
  }

  function getPeriodLabel(): string {
    if (!periods) return "";
    if (mode === "monthly") {
      const list = periods.months;
      if (list.length === 0) return "";
      const idx = Math.min(currentIndex, list.length - 1);
      const { year, month } = list[idx];
      return `${MONTH_NAMES[month - 1]} ${year}`;
    }
    const list = periods.years;
    if (list.length === 0) return "";
    return String(list[Math.min(currentIndex, list.length - 1)]);
  }

  function getListLength(): number {
    if (!periods) return 0;
    return mode === "monthly" ? periods.months.length : periods.years.length;
  }

  if (loading && !periods)
    return <div className="empty-state">Loading...</div>;

  return (
    <div className="animate-in">
      <h1 className="page-title">Highlights</h1>

      {/* Period selector */}
      <div className="glass-card" style={{ marginBottom: 24, padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <button
            className={`glass-btn ${mode === "monthly" ? "active" : ""}`}
            onClick={() => handleModeSwitch("monthly")}
          >
            Monthly
          </button>
          <button
            className={`glass-btn ${mode === "yearly" ? "active" : ""}`}
            onClick={() => handleModeSwitch("yearly")}
          >
            Yearly
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <button
            className="glass-btn"
            disabled={currentIndex <= 0}
            onClick={() => {
              setCurrentIndex((i) => i - 1);
              setRevealed(false);
            }}
          >
            &larr;
          </button>
          <span
            style={{
              fontWeight: 600,
              fontSize: "1.1em",
              minWidth: 160,
              textAlign: "center",
            }}
          >
            {getPeriodLabel()}
          </span>
          <button
            className="glass-btn"
            disabled={currentIndex >= getListLength() - 1}
            onClick={() => {
              setCurrentIndex((i) => i + 1);
              setRevealed(false);
            }}
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Card */}
      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : !player ? (
        <div className="empty-state">
          No highlight data for this period.
        </div>
      ) : (
        <div
          style={{ display: "flex", justifyContent: "center" }}
        >
          <div
            className="highlight-card-container"
            onClick={() => setRevealed(true)}
          >
            <div
              className={`highlight-card ${revealed ? "revealed" : ""}`}
            >
              {/* Card back */}
              <div className="highlight-card-back glass-card">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: 16,
                  }}
                >
                  <div style={{ fontSize: "3em" }}>{"\u{1F381}"}</div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.2em",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    Player of the {mode === "monthly" ? "Month" : "Year"}
                  </div>
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.9em",
                    }}
                  >
                    Click to reveal
                  </div>
                </div>
              </div>

              {/* Card front */}
              <div className="highlight-card-front">
                <div className="highlight-card-header">
                  <div
                    style={{
                      fontSize: "0.8em",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                    }}
                  >
                    {mode === "monthly"
                      ? "Player of the Month"
                      : "Player of the Year"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85em",
                      opacity: 0.8,
                    }}
                  >
                    {getPeriodLabel()}
                  </div>
                </div>
                <div className="highlight-card-body">
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.5em",
                      fontFamily: "'Space Grotesk', sans-serif",
                      marginBottom: 16,
                      color: "#eab308",
                    }}
                  >
                    {player.name}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {player.achievements.map((a, i) => (
                      <div
                        key={i}
                        className="glass-card animate-in"
                        style={{
                          padding: "10px 12px",
                          textAlign: "center",
                          animationDelay: `${0.3 + i * 0.1}s`,
                        }}
                      >
                        <div style={{ fontSize: "1.4em", marginBottom: 4 }}>
                          {a.icon}
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "1.1em",
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {a.value}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75em",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {a.stat}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
