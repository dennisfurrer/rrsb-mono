"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createMatchAssignment, getScoreboards, getNamesLists, getNamesList } from "@/lib/api";
import type { ScoreboardConfig, NamesListEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MatchSetupPage() {
  const [scoreboards, setScoreboards] = useState<ScoreboardConfig[]>([]);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [bestOf, setBestOf] = useState(7);
  const [handicap, setHandicap] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [players, setPlayers] = useState<NamesListEntry[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    getScoreboards()
      .then((res) => setScoreboards(res.data))
      .catch(() => {});

    getNamesLists()
      .then(async (res) => {
        if (res.data.length > 0) {
          const detail = await getNamesList(res.data[0].id);
          if (detail.data.entries) {
            setPlayers(detail.data.entries);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1 || !player2) return;
    setSaving(true);
    setSuccess(false);
    try {
      await createMatchAssignment({
        player1Name: player1,
        player2Name: player2,
        bestOf,
        handicap: handicap ? Number(handicap) : undefined,
        deviceId: selectedDevice || undefined,
        tableNumber: tableNumber ? Number(tableNumber) : undefined,
      });
      setSuccess(true);
      setPlayer1("");
      setPlayer2("");
      setHandicap("");
      setSelectedDevice("");
      setTableNumber("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">{t("matchSetup.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("matchSetup.createAssignment")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("matchSetup.player1")}</Label>
              {players.length > 0 ? (
                <select
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                  <option value="">{t("matchSetup.selectPlayer")}</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.playerName}>
                      {p.playerName}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("matchSetup.player2")}</Label>
              {players.length > 0 ? (
                <select
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                  <option value="">{t("matchSetup.selectPlayer")}</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.playerName}>
                      {p.playerName}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("matchSetup.bestOf")}</Label>
              <Input
                type="number"
                min={1}
                value={bestOf}
                onChange={(e) => setBestOf(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("matchSetup.handicap")}</Label>
              <Input
                type="number"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("matchSetup.targetScoreboard")}</Label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">{t("matchSetup.anyAvailable")}</option>
                {scoreboards.map((sb) => (
                  <option key={sb.deviceId} value={sb.deviceId}>
                    {sb.tableNumber ? `Table ${sb.tableNumber}` : sb.deviceId.slice(0, 8)} ({sb.online ? t("online") : t("offline")})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{t("matchSetup.tableNumber")}</Label>
              <Input
                type="number"
                min={1}
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>

            {success && (
              <div className="text-sm text-green-600">
                {t("matchSetup.success")}
              </div>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? t("creating") : t("matchSetup.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
