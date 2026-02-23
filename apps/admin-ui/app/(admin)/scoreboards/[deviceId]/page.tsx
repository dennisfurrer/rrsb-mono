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

  if (loading) return <div className="text-muted-foreground">{t("loading")}</div>;
  if (!scoreboard) return <div>{t("scoreboards.detail.notFound")}</div>;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t("scoreboards.detail.title")}</h1>
        <Badge variant={scoreboard.online ? "default" : "secondary"}>
          {scoreboard.online ? t("online") : t("offline")}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("scoreboards.deviceId")}</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-xs">{scoreboard.deviceId}</code>
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
          <select
            id="namesList"
            value={selectedList}
            onChange={(e) => setSelectedList(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">{t("none")}</option>
            {namesLists.map((nl) => (
              <option key={nl.id} value={nl.id}>
                {nl.name} ({nl._count?.entries ?? 0} {t("scoreboards.detail.entries")})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
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
