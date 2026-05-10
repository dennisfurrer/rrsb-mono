export type SoloRoutineId =
  | "lineup"
  | "tline"
  | "longred"
  | "blackspot";

export interface SoloRoutine {
  id: SoloRoutineId;
  name: string;
  description: string;
}

export const SOLO_ROUTINES: SoloRoutine[] = [
  {
    id: "lineup",
    name: "Aufstellung",
    description: "15 Rote in einer Linie, mit Farben",
  },
  {
    id: "tline",
    name: "T-Linie",
    description: "Rote in T-Form von den Spots",
  },
  {
    id: "longred",
    name: "Lange Rote",
    description: "Eine Rote vom Baulk-Ende lochen",
  },
  {
    id: "blackspot",
    name: "Schwarze auf Spot",
    description: "Schwarze wiederholt vom Spot lochen",
  },
];

export type SoloShot = "hit" | "miss";

export interface SoloSessionState {
  sessionId: string;
  playerName: string;
  routineId: SoloRoutineId;
  startedAt: number;
  shots: SoloShot[];
  finished: boolean;
}

export function createSoloSession(
  playerName: string,
  routineId: SoloRoutineId
): SoloSessionState {
  return {
    sessionId: crypto.randomUUID(),
    playerName,
    routineId,
    startedAt: Date.now(),
    shots: [],
    finished: false,
  };
}

export interface SoloStats {
  total: number;
  hits: number;
  misses: number;
  hitRate: number; // 0..1
  currentStreak: number;
  bestStreak: number;
}

export function computeSoloStats(shots: SoloShot[]): SoloStats {
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

export function routineById(id: SoloRoutineId): SoloRoutine {
  const found = SOLO_ROUTINES.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown routine: ${id}`);
  return found;
}
