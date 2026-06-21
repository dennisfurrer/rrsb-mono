import { apiFetch } from "./connection";
import type { BBBallType } from "./ballbyball";
import { VERSION } from "../version";

// ===== v3 API client — full play-by-play capture (v3-only writes) =====

/**
 * Capability level of the data this scoreboard build PRODUCES. Bump this when the
 * scoreboard starts capturing something new (kept in sync with @rrsb/contracts'
 * SCHEMA_VERSION on the read side). Provenance is `producer` + `producerVersion`.
 */
export const PRODUCED_SCHEMA_VERSION = 3;
export const PRODUCER = "scoreboard-ui";
export const PRODUCER_VERSION = VERSION;

export type V3EventType =
  | "POT"
  | "MANUAL_BREAK"
  | "FOUL"
  | "MISS"
  | "HANDICAP"
  | "CORRECT_REDS"
  | "SWITCH_PLAYER"
  | "RERACK"
  | "RESPOTTED_BLACK"
  | "FRAME_END"
  | "MATCH_END"
  | "UNDO"
  | "REDO"
  | "EDIT_LAST_BREAK"
  | "DELETE_BREAK"
  | "MATCH_ABANDONED";

export type V3BallTypeApi =
  | "RED"
  | "YELLOW"
  | "GREEN"
  | "BROWN"
  | "BLUE"
  | "PINK"
  | "BLACK"
  | "FREE_BALL";

export type V3EventSource = "DISPLAY" | "REMOTE_PHONE";

/** Tags an event with where it originated (display vs a player's phone). */
export interface V3EventMeta {
  source?: V3EventSource;
  remotePlayerIndex?: 0 | 1;
}

export interface V3EventState {
  scoreP0?: number;
  scoreP1?: number;
  activePlayerIndex?: 0 | 1;
  breakerIndex?: 0 | 1;
  frameWinnerIndex?: 0 | 1 | null;
  matchWinnerIndex?: 0 | 1 | null;
  framesP0?: number;
  framesP1?: number;
}

export interface V3EventInput {
  type: V3EventType;
  frameNumber: number;
  playerIndex?: 0 | 1;
  ballType?: V3BallTypeApi;
  ball?: "RED" | "YELLOW" | "GREEN" | "BROWN" | "BLUE" | "PINK" | "BLACK";
  points?: number;
  missType?: "LONG" | "EASY" | "DIFFICULT" | "POSITION" | "FOUL";
  foulType?:
    | "WHITE_POTTED"
    | "WRONG_BALL_HIT"
    | "NO_BALL_HIT"
    | "WHITE_OFF_TABLE"
    | "CLOTHING_FOUL"
    | "CUE_FOUL";
  pocket?:
    | "CORNER"
    | "MIDDLE"
    | "CORNER_YELLOW"
    | "CORNER_GREEN"
    | "MIDDLE_YELLOW"
    | "MIDDLE_GREEN"
    | "CORNER_BLACK_YELLOW"
    | "CORNER_BLACK_GREEN";
  isFreeBall?: boolean;
  freeBallGranted?: boolean;
  isClearance?: boolean;
  phase?: "RED" | "COLOR" | "COLORS_ONLY";
  redsRemaining?: number;
  oldReds?: number;
  newReds?: number;
  breakTotal?: number;
  source?: V3EventSource;
  remotePlayerIndex?: 0 | 1;
  label?: string;
  clientTs?: string;
  state?: V3EventState;
  payload?: unknown;
}

export interface CreateMatchV3Payload {
  matchType: string;
  inputMode: "BREAK" | "BALL_BY_BALL";
  redsCount: number;
  bestOf: number;
  players: {
    name: string;
    nationalityIOC?: string;
    club?: string;
    startingHandicap?: number;
  }[];
  tableNumber?: number | null;
  locationId?: string | null;
  deviceId?: string | null;
  remoteRoomId?: string | null;
  schemaVersion?: number;
  producer?: string;
  producerVersion?: string;
}

/** Map a ball-by-ball ball/freeball to the API enum. */
export function ballToApi(ball: BBBallType): V3BallTypeApi {
  return ball === "freeball" ? "FREE_BALL" : (ball.toUpperCase() as V3BallTypeApi);
}

/** Map a UI input mode to the API enum. */
export function inputModeToApi(mode: "break" | "ballbyball" | undefined): "BREAK" | "BALL_BY_BALL" {
  return mode === "ballbyball" ? "BALL_BY_BALL" : "BREAK";
}

/** Map a ball-by-ball phase to the API enum. */
export function phaseToApi(
  phase: "red" | "color" | "colors_only" | undefined
): "RED" | "COLOR" | "COLORS_ONLY" | undefined {
  if (!phase) return undefined;
  if (phase === "colors_only") return "COLORS_ONLY";
  return phase.toUpperCase() as "RED" | "COLOR";
}

/** The remote room id this display owns (created by useRemoteHost). */
export function getRemoteRoomId(): string | null {
  try {
    const saved = sessionStorage.getItem("remoteRoom");
    if (!saved) return null;
    return (JSON.parse(saved) as { roomId?: string }).roomId ?? null;
  } catch {
    return null;
  }
}

export async function createMatchV3(payload: CreateMatchV3Payload): Promise<string | null> {
  // Stamp provenance + capability level automatically (caller can override).
  const body = {
    schemaVersion: PRODUCED_SCHEMA_VERSION,
    producer: PRODUCER,
    producerVersion: PRODUCER_VERSION,
    ...payload,
  };
  const res = await apiFetch(`/api/v3/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res) return null; // no API configured, or the request failed
  const data = await res.json();
  return data.data?.matchId ?? null;
}

/** Fire-and-forget append of one or more play-by-play events. */
export function appendEventsV3(matchId: string, events: V3EventInput[]): void {
  const stamped = events.map((e) => ({ clientTs: new Date().toISOString(), ...e }));
  void apiFetch(`/api/v3/matches/${matchId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: stamped }),
    keepalive: true,
  });
}

export function patchMatchV3(
  matchId: string,
  patch: {
    status?: "ACTIVE" | "FINISHED" | "ABORTED";
    winnerPlayerIndex?: 0 | 1 | null;
    isDraw?: boolean;
    bestOf?: number;
  }
): void {
  void apiFetch(`/api/v3/matches/${matchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
    keepalive: true,
  });
}
