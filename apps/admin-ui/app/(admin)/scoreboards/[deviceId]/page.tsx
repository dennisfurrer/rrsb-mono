"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getScoreboards, getNamesLists, updateScoreboard, deleteScoreboard } from "@/lib/api";
import type { ScoreboardConfig, NamesList } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

export default function ScoreboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const deviceId = params.deviceId as string;

  const [scoreboard, setScoreboard] = useState<ScoreboardConfig | null>(null);
  const [namesLists, setNamesLists] = useState<NamesList[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getScoreboards(), getNamesLists()])
      .then(([sbRes, nlRes]) => {
        const sb = sbRes.data.find((s) => s.deviceId === deviceId);
        setScoreboard(sb || null);
        setTableNumber(sb?.tableNumber?.toString() || "");
        setSelectedList(sb?.namesListId || "");
        setNamesLists(nlRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deviceId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateScoreboard(deviceId, {
        tableNumber: tableNumber ? Number(tableNumber) : undefined,
        namesListId: selectedList || null,
      });
      router.push("/scoreboards");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("scoreboards.detail.confirmDelete"))) return;
    try {
      await deleteScoreboard(deviceId);
      router.push("/scoreboards");
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted">
        <span className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        {t("loading")}
      </div>
    );
  }
  if (!scoreboard) return <div className="text-text-muted">{t("scoreboards.detail.notFound")}</div>;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-text-primary tracking-tight">
          {t("scoreboards.detail.title")}
        </h1>
        <Badge variant={scoreboard.online ? "success" : "default"}>
          {scoreboard.online ? t("online") : t("offline")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            {t("scoreboards.deviceId")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-xs font-mono text-text-secondary">{scoreboard.deviceId}</code>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tableNumber">{t("scoreboards.detail.tableNumber")}</Label>
          <Input
            id="tableNumber"
            type="number"
            min={1}
            max={99}
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="namesList">{t("scoreboards.namesList")}</Label>
          <div className="relative">
            <select
              id="namesList"
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              className="flex h-9 w-full rounded-lg bg-white/[0.02] border border-border px-3 pr-8 text-sm text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-brand/20 focus:border-brand/20 transition-all duration-150"
            >
              <option value="">{t("none")}</option>
              {namesLists.map((nl) => (
                <option key={nl.id} value={nl.id}>
                  {nl.name} ({nl._count?.entries ?? 0} {t("scoreboards.detail.entries")})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="brand" onClick={handleSave} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
          <Button variant="outline" onClick={() => router.push("/scoreboards")}>
            {t("cancel")}
          </Button>
          {user?.role === "SUPER_ADMIN" && (
            <Button variant="destructive" onClick={handleDelete}>
              {t("delete")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
