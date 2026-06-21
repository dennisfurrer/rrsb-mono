/**
 * Shared fixtures + a small snooker simulator for the v3 fake-data scripts.
 * Everything produced here is tagged so the clear script can remove exactly
 * what the seed script created (and nothing else).
 */

// Tags used to identify seeded rows for clean removal.
export const SEED_DEVICE_ID = "v3-fake-seed";
export const SEED_ROOM_PREFIX = "v3fake-";

export interface SeedPlayer {
  name: string;
  ioc: string;
  club: string;
}

/** Fake-but-believable player pool. These names are removed on clear. */
export const PLAYER_POOL: SeedPlayer[] = [
  { name: "Marco Sutter", ioc: "SUI", club: "RRSB Zürich" },
  { name: "Sarah Bähler", ioc: "SUI", club: "RRSB Zürich" },
  { name: "Kevin Brunner", ioc: "SUI", club: "Snooker Club Bern" },
  { name: "Nadia Frei", ioc: "SUI", club: "Snooker Club Bern" },
  { name: "Luca Moretti", ioc: "SUI", club: "Lugano Cue Club" },
  { name: "Elena Rossi", ioc: "ITA", club: "Lugano Cue Club" },
  { name: "Liam O'Connor", ioc: "IRL", club: "Dublin SC" },
  { name: "Andrew Scott", ioc: "SCO", club: "Glasgow 147" },
  { name: "Tom Davies", ioc: "WAL", club: "Cardiff Cue" },
  { name: "Jack Wilson", ioc: "ENG", club: "Sheffield Crucible" },
  { name: "Connor McBride", ioc: "NIR", club: "Belfast Baize" },
  { name: "Fabian Keller", ioc: "GER", club: "München Snooker" },
  { name: "Pavel Novak", ioc: "CZE", club: "Praha Pool" },
  { name: "Yusuf Demir", ioc: "TUR", club: "Istanbul Cue" },
  { name: "Henrik Larsen", ioc: "DEN", club: "Copenhagen SC" },
  { name: "Anita Huber", ioc: "AUT", club: "Wien Snooker" },
];

/** Raw match-type labels exactly as the scoreboard UI produces them. */
export const MATCH_TYPES = [
  "6-Reds",
  "Liga A-Match",
  "Liga B/C-Match",
  "Open-Turnier",
  "QT",
  "Sonstiges Turnier",
  "Swiss Snooker Cup",
  "Trainings-Spiel",
  "Wochenturnier",
];

// ---- RNG helpers (Math.random is fine in a one-off Node script) ----

export function rand(n: number): number {
  return Math.floor(Math.random() * n);
}
export function pick<T>(arr: T[]): T {
  return arr[rand(arr.length)];
}
export function chance(p: number): boolean {
  return Math.random() < p;
}

// ---- Event shape sent to POST /api/v3/matches/:id/events ----

export type BallType = "RED" | "YELLOW" | "GREEN" | "BROWN" | "BLUE" | "PINK" | "BLACK" | "FREE_BALL";

export interface SeedEvent {
  type: string;
  frameNumber: number;
  playerIndex?: 0 | 1;
  ballType?: BallType;
  points?: number;
  isFreeBall?: boolean;
  phase?: "RED" | "COLOR" | "COLORS_ONLY";
  redsRemaining?: number;
  oldReds?: number;
  newReds?: number;
  source?: "DISPLAY" | "REMOTE_PHONE";
  remotePlayerIndex?: 0 | 1;
  state?: {
    scoreP0?: number;
    scoreP1?: number;
    activePlayerIndex?: 0 | 1;
    frameWinnerIndex?: 0 | 1 | null;
    matchWinnerIndex?: 0 | 1 | null;
    framesP0?: number;
    framesP1?: number;
  };
}

const COLORS: { ball: BallType; v: number }[] = [
  { ball: "YELLOW", v: 2 },
  { ball: "GREEN", v: 3 },
  { ball: "BROWN", v: 4 },
  { ball: "BLUE", v: 5 },
  { ball: "PINK", v: 6 },
  { ball: "BLACK", v: 7 },
];

interface SimFrame {
  events: SeedEvent[];
  scoreP0: number;
  scoreP1: number;
  winner: 0 | 1;
}

/**
 * Simulate one ball-by-ball frame and return the ordered event stream plus the
 * final scores/winner. Not strict snooker law — just believable, self-consistent
 * play with reds, colours, the odd foul/free ball, and a clearance to finish.
 */
