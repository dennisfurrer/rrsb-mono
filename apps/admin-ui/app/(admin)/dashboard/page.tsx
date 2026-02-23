"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchSetupForm } from "@/components/match-setup-form";
import { getScoreboards, getMatchAssignments } from "@/lib/api";
import type { ScoreboardConfig, MatchAssignment } from "@/lib/types";
import { Monitor, Swords, ArrowRight, Wifi, WifiOff, Circle, Eye } from "lucide-react";
import { Walkthrough } from "@/components/walkthrough";

export default function DashboardPage() {
  const [scoreboards, setScoreboards] = useState<ScoreboardConfig[]>([]);
  const [assignments, setAssignments] = useState<MatchAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const loadData = useCallback(() => {
    Promise.all([getScoreboards(), getMatchAssignments()])
      .then(([sbRes, maRes]) => {
        setScoreboards(sbRes.data);
        setAssignments(maRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadData, [loadData]);

  const onlineCount = scoreboards.filter((s) => s.online).length;
  const totalCount = scoreboards.length;
  // "In use" = scoreboards that have a CLAIMED assignment
  const claimedDeviceIds = new Set(
    assignments.filter((a) => a.status === "CLAIMED" && a.deviceId).map((a) => a.deviceId)
  );
  const inUseCount = scoreboards.filter((s) => claimedDeviceIds.has(s.deviceId)).length;
  const availableCount = onlineCount - inUseCount;

  // Newest 5 assignments
  const recentAssignments = [...assignments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted">
        <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10">
      <Walkthrough />

      <h1 className="text-2xl md:text-3xl font-display font-extrabold text-text-primary tracking-tight">
        {t("dashboard.title")}
      </h1>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
        {/* ── Left Column: Scoreboards ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-4 h-4 md:w-5 md:h-5 text-text-muted" />
              <h2 className="text-xs md:text-base font-semibold text-text-primary uppercase tracking-wider">
                {t("dashboard.scoreboardsSection")}
              </h2>
            </div>
            <Link href="/scoreboards">
              <Button variant="ghost" size="sm" className="gap-1.5 text-text-muted">
                {t("dashboard.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Scoreboard stats */}
          <div className="grid grid-cols-3 gap-2.5 md:gap-4" data-walkthrough="stats-grid">
            <Card>
              <CardContent className="p-3 md:p-5">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <span className="text-[0.6rem] md:text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {t("online")}
                  </span>
                  <Wifi className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
                </div>
                <span className="text-xl md:text-3xl font-mono font-bold text-text-primary">{onlineCount}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-5">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <span className="text-[0.6rem] md:text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {t("dashboard.inUse")}
                  </span>
                  <Circle className="w-3.5 h-3.5 md:w-4 md:h-4 text-warning fill-warning/20" />
                </div>
                <span className="text-xl md:text-3xl font-mono font-bold text-text-primary">{inUseCount}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-5">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <span className="text-[0.6rem] md:text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {t("dashboard.available")}
                  </span>
                  <WifiOff className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-muted" />
                </div>
                <span className="text-xl md:text-3xl font-mono font-bold text-text-primary">
                  {availableCount < 0 ? 0 : availableCount}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Recent Assignments */}
          <Card data-walkthrough="recent-assignments">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs md:text-sm font-semibold text-text-muted uppercase tracking-wider">
                  {t("dashboard.recentAssignments")}
                </CardTitle>
                <Link href="/scoreboards" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                  {t("dashboard.viewAll")}
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentAssignments.length === 0 ? (
                <p className="text-sm text-text-muted py-6 text-center">
                  {t("dashboard.noRecentAssignments")}
                </p>
              ) : (
                <div className="space-y-0">
                  {recentAssignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-text-primary font-medium truncate">{a.player1Name}</span>
                          <span className="text-text-muted text-xs">vs</span>
                          <span className="text-text-primary font-medium truncate">{a.player2Name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-muted font-mono">
                            Bo{a.bestOf}
                          </span>
                          {a.tableNumber && (
                            <span className="text-xs text-text-muted font-mono">
                              T{a.tableNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="gap-1 md:gap-1.5 text-text-muted shrink-0 text-[0.65rem] md:text-xs"
                      >
                        <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="hidden sm:inline">{t("matchSetup.seeScore")}</span>
                      </Button>
                      <Badge variant={
                        a.status === "PENDING" ? "info" :
                        a.status === "CLAIMED" ? "success" :
                        a.status === "CANCELLED" ? "danger" :
                        "default"
                      }>
                        {t(`matchSetup.status.${a.status}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Assign Match ── */}
        <div className="space-y-5" data-walkthrough="match-setup">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Swords className="w-4 h-4 md:w-5 md:h-5 text-text-muted" />
              <h2 className="text-xs md:text-base font-semibold text-text-primary uppercase tracking-wider">
                {t("dashboard.matchSetupSection")}
              </h2>
            </div>
            <Link href="/match-setup">
              <Button variant="ghost" size="sm" className="gap-1.5 text-text-muted">
                {t("dashboard.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-6">
              <MatchSetupForm onCreated={loadData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
