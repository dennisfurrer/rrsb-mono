import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";

const LINKS: { to: string; label: string; disabled?: boolean }[] = [
  { to: "/live", label: "Live" },
  { to: "/matches", label: "Matches" },
  { to: "/players", label: "Players" },
  { to: "/breaks", label: "Breaks" },
];

export function Layout() {
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("theme") as "dark" | "light") || "dark"
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <>
      <nav className="nav">
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? "✕" : "☰"}
        </button>
        <span className="nav-brand">
          <span className="brand-dot" />
          RRSB<span className="brand-accent">Stats</span>
        </span>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          {LINKS.map((l) =>
            l.disabled ? (
              <span key={l.to} className="nav-disabled" title="Coming soon">
                {l.label}
              </span>
            ) : (
              <NavLink key={l.to} to={l.to} onClick={() => setMenuOpen(false)}>
                {l.label}
              </NavLink>
            )
          )}
        </div>
        <span className="nav-spacer" />
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "\u{1F319}"}
        </button>
      </nav>
      <main className="page-container">
        <Outlet />
      </main>
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
}
