"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createMatchAssignment, getScoreboards, getNamesLists, getNamesList } from "@/lib/api";
import type { ScoreboardConfig, NamesListEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Check, AlertTriangle } from "lucide-react";

interface MatchSetupFormProps {
  onCreated?: () => void;
}

export function MatchSetupForm({ onCreated }: MatchSetupFormProps) {
  const [scoreboards, setScoreboards] = useState<ScoreboardConfig[]>([]);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [bestOf, setBestOf] = useState(7);
  const [handicapAmount, setHandicapAmount] = useState("");
  const [handicapPlayer, setHandicapPlayer] = useState<"player1" | "player2">("player1");
  const [selectedDevice, setSelectedDevice] = useState("");
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

  const selectedScoreboard = scoreboards.find((sb) => sb.deviceId === selectedDevice) ?? null;
  const scoreboardMissingTable = selectedScoreboard !== null && selectedScoreboard.tableNumber === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1 || !player2) return;
    setSaving(true);
    setSuccess(false);

    let handicapValue: number | undefined;
    if (handicapAmount && Number(handicapAmount) > 0) {
      handicapValue = handicapPlayer === "player1"
        ? Number(handicapAmount)
        : -Number(handicapAmount);
    }

    try {
      await createMatchAssignment({
        player1Name: player1,
        player2Name: player2,
        bestOf,
        handicap: handicapValue,
        deviceId: selectedDevice || undefined,
        tableNumber: selectedScoreboard?.tableNumber ?? undefined,
      });
      setSuccess(true);
      setPlayer1("");
      setPlayer2("");
      setHandicapAmount("");
      setHandicapPlayer("player1");
      setSelectedDevice("");
      onCreated?.();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const selectClasses = "flex h-10 w-full rounded-lg bg-white/[0.02] border border-border px-3.5 pr-8 text-sm text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent/20 transition-all duration-150";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>{t("matchSetup.player1")}</Label>
        {players.length > 0 ? (
          <div className="relative">
            <select
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              className={selectClasses}
              required
            >
              <option value="">{t("matchSetup.selectPlayer")}</option>
              {players.map((p) => (
                <option key={p.id} value={p.playerName}>
                  {p.playerName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
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
          <div className="relative">
            <select
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              className={selectClasses}
              required
            >
              <option value="">{t("matchSetup.selectPlayer")}</option>
              {players.map((p) => (
                <option key={p.id} value={p.playerName}>
                  {p.playerName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
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

      {/* Handicap — amount + player dropdown */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <Label className="shrink-0">{t("matchSetup.handicap")}</Label>
          {handicapAmount && Number(handicapAmount) > 0 && (
            <span className="text-xs text-text-muted">
              <span className="text-accent font-semibold">{t("matchSetup.handicapGivenTo")}</span>{" "}
              {handicapPlayer === "player1" ? (player1 || t("matchSetup.player1")) : (player2 || t("matchSetup.player2"))}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            value={handicapAmount}
            onChange={(e) => setHandicapAmount(e.target.value)}
            placeholder="0"
          />
          <div className="relative">
            <select
              value={handicapPlayer}
              onChange={(e) => setHandicapPlayer(e.target.value as "player1" | "player2")}
              className={selectClasses}
              disabled={!handicapAmount || Number(handicapAmount) === 0}
            >
              <option value="player1">{player1 || t("matchSetup.player1")}</option>
              <option value="player2">{player2 || t("matchSetup.player2")}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Target Scoreboard + Table Number */}
      <div className="space-y-2">
        <Label>{t("matchSetup.targetScoreboard")}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className={selectClasses}
            >
              <option value="">{t("matchSetup.anyAvailable")}</option>
              {scoreboards.map((sb) => (
                <option key={sb.deviceId} value={sb.deviceId}>
                  {sb.tableNumber ? `Table ${sb.tableNumber}` : sb.deviceId.slice(0, 8)} ({sb.online ? t("online") : t("offline")})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
          <div className="flex items-center justify-center h-10 px-3.5 rounded-lg bg-white/[0.02] border border-border text-sm font-mono min-w-[4.5rem] text-center shrink-0">
            {selectedScoreboard?.tableNumber ? (
              <span className="text-text-primary">T{selectedScoreboard.tableNumber}</span>
            ) : (
              <span className="text-text-muted/50">—</span>
            )}
          </div>
        </div>
        {scoreboardMissingTable && (
          <div className="flex items-start gap-2 text-warning">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm">{t("matchSetup.scoreboardNoTable")}</p>
          </div>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 text-sm text-success">
          <Check className="w-4 h-4" />
          {t("matchSetup.success")}
        </div>
      )}

      <Button variant="brand" type="submit" disabled={saving}>
        {saving ? t("creating") : t("matchSetup.submit")}
      </Button>
    </form>
  );
}
