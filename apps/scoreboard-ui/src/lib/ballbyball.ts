export type BBBallColor = "red" | "yellow" | "green" | "brown" | "blue" | "pink" | "black";
export type BBBallType = BBBallColor | "freeball";

export const BALL_VALUES: Record<BBBallColor, number> = {
  red: 1,
  yellow: 2,
  green: 3,
  brown: 4,
  blue: 5,
  pink: 6,
  black: 7,
};

export const COLORS_ORDER: BBBallColor[] = ["yellow", "green", "brown", "blue", "pink", "black"];

export const BALL_HEX: Record<BBBallColor, string> = {
  red: "#cc2222",
  yellow: "#d4b800",
  green: "#1d7a1d",
  brown: "#7a3b1e",
  blue: "#1044bb",
  pink: "#cc4488",
  black: "#222222",
};

export type BBPhase = "red" | "color" | "colors_only";

export interface BBBreakBall {
  ball: BBBallType;
  points: number;
  hex: string; // colour for display
}

export interface BBState {
  redsRemaining: number;
  phase: BBPhase;
  colorsOnlyIndex: number; // 0=yellow … 5=black
  freeBallAvailable: boolean;
  foulByPlayerIndex?: 0 | 1;
  breakBalls: BBBreakBall[];   // balls potted in the current break
  breakTotal: number;
  frameOver?: boolean;
  respottedBlack?: boolean;
}

export function createBBState(reds: number): BBState {
  return { redsRemaining: reds, phase: "red", colorsOnlyIndex: 0, freeBallAvailable: false, breakBalls: [], breakTotal: 0 };
}

export function resetBreak(state: BBState): BBState {
  return { ...state, breakBalls: [], breakTotal: 0 };
}

export function foulPoints(ball: BBBallColor): number {
  return Math.max(4, BALL_VALUES[ball]);
}

export function ballOnValue(state: BBState): number {
  if (state.phase === "red") return 1;
  if (state.phase === "colors_only") return BALL_VALUES[COLORS_ORDER[state.colorsOnlyIndex]];
  return 1;
}

export type PotResult = { points: number; newState: BBState; frameOver?: boolean };

function addBreakBall(state: BBState, ball: BBBallType, points: number): BBState {
  const hex = ball === "freeball"
    ? `conic-gradient(from 0deg, ${BALL_HEX.yellow}, ${BALL_HEX.green}, ${BALL_HEX.brown}, ${BALL_HEX.blue}, ${BALL_HEX.pink}, ${BALL_HEX.black}, ${BALL_HEX.yellow})`
    : BALL_HEX[ball as BBBallColor];
  return {
    ...state,
    breakBalls: [...state.breakBalls, { ball, points, hex }],
    breakTotal: state.breakTotal + points,
  };
}

export function applyPot(state: BBState, ball: BBBallType): PotResult {
  const next: BBState = { ...state, freeBallAvailable: false, foulByPlayerIndex: undefined };

  if (ball === "freeball") {
    const points = ballOnValue(state);
    if (state.phase === "red") {
      // Freeball acts as a red → player now selects a colour
      next.phase = "color";
    }
    // In colors_only phase the freeball is an extra ball worth the ball-on value;
    // the actual colour-on ball is still to be potted, so colorsOnlyIndex stays.
    return { points, newState: addBreakBall(next, ball, points) };
  }

  if (ball === "red") {
    next.redsRemaining = state.redsRemaining - 1;
    next.phase = "color"; // after a red, player must choose a colour
    return { points: 1, newState: addBreakBall(next, ball, 1) };
  }

  const points = BALL_VALUES[ball as BBBallColor];

  if (state.phase === "red" || state.phase === "color") {
    if (state.redsRemaining > 0) {
      next.phase = "red";
    } else {
      next.phase = "colors_only";
      next.colorsOnlyIndex = 0;
    }
    return { points, newState: addBreakBall(next, ball, points) };
  }

  if (state.phase === "colors_only") {
    next.colorsOnlyIndex = state.colorsOnlyIndex + 1;
    if (next.colorsOnlyIndex >= COLORS_ORDER.length) {
      next.frameOver = true;
      // Keep index in bounds so the dialog doesn't crash
      next.colorsOnlyIndex = COLORS_ORDER.length - 1;
    }
    return { points, newState: addBreakBall(next, ball, points), frameOver: next.frameOver };
  }

  return { points: 0, newState: next };
}

export function applyFoul(state: BBState, ball: BBBallColor): { points: number; newState: BBState } {
  // Break ends on foul — reset break display, give freeball to opponent
  return { points: foulPoints(ball), newState: resetBreak({ ...state, freeBallAvailable: true }) };
}
