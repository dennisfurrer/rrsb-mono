"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Monitor,
  List,
  Swords,
  MapPin,
  Users,
  Shield,
  LogOut,
  Trophy,
  Lock,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface NavSection {
  labelKey: string;
  badge?: string;
  badgeRight?: boolean;
  items: NavItem[];
  roles: string[];
  separatorBefore?: boolean;
  separatorAfter?: boolean;
  dimmed?: boolean;
  href?: string;
  icon?: LucideIcon;
  /** Render items without icons, in compact/small style */
  compact?: boolean;
}

const navSections: NavSection[] = [
  {
    labelKey: "nav.quickLinks",
    icon: Zap,
    roles: ["SUPER_ADMIN", "ADMIN", "PARTNER_ADMIN"],
    separatorAfter: true,
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/match-setup", labelKey: "nav.manageMatches", icon: Swords },
      { href: "/scoreboards", labelKey: "nav.manageScoreboards", icon: Monitor },
      { href: "/names-lists", labelKey: "nav.managePlayerLists", icon: List },
    ],
  },
  {
    labelKey: "nav.tournamentMode",
    badge: "nav.comingSoon",
    badgeRight: true,
    roles: ["SUPER_ADMIN", "ADMIN", "PARTNER_ADMIN"],
    dimmed: true,
    items: [
      { href: "#", labelKey: "nav.tournamentWT", icon: Trophy, disabled: true },
      { href: "#", labelKey: "nav.tournamentOpen", icon: Trophy, disabled: true },
      { href: "#", labelKey: "nav.tournamentQT", icon: Trophy, disabled: true },
      { href: "#", labelKey: "nav.tournamentSSC", icon: Trophy, disabled: true },
    ],
  },
  {
    labelKey: "nav.admin",
    roles: ["SUPER_ADMIN", "ADMIN"],
    separatorBefore: true,
    compact: true,
    items: [
      { href: "/users", labelKey: "nav.manageTeamAccess", icon: Users },
    ],
  },
  {
    labelKey: "nav.superAdmin",
    roles: ["SUPER_ADMIN"],
    separatorBefore: true,
    items: [
      { href: "/users", labelKey: "nav.manageAccess", icon: Shield },
      { href: "/locations", labelKey: "nav.manageLocations", icon: MapPin },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const visibleSections = navSections.filter(
    (section) => user && section.roles.includes(user.role)
  );

  // For SUPER_ADMIN, hide the Admin section (they get Super Admin instead)
  const filteredSections = visibleSections.filter((section) => {
    if (user?.role === "SUPER_ADMIN" && section.labelKey === "nav.admin") return false;
    return true;
  });

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.role === "SUPER_ADMIN" ? "SA" : "AD";

  return (
    <aside className="w-72 md:w-64 lg:w-72 h-full bg-sidebar border-r border-border flex flex-col shrink-0 relative">
      {/* Subtle right-edge gradient */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-accent/[0.08] via-transparent to-accent/[0.04] z-10" />

      {/* Logo + Brand */}
      <div className="shrink-0 border-b border-border px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/round-robin-logo.png"
            alt="Round Robin Sports"
            width={48}
            height={48}
            className="w-12 h-12 object-contain shrink-0"
            priority
          />
          <span className="text-base font-display font-extrabold tracking-tight">
            <span className="text-text-primary">RRSB</span>{" "}
            <span className="text-accent/70">Admin</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <nav className="py-4 px-3 space-y-1">
          {filteredSections.map((section, sIdx) => (
            <div key={section.labelKey + sIdx}>
              {section.separatorBefore && (
                <div className="border-t border-border-strong mt-8 mb-8" />
              )}

              {/* Section with href = clickable section label */}
              {section.href ? (
                <Link
                  href={section.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 mb-1",
                    pathname === section.href
                      ? "bg-accent/[0.10] text-accent font-semibold shadow-[inset_0_0_0_1px_rgba(212,168,67,0.12)]"
                      : "text-text-primary hover:text-accent hover:bg-white/[0.04]"
                  )}
                >
                  {section.icon && (
                    <section.icon className={cn("w-[18px] h-[18px] shrink-0", pathname === section.href && "drop-shadow-[0_0_4px_rgba(212,168,67,0.3)]")} />
                  )}
                  {t(section.labelKey)}
                </Link>
              ) : (
                <>
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-2 mb-1.5 mt-2">
                    {section.icon && (
                      <section.icon className={cn("w-3.5 h-3.5 shrink-0", section.dimmed ? "text-text-muted" : "text-text-secondary")} />
                    )}
                    <p className={cn(
                      "text-[0.7rem] font-bold uppercase tracking-[0.15em]",
                      section.dimmed ? "text-text-muted" : "text-text-secondary italic"
                    )}>
                      {t(section.labelKey)}
                    </p>
                    {section.badge && (
                      <span className={cn(
                        "text-[0.55rem] font-bold uppercase tracking-wider leading-none",
                        section.dimmed
                          ? "rounded-full bg-accent/[0.08] text-accent/60 px-2.5 py-1 border border-accent/[0.12]"
                          : "text-text-muted/40 bg-text-muted/[0.05] border border-text-muted/[0.06] rounded-full px-2 py-0.5",
                        section.badgeRight && "ml-auto"
                      )}>
                        {t(section.badge)}
                      </span>
                    )}
                  </div>

                  {/* Section items — indented relative to heading, right padding to match */}
                  <div className="space-y-0.5 pl-6 pr-6">
                    {section.items.map((item) => {
                      const isActive = !item.disabled && (pathname === item.href || pathname.startsWith(item.href + "/"));
                      const Icon = item.icon;

                      /* Dimmed / disabled items */
                      if (item.disabled || section.dimmed) {
                        return (
                          <div
                            key={item.labelKey}
                            className="flex items-center gap-2.5 px-3 py-1.5 text-[0.7rem] font-medium text-text-muted cursor-not-allowed select-none"
                          >
                            {t(item.labelKey)}
                            <Lock className="w-2.5 h-2.5 ml-auto text-text-muted" />
                          </div>
                        );
                      }

                      /* Compact items (admin/super-admin) — no icons, smaller */
                      if (section.compact) {
                        return (
                          <Link
                            key={item.href + item.labelKey}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-all duration-150",
                              isActive
                                ? "text-accent"
                                : "text-text-secondary/80 hover:text-accent hover:bg-white/[0.04]"
                            )}
                          >
                            {t(item.labelKey)}
                          </Link>
                        );
                      }

                      /* Normal items */
                      return (
                        <Link
                          key={item.href + item.labelKey}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[0.92rem] leading-[1.3rem] transition-all duration-150",
                            isActive
                              ? "bg-accent/[0.10] text-accent font-semibold shadow-[inset_0_0_0_1px_rgba(212,168,67,0.12)]"
                              : "text-text-primary/[0.92] hover:text-accent hover:bg-white/[0.04]"
                          )}
                        >
                          <Icon className={cn("w-[17px] h-[17px] shrink-0", isActive && "drop-shadow-[0_0_4px_rgba(212,168,67,0.3)]")} />
                          {t(item.labelKey)}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {section.separatorAfter && (
                <div className="border-t border-border-strong mt-8 mb-8" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User section — pinned bottom */}
      <div className="shrink-0 p-3">
        <div className="rounded-lg bg-white/[0.02] border border-border p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center ring-1 ring-white/[0.06]">
              <span className="text-xs font-semibold text-text-secondary">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.displayName}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-danger/80 hover:text-danger hover:bg-danger/[0.06] border border-danger/[0.06] hover:border-danger/10 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t("logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}
