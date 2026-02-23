"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getScoreboards } from "@/lib/api";
import type { ScoreboardConfig } from "@/lib/types";

export default function DashboardPage() {
  const [scoreboards, setScoreboards] = useState<ScoreboardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    getScoreboards()
      .then((res) => setScoreboards(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onlineCount = scoreboards.filter((s) => s.online).length;
  const totalCount = scoreboards.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
      {loading ? (
        <div className="text-muted-foreground">{t("loading")}</div>
      ) : totalCount === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t("dashboard.noScoreboards")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("dashboard.getStarted")}
            </p>
            <Link href="/scoreboards">
              <Button>{t("scoreboards.onboarding.title")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.onlineScoreboards")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{onlineCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.totalScoreboards")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.offlineScoreboards")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totalCount - onlineCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
