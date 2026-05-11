import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";

export function Layout() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("theme") as "dark" | "light") || "dark";
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <>
      <nav className="nav">
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "\u2715" : "\u2630"}
        </button>
        <span className="nav-brand">RRSB Stats</span>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/breaks" onClick={() => setMenuOpen(false)}>
            Breaks
          </NavLink>
          <NavLink to="/live" onClick={() => setMenuOpen(false)}>
            Live Scores
          </NavLink>
          <NavLink to="/highlights" onClick={() => setMenuOpen(false)}>
            Highlights
          </NavLink>
          <NavLink to="/training" onClick={() => setMenuOpen(false)}>
            Training
          </NavLink>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "\u2600\uFE0F" : "\u{1F319}"}
        </button>
      </nav>
      <main className="page-container">
        <Outlet />
      </main>
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}
