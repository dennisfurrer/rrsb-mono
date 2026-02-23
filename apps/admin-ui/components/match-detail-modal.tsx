"use client";

import { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { Match } from "@/lib/types";

function parseScore(rawGameLog: string): { score1: number; score2: number } {
  try {
    const parsed = JSON.parse(rawGameLog);
    return {
      score1: parsed?.players?.[0]?.score ?? 0,
      score2: parsed?.players?.[1]?.score ?? 0,
    };
  } catch {
    return { score1: 0, score2: 0 };
  }
}

function getStatusInfo(match: Match): { label: string; dotClass: string; labelKey: string } {
  if (match.winner) {
    return { label: "ended", dotClass: "bg-text-muted opacity-60", labelKey: "tables.matchEnded" };
  }
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  if (new Date(match.updatedAt) < oneHourAgo) {
    return { label: "paused", dotClass: "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]", labelKey: "tables.matchPaused" };
  }
  return { label: "active", dotClass: "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse", labelKey: "tables.live" };
}

interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
}

export function MatchDetailModal({ match, onClose }: MatchDetailModalProps) {
  const { t } = useTranslation();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!match) return;
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [match, handleKeyDown]);

  if (!match) return null;

  const { score1, score2 } = parseScore(match.rawGameLog);
  const status = getStatusInfo(match);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Modal content */}
      <div
        className="relative z-10 w-full max-w-2xl bg-surface-1 rounded-2xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-text-primary">
              {t("tables.table", { n: match.tableNumber ?? "–" })}
            </span>
            <span className={`w-2.5 h-2.5 rounded-full ${status.dotClass}`} />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {t(status.labelKey)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoreboard */}
        <div className="bg-black/30 p-6 space-y-4">
          {/* Players */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold text-text-primary truncate flex-1 text-left">
              {match.player1Name}
            </span>
            <span className="text-text-muted text-sm mx-4">vs</span>
            <span className="text-xl font-semibold text-text-primary truncate flex-1 text-right">
              {match.player2Name}
            </span>
          </div>

          {/* Frames bar */}
          <div className="mx-auto w-[50%] rounded-xl bg-accent/90 px-6 py-3 text-center">
            <div className="text-xs font-bold text-surface-0 uppercase tracking-wider mb-1">
              {t("tables.frames")}
            </div>
            <div className="flex items-center justify-between px-4">
              <span className="text-4xl font-bold text-surface-0 font-mono">{match.framesPlayer1}</span>
              <span className="text-lg text-surface-0/70 font-mono">{match.bestOf}</span>
              <span className="text-4xl font-bold text-surface-0 font-mono">{match.framesPlayer2}</span>
            </div>
          </div>

          {/* Score */}
          <div className="rounded-xl bg-white/[0.06] px-8 py-4 flex items-center justify-between relative">
            <span className="text-5xl font-bold text-text-primary font-mono">{score1}</span>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider absolute left-1/2 -translate-x-1/2">
              {t("tables.score")}
            </span>
            <span className="text-5xl font-bold text-text-primary font-mono">{score2}</span>
          </div>

          {/* Breaks */}
          <div className="rounded-xl bg-surface-2/60 px-6 py-3 flex items-center justify-between">
            <div className="flex-1 text-left">
              <div className="flex flex-wrap gap-2">
                {match.breaksPlayer1.length > 0
                  ? match.breaksPlayer1.map((b, i) => (
                      <span key={i} className="text-info font-mono text-sm font-semibold bg-info/[0.08] rounded px-1.5 py-0.5">
                        {b}
                      </span>
                    ))
                  : <span className="text-text-muted text-sm">–</span>
                }
              </div>
            </div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mx-4 shrink-0">
              {t("tables.breaks")}
            </span>
            <div className="flex-1 text-right">
              <div className="flex flex-wrap gap-2 justify-end">
                {match.breaksPlayer2.length > 0
                  ? match.breaksPlayer2.map((b, i) => (
                      <span key={i} className="text-info font-mono text-sm font-semibold bg-info/[0.08] rounded px-1.5 py-0.5">
                        {b}
                      </span>
                    ))
                  : <span className="text-text-muted text-sm">–</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
