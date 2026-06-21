import type { V3BallType } from "./apiV3";

export interface BallMeta {
  label: string;
  value: number;
  hex: string;
  ring?: string;
  fg: string;
}

/** Display metadata for each ball, tuned for a dark surface. */
export const BALL_META: Record<V3BallType, BallMeta> = {
  RED: { label: "Red", value: 1, hex: "#e23b3b", fg: "#fff" },
  YELLOW: { label: "Yellow", value: 2, hex: "#f2cf24", fg: "#1a1606" },
  GREEN: { label: "Green", value: 3, hex: "#2bb24a", fg: "#04210d" },
  BROWN: { label: "Brown", value: 4, hex: "#a05a2c", fg: "#fff" },
  BLUE: { label: "Blue", value: 5, hex: "#2f6bff", fg: "#fff" },
  PINK: { label: "Pink", value: 6, hex: "#ff5fa2", fg: "#36041a" },
  BLACK: { label: "Black", value: 7, hex: "#262626", ring: "rgba(255,255,255,0.45)", fg: "#fff" },
  FREE_BALL: { label: "Free ball", value: 0, hex: "transparent", fg: "#fff" },
};

export const FREE_BALL_GRADIENT =
  "conic-gradient(from 140deg, #f2cf24, #2bb24a, #a05a2c, #2f6bff, #ff5fa2, #262626, #e23b3b, #f2cf24)";

const MATCH_TYPE_LABELS: Record<string, string> = {
  SIX_REDS: "6-Reds",
  LIGA_A: "Liga A",
  LIGA_BC: "Liga B/C",
  OPEN_TURNIER: "Open Turnier",
  QT: "QT",
  SONSTIGES_TURNIER: "Turnier",
  SWISS_SNOOKER_CUP: "Swiss Snooker Cup",
  TRAININGS_SPIEL: "Training",
  WOCHENTURNIER: "Wochenturnier",
  OTHER: "Match",
};

export function matchTypeLabel(code: string, raw?: string): string {
  return MATCH_TYPE_LABELS[code] ?? raw ?? code;
}

const EVENT_LABELS: Record<string, string> = {
  POT: "Pot",
  MANUAL_BREAK: "Break",
  FOUL: "Foul",
  MISS: "Miss",
  HANDICAP: "Handicap",
  CORRECT_REDS: "Reds corrected",
  SWITCH_PLAYER: "Player switch",
  RERACK: "Re-rack",
  RESPOTTED_BLACK: "Re-spotted black",
  FRAME_END: "Frame end",
  MATCH_END: "Match end",
  UNDO: "Undo",
  REDO: "Redo",
  EDIT_LAST_BREAK: "Edit break",
};

export function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type;
}

/** Break tier bucket for colour-coding badges. */
export function breakTier(v: number): "low" | "mid" | "high" | "elite" | "century" {
  if (v >= 100) return "century";
  if (v >= 70) return "elite";
  if (v >= 50) return "high";
  if (v >= 20) return "mid";
  return "low";
}

export function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function durationBetween(a: string | null, b: string | null): string {
  if (!a || !b) return "—";
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (ms < 0) return "—";
  const tot = Math.floor(ms / 1000);
  const h = Math.floor(tot / 3600);
  const m = Math.floor((tot % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = tot % 60;
  return `${m}m ${s}s`;
}
