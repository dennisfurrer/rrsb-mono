"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  changeLanguage,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { Menu, Sun, Moon } from "lucide-react";

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return <span className="text-sm font-medium text-text-secondary">Dashboard</span>;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      {segments.map((segment, i) => {
        const isLast = i === segments.length - 1;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
        return (
          <span key={segment + i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-text-muted/40 text-xs">/</span>}
            <span className={isLast ? "text-text-primary font-medium" : "text-text-muted hover:text-text-secondary transition-colors"}>
              {label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Close sidebar + scroll main to top on route change
  useEffect(() => {
    setSidebarOpen(false);
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  const handleToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0">
        <div className="flex items-center gap-2 text-text-muted">
          <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar: hidden on mobile by default, shown as overlay when open */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 md:w-64 lg:w-72 transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-sidebar/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleToggle}
              className="md:hidden p-1.5 -ml-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 overflow-hidden">
              <Breadcrumbs />
            </div>
          </div>

          {/* Language switcher + Theme toggle */}
          <div className="flex items-center gap-1">
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                key={locale}
                onClick={() => changeLanguage(locale)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150",
                  i18n.language === locale
                    ? "bg-accent/[0.08] text-accent"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {LOCALE_LABELS[locale]}
              </button>
            ))}
            <button
              onClick={toggleTheme}
              className="rounded-md p-1.5 text-text-muted hover:text-text-secondary transition-all duration-150"
              title={theme === "dark" ? t("theme.light") : t("theme.dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Main content */}
        <main ref={mainRef} className="main-surface flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}
