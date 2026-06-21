import { API_BASE_URL } from "./api";
import type { MatchState } from "./model";
import type { BBState, BBBallColor, BBBallType } from "./ballbyball";

export { API_BASE_URL };

/** v3 remote relay base — logs session/connection/command meta to the database. */
const REMOTE_BASE = `${API_BASE_URL}/api/v3/remote`;

/**
 * Commands flow phone -> display. The display applies each command through its
 * existing scoring handlers, so the display stays the single source of truth.
 */
export type RemoteCommand =
  | { t: "bb_pot"; ball: BBBallType }
  | { t: "bb_foul"; ball: BBBallColor }
  | { t: "bb_miss" }
  | { t: "bb_correct_reds"; count: number }
  | { t: "add_points"; playerIndex: 0 | 1; points: number; isFoul: boolean; isHandicap: boolean }
  | { t: "switch_player"; playerIndex: 0 | 1 }
  | { t: "undo" }
  | { t: "redo" }
  | { t: "end_frame" }
  | { t: "edit_last_break" };

/** Curated mirror of the match the phone needs to render + drive controls. */
export interface RemoteSnapshot {
  players: [
    { name: string; club?: string; score: number; frames: number },
    { name: string; club?: string; score: number; frames: number },
  ];
  bestOf: number;
  currentFrame: number;
  activePlayerIndex: number;
  finished: boolean;
  inputMode: "break" | "ballbyball";
  bbState: BBState | null;
  matchType?: string;
  colors: [string, string];
  redoAvailable: boolean;
}

export function buildSnapshot(
  match: MatchState,
  colors: [string, string],
  redoAvailable = false
): RemoteSnapshot {
  return {
    players: [
      {
        name: match.players[0].name,
        club: match.players[0].club,
        score: match.players[0].score,
        frames: match.players[0].frames,
      },
      {
        name: match.players[1].name,
        club: match.players[1].club,
        score: match.players[1].score,
        frames: match.players[1].frames,
      },
    ],
    bestOf: match.bestOf,
    currentFrame: match.currentFrame,
    activePlayerIndex: match.activePlayerIndex,
    finished: match.finished,
    inputMode: match.inputMode ?? "break",
    bbState: match.bbState ?? null,
    matchType: match.matchType,
    colors,
    redoAvailable,
  };
}

/** QR payload: roomId and player token, joined so a single string round-trips. */
export function encodeRemoteParam(roomId: string, token: string): string {
  return `${roomId}~${token}`;
}

export function decodeRemoteParam(
  param: string
): { roomId: string; token: string } | null {
  const idx = param.indexOf("~");
  if (idx < 0) return null;
  const roomId = param.slice(0, idx);
  const token = param.slice(idx + 1);
  if (!roomId || !token) return null;
  return { roomId, token };
}

/** Full URL a player scans to open their remote scorer. */
export function remoteUrl(roomId: string, token: string): string {
  return `${window.location.origin}/?r=${encodeRemoteParam(roomId, token)}`;
}

// ===== Display-side relay calls =====

export async function createRemoteSession(
  roomId: string,
  displayKey: string,
  playerIndex: 0 | 1
): Promise<string | null> {
  try {
    const res = await fetch(`${REMOTE_BASE}/${roomId}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayKey, playerIndex }),
    });
    const data = await res.json();
    return data.token ?? null;
  } catch (e) {
    console.error("Failed to create remote session:", e);
    return null;
  }
}

export async function pushRemoteState(
  roomId: string,
  displayKey: string,
  snapshot: RemoteSnapshot
): Promise<void> {
  try {
    await fetch(`${REMOTE_BASE}/${roomId}/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayKey, snapshot }),
    });
  } catch {
    /* best-effort */
  }
}

// ===== Phone-side relay calls =====

export async function sendRemoteCommand(
  roomId: string,
  token: string,
  command: RemoteCommand
): Promise<boolean> {
  try {
    const res = await fetch(`${REMOTE_BASE}/${roomId}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, command }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function commandStreamUrl(roomId: string, displayKey: string): string {
  return `${REMOTE_BASE}/${roomId}/commands?key=${encodeURIComponent(displayKey)}`;
}

export function stateStreamUrl(roomId: string, token: string): string {
  return `${REMOTE_BASE}/${roomId}/stream?token=${encodeURIComponent(token)}`;
}
