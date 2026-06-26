export interface Player {
  name: string;
  nationalityIOC: string;
  club?: string;
  frames: number;
  score: number;
  highbreaks: number[];
  winner: boolean;
}

export interface FrameAction {
  type: "break" | "foul" | "handicap" | "frame_end" | "match_end" | "undo" | "rerack";
  playerIndex: number;
  points: number;
  frameNumber: number;
  timestamp: number;
}

export type InputMode = "break" | "ballbyball";

export interface MatchState {
  matchId: string | null;
  players: [Player, Player];
  bestOf: number;
  activePlayerIndex: number;
  hasBreak: number;
  currentFrame: number;
  tableNumber: string | null;
  finished: boolean;
  startedAt?: string;
  inputMode?: InputMode;
  redsCount?: number;
  bbState?: import("./ballbyball").BBState | null;
  matchType?: string;
}

export function createPlayer(name: string, nationalityIOC = "", club = ""): Player {
  return {
    name,
    nationalityIOC,
    club,
    frames: 0,
    score: 0,
    highbreaks: [],
    winner: false,
  };
}

export function createInitialMatchState(): MatchState {
  return {
    matchId: null,
    players: [createPlayer("Player 1"), createPlayer("Player 2")],
    bestOf: 7,
    activePlayerIndex: 0,
    hasBreak: 0,
    currentFrame: 1,
    tableNumber: localStorage.getItem("tableNumber"),
    finished: false,
    startedAt: new Date().toISOString(),
  };
}

export function insertHighBreak(highbreaks: number[], value: number): number[] {
  if (value <= 7) return highbreaks;
  return [...highbreaks, value].sort((a, b) => b - a);
}

/** Determine frame winner: the player with more points */
export function determineFrameWinner(
  state: MatchState
): 0 | 1 | null {
  const [p1, p2] = state.players;
  if (p1.score > p2.score) return 0;
  if (p2.score > p1.score) return 1;
  return null;
}

/** Check if a player has won enough frames for the match */
export function framesToWin(bestOf: number): number {
  return Math.ceil(bestOf / 2);
}

export function isMatchOver(state: MatchState): boolean {
  if (state.bestOf % 2 === 0) {
    // Even best-of: all frames must be played
    const totalFrames = state.players[0].frames + state.players[1].frames;
    return totalFrames >= state.bestOf;
  }
  const target = framesToWin(state.bestOf);
  return state.players[0].frames >= target || state.players[1].frames >= target;
}
