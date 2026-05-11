export type SoloRoutineId =
  | "lineup"
  | "tline"
  | "opentable"
  | "blackspot";

export type SoloRoutineMode = "hitmiss" | "break";

export interface SoloRoutine {
  id: SoloRoutineId;
  name: string;
  description: string;
  mode: SoloRoutineMode;
  defaultReds?: number;
}

export const SOLO_ROUTINES: SoloRoutine[] = [
  {
    id: "lineup",
    name: "Line-Up",
    description: "Rote in einer Linie, mit Farben",
    mode: "break",
    defaultReds: 15,
  },
  {
    id: "tline",
    name: "T-Line",
    description: "Rote in T-Form von den Spots",
    mode: "break",
    defaultReds: 15,
  },
  {
    id: "opentable",
    name: "Offener Tisch",
    description: "Beliebige Stellung, freie Wahl",
    mode: "break",
    defaultReds: 15,
  },
  {
    id: "blackspot",
    name: "Schwarze vom Spot",
    description: "Schwarze wiederholt vom Spot lochen",
    mode: "hitmiss",
  },
];

export type SoloShot = "hit" | "miss";

export type BallColor =
  | "red"
  | "yellow"
  | "green"
  | "brown"
  | "blue"
  | "pink"
  | "black";

export type MissType = "long" | "easy" | "difficult" | "position";

export type Pocket = "corner" | "middle";

export const BALL_COLORS: { id: BallColor; label: string; bg: string; fg: string }[] = [
  { id: "red", label: "Rot", bg: "#660000", fg: "#ff5555" },
  { id: "yellow", label: "Gelb", bg: "#5a5a00", fg: "#ffff66" },
  { id: "green", label: "Grün", bg: "#003a00", fg: "#66ff66" },
  { id: "brown", label: "Braun", bg: "#3a1f00", fg: "#cc9966" },
  { id: "blue", label: "Blau", bg: "#000066", fg: "#6699ff" },
  { id: "pink", label: "Pink", bg: "#660033", fg: "#ff99cc" },
  { id: "black", label: "Schwarz", bg: "#1a1a1a", fg: "#cccccc" },
];

export const MISS_TYPES: { id: MissType; label: string }[] = [
  { id: "long", label: "Lange Rote" },
  { id: "easy", label: "Einfache" },
  { id: "difficult", label: "Schwierige" },
  { id: "position", label: "Position" },
];

export const POCKETS: { id: Pocket; label: string }[] = [
  { id: "corner", label: "Ecke" },
  { id: "middle", label: "Mitte" },
];

export type BreakAttempt =
  | {
      kind: "break";
      value: number;
      missType?: MissType;
      ball?: BallColor;
      pocket?: Pocket;
      timestamp: number;
    }
  | {
      kind: "cleared";
      value: number;
      timestamp: number;
    }
  | {
      kind: "missed";
      timestamp: number;
    };

export type SoloSessionState =
  | {
      mode: "hitmiss";
      sessionId: string;
      remoteId: string | null;
      playerName: string;
      routineId: SoloRoutineId;
      startedAt: number;
      finished: boolean;
      shots: SoloShot[];
    }
  | {
      mode: "break";
      sessionId: string;
      remoteId: string | null;
      playerName: string;
      routineId: SoloRoutineId;
      startedAt: number;
      finished: boolean;
      redsCount: number;
      attempts: BreakAttempt[];
    };

export function createSoloSession(
  playerName: string,
  routineId: SoloRoutineId,
  redsCount?: number
): SoloSessionState {
  const routine = routineById(routineId);
  const base = {
    sessionId: crypto.randomUUID(),
    remoteId: null as string | null,
    playerName,
    routineId,
    startedAt: Date.now(),
    finished: false,
  };
  if (routine.mode === "hitmiss") {
    return { ...base, mode: "hitmiss", shots: [] };
  }
  return {
    ...base,
    mode: "break",
    redsCount: redsCount ?? routine.defaultReds ?? 15,
    attempts: [],
  };
}

// Map a domain BreakAttempt to the API payload shape (uppercase enums)
export function breakAttemptToApi(a: BreakAttempt): {
  kind: "BREAK" | "CLEARED" | "MISSED";
  value?: number;
  missType?: "LONG" | "EASY" | "DIFFICULT" | "POSITION";
  ball?: "RED" | "YELLOW" | "GREEN" | "BROWN" | "BLUE" | "PINK" | "BLACK";
  pocket?: "CORNER" | "MIDDLE";
} {
  if (a.kind === "cleared") {
    return { kind: "CLEARED", value: a.value };
  }
  if (a.kind === "missed") {
    return { kind: "MISSED" };
  }
  return {
    kind: "BREAK",
    value: a.value,
    missType: a.missType
      ? (a.missType.toUpperCase() as "LONG" | "EASY" | "DIFFICULT" | "POSITION")
      : undefined,
    ball: a.ball
      ? (a.ball.toUpperCase() as
          | "RED"
          | "YELLOW"
          | "GREEN"
          | "BROWN"
          | "BLUE"
          | "PINK"
          | "BLACK")
      : undefined,
    pocket: a.pocket
      ? (a.pocket.toUpperCase() as "CORNER" | "MIDDLE")
      : undefined,
  };
}

/** Max possible points for a line-up clearance with N reds (all blacks). */
export function maxClearanceValue(redsCount: number): number {
  // N reds × 1 + N colors × 7 + final color clearance (27)
  return redsCount * 1 + redsCount * 7 + 27;
}

export interface HitMissStats {
  total: number;
  hits: number;
  misses: number;
  hitRate: number;
  currentStreak: number;
  bestStreak: number;
}

export function computeHitMissStats(shots: SoloShot[]): HitMissStats {
  let hits = 0;
  let misses = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  for (const s of shots) {
    if (s === "hit") {
      hits += 1;
      currentStreak += 1;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      misses += 1;
      currentStreak = 0;
    }
  }
  const total = hits + misses;
  return {
    total,
    hits,
    misses,
    hitRate: total === 0 ? 0 : hits / total,
    currentStreak,
    bestStreak,
  };
}

export interface BreakStats {
  totalAttempts: number;
  highestBreak: number;
  averageBreak: number;
  clearedCount: number;
  missedCount: number;
}

export function attemptValue(a: BreakAttempt): number {
  return a.kind === "missed" ? 0 : a.value;
}

export function computeBreakStats(attempts: BreakAttempt[]): BreakStats {
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      highestBreak: 0,
      averageBreak: 0,
      clearedCount: 0,
      missedCount: 0,
    };
  }
  let highest = 0;
  let sum = 0;
  let cleared = 0;
  let missed = 0;
  for (const a of attempts) {
    const v = attemptValue(a);
    sum += v;
    if (v > highest) highest = v;
    if (a.kind === "cleared") cleared += 1;
    if (a.kind === "missed") missed += 1;
  }
  return {
    totalAttempts: attempts.length,
    highestBreak: highest,
    averageBreak: sum / attempts.length,
    clearedCount: cleared,
    missedCount: missed,
  };
}

export function routineById(id: SoloRoutineId): SoloRoutine {
  const found = SOLO_ROUTINES.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown routine: ${id}`);
  return found;
}
