"use client";

import { useTranslation } from "react-i18next";
import { Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Match, MatchAssignment } from "@/lib/types";

type MatchStatus = "active" | "paused" | "ended" | "none";

function getMatchStatus(match: Match | undefined): MatchStatus {
  if (!match) return "none";
  if (match.winner) return "ended";
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  const updatedAt = new Date(match.updatedAt);
  if (updatedAt < oneHourAgo) return "paused";
  return "active";
}

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

const STATUS_DOT: Record<MatchStatus, string> = {
  active: "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse",
  paused: "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]",
  ended: "bg-text-muted opacity-60",
  none: "",
};

const STATUS_LABEL_KEY: Record<MatchStatus, string> = {
  active: "tables.live",
  paused: "tables.matchPaused",
  ended: "tables.matchEnded",
  none: "",
};

interface TableCardProps {
  tableNumber: number;
  match?: Match;
  assignment?: MatchAssignment;
  onExpand?: (match: Match) => void;
}

export function TableCard({ tableNumber, match, assignment, onExpand }: TableCardProps) {
  const { t } = useTranslation();
  const status = getMatchStatus(match);
  const hasLiveMatch = status === "active" || status === "paused" || status === "ended";
  const hasPendingAssignment = !hasLiveMatch && assignment && (assignment.status === "PENDING" || assignment.status === "CLAIMED");

  return (
    <div
      className={`
        card-premium rounded-xl overflow-hidden transition-all duration-300 relative
        ${hasLiveMatch ? "hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]" : ""}
        ${!hasLiveMatch && !hasPendingAssignment ? "opacity-30" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-text-primary">
            {t("tables.table", { n: tableNumber })}
          </span>
          {status !== "none" && (
            <>
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
              <span className="text-[0.65rem] font-medium text-text-muted uppercase tracking-wider">
                {t(STATUS_LABEL_KEY[status])}
              </span>
            </>
          )}
        </div>
        {hasLiveMatch && match && (
          <button
            onClick={() => onExpand?.(match)}
            className="p-1 rounded-md text-text-muted hover:text-accent hover:bg-white/[0.04] transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* No match state */}
      {!hasLiveMatch && !hasPendingAssignment && (
        <div className="px-4 pb-6 pt-2 text-center">
          <span className="text-xs text-text-muted">{t("tables.noMatch")}</span>
        </div>
      )}

      {/* Pending assignment */}
      {hasPendingAssignment && assignment && (
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-surface-2 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-primary font-medium truncate">{assignment.player1Name}</span>
              <span className="text-text-muted text-xs mx-2">vs</span>
              <span className="text-text-primary font-medium truncate">{assignment.player2Name}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-text-muted font-mono">Bo{assignment.bestOf}</span>
              <Badge variant={assignment.status === "CLAIMED" ? "success" : "info"}>
                {t(`tables.${assignment.status === "CLAIMED" ? "live" : "pending"}`)}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Live scoreboard */}
      {hasLiveMatch && match && (
        <MiniScoreboard match={match} />
      )}
    </div>
  );
}

function MiniScoreboard({ match }: { match: Match }) {
  const { t } = useTranslation();
  const { score1, score2 } = parseScore(match.rawGameLog);

  return (
    <div className="bg-black/40">
      {/* Player names */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-sm font-medium text-text-primary truncate flex-1 text-left">
          {match.player1Name}
        </span>
        <span className="text-sm font-medium text-text-primary truncate flex-1 text-right">
          {match.player2Name}
        </span>
      </div>

      {/* Frames bar */}
      <div className="mx-auto w-[55%] rounded-lg bg-accent/90 px-3 py-1.5 text-center">
        <div className="text-[0.6rem] font-bold text-surface-0 uppercase tracking-wider mb-0.5">
          {t("tables.frames")}
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-xl font-bold text-surface-0 font-mono">{match.framesPlayer1}</span>
          <span className="text-sm text-surface-0/70 font-mono">{match.bestOf}</span>
          <span className="text-xl font-bold text-surface-0 font-mono">{match.framesPlayer2}</span>
        </div>
      </div>

      {/* Score */}
      <div className="mx-4 my-2 rounded-lg bg-white/[0.06] px-4 py-2 flex items-center justify-between relative">
        <span className="text-2xl font-bold text-text-primary font-mono">{score1}</span>
        <span className="text-[0.6rem] font-bold text-text-muted uppercase tracking-wider absolute left-1/2 -translate-x-1/2">
          {t("tables.score")}
        </span>
        <span className="text-2xl font-bold text-text-primary font-mono">{score2}</span>
      </div>

      {/* Breaks */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-2/50 text-xs">
        <span className="text-info font-mono truncate flex-1 text-left">
          {match.breaksPlayer1.length > 0 ? match.breaksPlayer1.slice(0, 4).join(", ") : "–"}
        </span>
        <span className="text-[0.6rem] font-bold text-text-muted uppercase tracking-wider mx-3 shrink-0">
          {t("tables.breaks")}
        </span>
        <span className="text-info font-mono truncate flex-1 text-right">
          {match.breaksPlayer2.length > 0 ? match.breaksPlayer2.slice(0, 4).join(", ") : "–"}
        </span>
      </div>
    </div>
  );
}