export function simulateBallByBallFrame(
  reds: number,
  frameNumber: number,
  breaker: 0 | 1,
  opts: { remoteShare?: number; forceBigBreak?: boolean } = {}
): SimFrame {
  const remoteShare = opts.remoteShare ?? 0;
  const events: SeedEvent[] = [];
  const score: [number, number] = [0, 0];
  let active = breaker;
  let redsLeft = reds;
  // A free ball is only ever available to the player who comes to the table
  // immediately after a foul — never mid-break.
  let freeBallAvailable = false;

  const src = (pi: 0 | 1): Pick<SeedEvent, "source" | "remotePlayerIndex"> =>
    chance(remoteShare) ? { source: "REMOTE_PHONE", remotePlayerIndex: pi } : { source: "DISPLAY" };

  const pot = (ball: BallType, v: number, phase: SeedEvent["phase"], isFree = false) => {
    score[active] += v;
    events.push({
      type: "POT",
      frameNumber,
      playerIndex: active,
      ballType: ball,
      points: v,
      isFreeBall: isFree,
      phase,
      redsRemaining: redsLeft,
      ...src(active),
      state: { scoreP0: score[0], scoreP1: score[1], activePlayerIndex: active },
    });
  };

  const endVisit = (kind: "miss" | "foul") => {
    if (kind === "foul") {
      const opp = (1 - active) as 0 | 1;
      const fpts = 4;
      score[opp] += fpts;
      events.push({
        type: "FOUL",
        frameNumber,
        playerIndex: active,
        ballType: "BLUE",
        points: fpts,
        ...src(active),
        state: { scoreP0: score[0], scoreP1: score[1], activePlayerIndex: opp },
      });
    } else {
      events.push({
        type: "MISS",
        frameNumber,
        playerIndex: active,
        ...src(active),
        state: { scoreP0: score[0], scoreP1: score[1], activePlayerIndex: (1 - active) as 0 | 1 },
      });
    }
    freeBallAvailable = kind === "foul"; // the incoming player inherits a free ball
    active = (1 - active) as 0 | 1;
  };

  // Phase 1: reds + colours.
  let firstVisit = true;
  let guard = 0;
  while (redsLeft > 0 && guard++ < 400) {
    // Sometimes a player comes to the table and misses immediately.
    if (!firstVisit && chance(0.22)) {
      endVisit(chance(0.25) ? "foul" : "miss");
      continue;
    }
    const big = firstVisit && (opts.forceBigBreak ?? false);
    firstVisit = false;

    // A free ball can only OPEN this visit (and only right after a foul). It
    // stands in for the ball on — a red, worth 1, reds unchanged — and is then
    // followed by a colour before the normal red/colour break resumes.
    const useFree = freeBallAvailable && !big && chance(0.5);
    freeBallAvailable = false;
    if (useFree) {
      pot("FREE_BALL", 1, "RED", true);
      const fc = pick(COLORS);
      pot(fc.ball, fc.v, "COLOR");
    }

    let cont = true;
    let potted = useFree ? 1 : 0;
    while (cont && redsLeft > 0 && guard++ < 400) {
      redsLeft -= 1;
      pot("RED", 1, "RED");
      potted++;
      if (chance(big ? 0.97 : 0.88)) {
        const c = big ? COLORS[5] : pick(COLORS); // big breaks ride the black
        pot(c.ball, c.v, "COLOR");
      } else {
        break; // missed the colour
      }
      cont = big ? redsLeft > 0 : chance(Math.max(0.2, 0.78 - potted * 0.03));
    }
    endVisit(chance(0.12) ? "foul" : "miss");
  }

  // Phase 2: colours-only clearance.
  let ci = 0;
  let guard2 = 0;
  while (ci < COLORS.length && guard2++ < 20) {
    const c = COLORS[ci];
    pot(c.ball, c.v, "COLORS_ONLY");
    ci++;
    if (ci < COLORS.length && chance(0.18)) {
      endVisit("miss"); // missed mid-clearance, opponent continues
    }
  }

  // Decide winner; break ties with a notional extra point to the leader's side.
  let winner: 0 | 1 = score[0] >= score[1] ? 0 : 1;
  if (score[0] === score[1]) {
    score[winner] += 1;
  }

  events.push({
    type: "FRAME_END",
    frameNumber,
    state: { scoreP0: score[0], scoreP1: score[1], frameWinnerIndex: winner },
  });

  return { events, scoreP0: score[0], scoreP1: score[1], winner };
}

/** Simulate one manual break-entry frame (whole breaks, no individual balls). */
export function simulateManualFrame(frameNumber: number, breaker: 0 | 1): SimFrame {
  const events: SeedEvent[] = [];
  const score: [number, number] = [0, 0];
  let active = breaker;
  let guard = 0;

  while (Math.max(score[0], score[1]) < 60 && guard++ < 30) {
    if (chance(0.18)) {
      // foul
      const opp = (1 - active) as 0 | 1;
      score[opp] += 4;
      events.push({
        type: "FOUL",
        frameNumber,
        playerIndex: active,
        points: 4,
        source: "DISPLAY",
        state: { scoreP0: score[0], scoreP1: score[1], activePlayerIndex: opp },
      });
    } else {
      const v = 1 + rand(chance(0.2) ? 60 : 24);
      score[active] += v;
      events.push({
        type: "MANUAL_BREAK",
        frameNumber,
        playerIndex: active,
        points: v,
        source: "DISPLAY",
        state: { scoreP0: score[0], scoreP1: score[1], activePlayerIndex: (1 - active) as 0 | 1 },
      });
    }
    active = (1 - active) as 0 | 1;
  }

  let winner: 0 | 1 = score[0] >= score[1] ? 0 : 1;
  if (score[0] === score[1]) score[winner] += 1;

  events.push({
    type: "FRAME_END",
    frameNumber,
    state: { scoreP0: score[0], scoreP1: score[1], frameWinnerIndex: winner },
  });
  return { events, scoreP0: score[0], scoreP1: score[1], winner };
}
