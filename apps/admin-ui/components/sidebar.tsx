"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  changeLanguage,
  type Locale,
} from "@/lib/i18n";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", roles: ["SUPER_ADMIN", "ADMIN", "PARTNER_ADMIN"] },
  { href: "/scoreboards", labelKey: "nav.scoreboards", roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/names-lists", labelKey: "nav.namesLists", roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/match-setup", labelKey: "nav.matchSetup", roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/locations", labelKey: "nav.locations", roles: ["SUPER_ADMIN"] },
  { href: "/users", labelKey: "nav.users", roles: ["SUPER_ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="flex h-full w-56 flex-col border-r bg-card">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold">{t("appName")}</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t p-3 space-y-3">
        {/* Language switcher */}
        <div className="flex gap-1">
          {SUPPORTED_LOCALES.map((locale) => (
            <button
              key={locale}
              onClick={() => changeLanguage(locale)}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                i18n.language === locale
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>

        {/* User info */}
        <div className="border-t pt-3">
          <div className="text-xs text-muted-foreground mb-1 truncate">
            {user?.displayName}
          </div>
          <div className="text-xs text-muted-foreground mb-2 truncate">
            {user?.email}
          </div>
          <div className="flex gap-1">
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center rounded-md border border-border px-2 py-1 text-xs font-medium text-destructive hover:bg-accent transition-colors"
            >
              {t("logout")}
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-md border border-border px-2 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title={theme === "dark" ? t("theme.light") : t("theme.dark")}
            >
              {theme === "dark" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
