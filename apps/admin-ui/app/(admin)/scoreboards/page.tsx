"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  getScoreboards,
  deleteScoreboard,
  getMatchAssignments,
  deleteMatchAssignment,
} from "@/lib/api";
import type { ScoreboardConfig, MatchAssignment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Power, Trash2 } from "lucide-react";

export default function ScoreboardsPage() {
  const [scoreboards, setScoreboards] = useState<ScoreboardConfig[]>([]);
  const [assignments, setAssignments] = useState<MatchAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const loadData = () => {
    Promise.all([getScoreboards(), getMatchAssignments()])
      .then(([sbRes, maRes]) => {
        setScoreboards(sbRes.data);
        setAssignments(maRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleDisconnect = async (deviceId: string) => {
    if (!confirm(t("scoreboards.detail.confirmDelete"))) return;
    try {
      await deleteScoreboard(deviceId);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm(t("matchSetup.confirmDelete"))) return;
    try {
      await deleteMatchAssignment(id);
      loadData();
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-display font-extrabold text-text-primary tracking-tight">
        {t("scoreboards.title")}
      </h1>

      {scoreboards.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardHeader>
            <CardTitle>{t("scoreboards.onboarding.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-muted">
              {t("scoreboards.onboarding.description")}
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
              <li>{t("scoreboards.onboarding.step1")}</li>
              <li>{t("scoreboards.onboarding.step2")}</li>
              <li>{t("scoreboards.onboarding.step3")}</li>
            </ol>
            <div className="rounded-lg bg-surface-2 p-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                {t("scoreboards.onboarding.url")}
              </p>
              <code className="text-sm font-mono text-brand">
                http://&lt;server-ip&gt;:7201
              </code>
            </div>
            <p className="text-xs text-text-muted">
              {t("scoreboards.onboarding.hint")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("scoreboards.status")}</TableHead>
              <TableHead>{t("scoreboards.deviceId")}</TableHead>
              <TableHead>{t("scoreboards.table")}</TableHead>
              <TableHead>{t("scoreboards.location")}</TableHead>
              <TableHead>{t("scoreboards.namesList")}</TableHead>
              <TableHead>{t("scoreboards.lastPing")}</TableHead>
              <TableHead>{t("scoreboards.disconnect")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scoreboards.map((sb) => (
              <TableRow key={sb.deviceId}>
                <TableCell>
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      sb.online ? "bg-success" : "bg-text-muted"
                    }`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/scoreboards/${sb.deviceId}`}
                    className="text-brand hover:text-brand-dim font-mono text-xs transition-colors"
                  >
                    {sb.deviceId.slice(0, 8)}...
                  </Link>
                </TableCell>
                <TableCell className="text-text-secondary">{sb.tableNumber ?? "-"}</TableCell>
                <TableCell className="text-text-secondary">{sb.location?.name ?? "-"}</TableCell>
                <TableCell className="text-text-secondary">{sb.namesList?.name ?? "-"}</TableCell>
                <TableCell className="text-xs text-text-muted">
                  {sb.lastPingAt
                    ? new Date(sb.lastPingAt).toLocaleString()
                    : t("scoreboards.never")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger h-8 w-8 p-0"
                    title={t("scoreboards.disconnect")}
                    onClick={() => handleDisconnect(sb.deviceId)}
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Match Assignments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-extrabold text-text-primary tracking-tight">
            {t("matchSetup.assignments")}
          </h2>
          <Link href="/match-setup">
            <Button variant="brand" size="sm">{t("matchSetup.createAssignment")}</Button>
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("matchSetup.player1")}</TableHead>
              <TableHead>{t("matchSetup.player2")}</TableHead>
              <TableHead>{t("matchSetup.bestOf")}</TableHead>
              <TableHead>{t("scoreboards.table")}</TableHead>
              <TableHead>{t("scoreboards.status")}</TableHead>
              <TableHead>{t("namesLists.created")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-text-primary">{a.player1Name}</TableCell>
                <TableCell className="text-text-primary">{a.player2Name}</TableCell>
                <TableCell className="font-mono text-text-secondary">{a.bestOf}</TableCell>
                <TableCell className="text-text-secondary">{a.tableNumber ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={
                    a.status === "PENDING" ? "info" :
                    a.status === "CLAIMED" ? "success" :
                    a.status === "CANCELLED" ? "danger" :
                    "default"
                  }>
                    {t(`matchSetup.status.${a.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-text-muted">
                  {new Date(a.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  {(a.status === "PENDING" || a.status === "CANCELLED") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      onClick={() => handleDeleteAssignment(a.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-text-muted py-8">
                  {t("matchSetup.noAssignments")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
