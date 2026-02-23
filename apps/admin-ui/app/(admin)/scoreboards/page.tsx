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

  if (loading) return <div className="text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t("scoreboards.title")}</h1>

      {scoreboards.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t("scoreboards.onboarding.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("scoreboards.onboarding.description")}
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>{t("scoreboards.onboarding.step1")}</li>
              <li>{t("scoreboards.onboarding.step2")}</li>
              <li>{t("scoreboards.onboarding.step3")}</li>
            </ol>
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t("scoreboards.onboarding.url")}
              </p>
              <code className="text-sm font-mono">
                http://&lt;server-ip&gt;:7201
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
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
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scoreboards.map((sb) => (
              <TableRow key={sb.deviceId}>
                <TableCell>
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      sb.online ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/scoreboards/${sb.deviceId}`}
                    className="text-primary hover:underline font-mono text-xs"
                  >
                    {sb.deviceId.slice(0, 8)}...
                  </Link>
                </TableCell>
                <TableCell>{sb.tableNumber ?? "-"}</TableCell>
                <TableCell>{sb.location?.name ?? "-"}</TableCell>
                <TableCell>{sb.namesList?.name ?? "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {sb.lastPingAt
                    ? new Date(sb.lastPingAt).toLocaleString()
                    : t("scoreboards.never")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8 w-8 p-0"
                    title={t("scoreboards.disconnect")}
                    onClick={() => handleDisconnect(sb.deviceId)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                      <line x1="12" y1="2" x2="12" y2="12" />
                    </svg>
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
          <h2 className="text-xl font-bold">{t("matchSetup.assignments")}</h2>
          <Link href="/match-setup">
            <Button size="sm">{t("matchSetup.createAssignment")}</Button>
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
                <TableCell>{a.player1Name}</TableCell>
                <TableCell>{a.player2Name}</TableCell>
                <TableCell>{a.bestOf}</TableCell>
                <TableCell>{a.tableNumber ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={
                    a.status === "PENDING" ? "default" :
                    a.status === "CLAIMED" ? "secondary" :
                    a.status === "CANCELLED" ? "destructive" :
                    "outline"
                  }>
                    {t(`matchSetup.status.${a.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  {(a.status === "PENDING" || a.status === "CANCELLED") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteAssignment(a.id)}
                    >
                      {t("delete")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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
