export type SoloRoutineId =
  | "lineup"
  | "tline"
  | "opentable"
  | "ball1521"
  | "farben-endlos"
  | "zigzak"
  | "spot-yellow"
  | "spot-green"
  | "spot-brown"
  | "spot-blue"
  | "spot-pink"
  | "spot-black";

export type SoloRoutineMode = "hitmiss" | "break";

export interface SoloRoutine {
  id: SoloRoutineId;
  name: string;
  description: string;
  mode: SoloRoutineMode;
  defaultReds?: number;
  minReds?: number;
  seriesMode?: boolean;
  explanation?: string;
}

export const SOLO_ROUTINES: SoloRoutine[] = [
  {
    id: "lineup",
    name: "Line-Up",
    description: "Alle Roten auf Mittelachse, plus Farben auf Spots. Break spielen!",
    mode: "break",
    defaultReds: 15,
    explanation: "Spielart: Es werden alle Kugeln verwendet. Weiss darf frei gesetzt werden. Es wird immer abwechselnd Rot–Farbe–Rot–Farbe gespielt, wobei die Farbigen wieder aufgesetzt werden. Gespielt wird bis ein angespielter Ball nicht mehr fällt.\n\nAufsetzart:\n• Alle Farbigen auf ihre Aufsetzmarken\n• 2 Rote neben Blau\n• 7 Rote zwischen Blau und Pink\n• 5 Rote zwischen Pink und Schwarz\n• 1 Rote neben Schwarz\n• Weiss darf frei irgendwo auf dem ganzen Tisch gesetzt werden\n\nTrainingseffekt: Bilden eines Breaks. Kontrolle über Weiss.\n\nZiel: Ein so hohes Break wie möglich zu erreichen.",
  },
  {
    id: "tline",
    name: "T-Line",
    description: "Rote in T-Form höhe pink seitlich und zu schwarz, Farben auf Spots",
    mode: "break",
    defaultReds: 15,
  },
  {
    id: "opentable",
    name: "Offener Tisch",
    description: "Beliebige Stellung der Roten, Farben auf Spots. Weiss frei setzen. Break spielen!",
    mode: "break",
    defaultReds: 15,
  },
  {
    id: "ball1521",
    name: "15/21-Ball",
    description: "15 oder 21 Bälle nach Plan aufsetzen. Nur Bälle lochen. Jeder Stoss zählt!",
    mode: "break",
  },
  {
    id: "farben-endlos",
    name: "Farben endlos",
    description: "Farben auf Spots von gelb bis schwarz abräumen und von schwarz wieder auf gelb stellen und weiter abräumen.",
    mode: "break",
  },
  {
    id: "zigzak",
    name: "Zig-Zak",
    description: "Farben auf Spots. Je 5 Rote zwischen schwarz-pink im Zig-Zak. Ev. weitere 5 zw. pink-blau und blau-braun. Breaken!",
    mode: "break",
    defaultReds: 5,
    minReds: 5,
    explanation: "Spielart: Es werden 5, 10 oder 15 Rote plus alle Farben verwendet. Abwechselnd Rot–Farbe spielen. Farbige werden wieder aufgesetzt. Spielen bis ein angespielter Ball nicht mehr fällt.\n\nAufsetzart:\n• Farben auf ihre Aufsetzmarken\n• Rote Bälle im Zig-Zak versetzt zwischen Schwarz, Pink, Blau und Braun, je nach Anzahl verwendeter Bälle, wobei je ein 5er Pack versetzt zusammen zwischen zwei Farben aufgelegt werden muss. Die Versetzbreite sollte ca. 1 Kugeldurchmesser ab der Mittelachse sein.\n• Weiss darf auf ganzem Tisch gesetzt werden\n\nTrainingseffekt: Gutes Stellen von Weiss auf jeweils nächsten roten Ball, ohne andere zu berühren.\n\nZiel: So hohes Break wie möglich erzielen.",
  },
  { id: "spot-yellow", name: "Gelb vom Spot", description: "Gelbe Kugel vom Spot lochen", mode: "break", seriesMode: true, explanation: "Weiss darf zu Beginn gesetzt werden. Wird Gelb gelocht, bleibt Weiss liegen und Gelb wird wieder auf ihrem Spot aufgesetzt. Die Serie mitzählen bis Gelb verfehlt wurde. Danach die Serie schreiben und Weiss für die nächste Serie wieder setzen. usw.\n\nZiel: Eine so hohe Serie wie möglich spielen." },
  { id: "spot-green", name: "Grün vom Spot", description: "Grüne Kugel vom Spot lochen", mode: "break", seriesMode: true, explanation: "Weiss darf zu Beginn gesetzt werden. Wird Grün gelocht, bleibt Weiss liegen und Grün wird wieder auf ihrem Spot aufgesetzt. Die Serie mitzählen bis Grün verfehlt wurde. Danach die Serie schreiben und Weiss für die nächste Serie wieder setzen. usw.\n\nZiel: Eine so hohe Serie wie möglich spielen." },
  { id: "spot-brown", name: "Braun vom Spot", description: "Braune Kugel vom Spot lochen", mode: "break", seriesMode: true, explanation: "Weiss darf zu Beginn gesetzt werden. Wird Braun gelocht, bleibt Weiss liegen und Braun wird wieder auf ihrem Spot aufgesetzt. Die Serie mitzählen bis Braun verfehlt wurde. Danach die Serie schreiben und Weiss für die nächste Serie wieder setzen. usw.\n\nZiel: Eine so hohe Serie wie möglich spielen." },
  { id: "spot-blue", name: "Blau vom Spot", description: "Blaue Kugel vom Spot lochen", mode: "break", seriesMode: true, explanation: "Weiss darf zu Beginn gesetzt werden. Wird Blau gelocht, bleibt Weiss liegen und Blau wird wieder auf ihrem Spot aufgesetzt. Die Serie mitzählen bis Blau verfehlt wurde. Danach die Serie schreiben und Weiss für die nächste Serie wieder setzen. usw.\n\nZiel: Eine so hohe Serie wie möglich spielen." },
  { id: "spot-pink", name: "Pink vom Spot", description: "Pinke Kugel vom Spot lochen", mode: "break", seriesMode: true, explanation: "Weiss darf zu Beginn gesetzt werden. Wird Pink gelocht, bleibt Weiss liegen und Pink wird wieder auf ihrem Spot aufgesetzt. Die Serie mitzählen bis Pink verfehlt wurde. Danach die Serie schreiben und Weiss für die nächste Serie wieder setzen. usw.\n\nZiel: Eine so hohe Serie wie möglich spielen." },
  { id: "spot-black", name: "Schwarz vom Spot", description: "Schwarze Kugel vom Spot lochen", mode: "break", seriesMode: true, explanation: "Weiss darf zu Beginn gesetzt werden. Wird Schwarz gelocht, bleibt Weiss liegen und Schwarz wird wieder auf ihrem Spot aufgesetzt. Die Serie mitzählen bis Schwarz verfehlt wurde. Danach die Serie schreiben und Weiss für die nächste Serie wieder setzen. usw.\n\nZiel: Eine so hohe Serie wie möglich spielen." },
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
  { id: "long", label: "Lange" },
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
      clearance?: boolean;
      missType?: MissType;
      ball?: BallColor;
      pocket?: Pocket;
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
    if (a.kind === "break" && a.clearance) cleared += 1;
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
