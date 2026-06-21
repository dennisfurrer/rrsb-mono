import { API_BASE_URL, apiFetch } from "./connection";

// Re-exported so existing imports (lib/apiV3, lib/remote) keep working.
export { API_BASE_URL };

interface MatchPayload {
  players: {
    name: string;
    nationalityIOC: string;
    frames: number;
    highbreaks: number[];
    winner: boolean;
  }[];
  bestOf: number;
  tableNumber?: string | null;
}

interface MatchUpdatePayload {
  type: string;
  matchState: {
    matchId: string;
    bestOf: number;
    players: {
      name: string;
      frames: number;
      highbreaks: number[];
      winner: boolean;
    }[];
  };
  tableNumber?: string | null;
}

interface FrameActionPayload {
  matchId: string;
  frameNumber: number;
  actionType: string;
  playerIndex: number;
  points: number;
  metadata?: Record<string, unknown>;
}

export interface ScoreboardConfig {
  tableNumber: number | null;
  namesListId: string | null;
  locationName: string;
}

export interface NamesListEntry {
  playerName: string;
  nationalityIOC: string;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function createMatch(payload: MatchPayload): Promise<string | null> {
  const res = await apiFetch(`/api/matches`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res) return null;
  const data = await res.json();
  return data.data?.matchId ?? null;
}

export async function updateMatch(payload: MatchUpdatePayload): Promise<void> {
  await apiFetch(`/api/matches`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function sendFrameAction(payload: FrameActionPayload): Promise<void> {
  await apiFetch(`/api/frame-actions/single`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export function getDeviceId(): string {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

export async function pingScoreboard(deviceId: string): Promise<ScoreboardConfig | null> {
  const res = await apiFetch(`/api/scoreboards/ping`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ deviceId }),
  });
  if (!res) return null;
  const data = await res.json();
  return data.config ?? null;
}

export async function fetchNamesList(id: string): Promise<NamesListEntry[] | null> {
  const res = await apiFetch(`/api/scoreboards/names-list/${id}`);
  if (!res) return null;
  const data = await res.json();
  return data.data?.entries ?? null;
}

export interface MatchAssignment {
  id: string;
  player1Name: string;
  player2Name: string;
  bestOf: number;
  handicap: number | null;
  deviceId: string | null;
  tableNumber: number | null;
  status: string;
  createdAt: string;
}

export async function fetchPendingAssignment(
  tableNumber: number | null,
  deviceId: string
): Promise<MatchAssignment | null> {
  const params = new URLSearchParams();
  if (tableNumber) {
    params.set("tableNumber", String(tableNumber));
  } else {
    params.set("deviceId", deviceId);
  }
  const res = await apiFetch(`/api/scoreboards/assignments/pending?${params}`);
  if (!res) return null;
  const data = await res.json();
  const assignments = data.data ?? [];
  return assignments.length > 0 ? assignments[0] : null;
}

export async function claimAssignment(id: string): Promise<void> {
  await apiFetch(`/api/scoreboards/assignments/claim`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ id }),
  });
}

export async function cancelAssignment(id: string): Promise<void> {
  await apiFetch(`/api/scoreboards/assignments/cancel`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ id }),
  });
}

export async function completeAssignment(id: string): Promise<void> {
  await apiFetch(`/api/scoreboards/assignments/complete`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ id }),
  });
}

export interface BreakAction {
  id: string;
  points: number;
  frameNumber: number;
  manualFlagToIgnore: boolean;
  timestamp: string;
}

export async function fetchPlayerBreaks(
  matchId: string,
  playerIndex: number
): Promise<BreakAction[]> {
  const res = await apiFetch(`/api/frame-actions/${matchId}/breaks/${playerIndex}`);
  if (!res) return [];
  const data = await res.json();
  return data.data ?? [];
}

export async function toggleBreakFlag(actionId: string): Promise<boolean> {
  const res = await apiFetch(`/api/frame-actions/${actionId}/flag`, { method: "PATCH" });
  if (!res) return false;
  const data = await res.json();
  return data.data?.manualFlagToIgnore ?? false;
}

export async function updateTableNumber(deviceId: string, tableNumber: number): Promise<void> {
  await apiFetch(`/api/scoreboards/ping`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ deviceId, tableNumber }),
  });
}

// ===== Practice (solo training) =====

export interface CreatePracticeSessionPayload {
  playerName: string;
  routineId: string;
  routineName: string;
  mode: "BREAK" | "HITMISS";
  redsCount?: number;
  deviceId?: string;
  tableNumber?: number;
}

export interface PracticeAttemptInput {
  kind: "BREAK" | "CLEARED" | "MISSED" | "HIT" | "MISS";
  value?: number;
  missType?: "LONG" | "EASY" | "DIFFICULT" | "POSITION" | "FOUL";
  foulType?:
    | "WHITE_POTTED"
    | "WRONG_BALL_HIT"
    | "NO_BALL_HIT"
    | "WHITE_OFF_TABLE"
    | "CLOTHING_FOUL"
    | "CUE_FOUL";
  ball?: "RED" | "YELLOW" | "GREEN" | "BROWN" | "BLUE" | "PINK" | "BLACK";
  pocket?:
    | "CORNER_YELLOW"
    | "CORNER_GREEN"
    | "MIDDLE_YELLOW"
    | "MIDDLE_GREEN"
    | "CORNER_BLACK_YELLOW"
    | "CORNER_BLACK_GREEN";
}

export async function createPracticeSession(
  payload: CreatePracticeSessionPayload
): Promise<string | null> {
  const res = await apiFetch(`/api/practice-sessions`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res) return null;
  const data = await res.json();
  return data.data?.sessionId ?? null;
}

export async function patchPracticeSession(
  sessionId: string,
  patch: { redsCount?: number; finished?: boolean }
): Promise<void> {
  await apiFetch(`/api/practice-sessions/${sessionId}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(patch),
  });
}

export async function addPracticeAttempts(
  sessionId: string,
  attempts: PracticeAttemptInput[]
): Promise<void> {
  await apiFetch(`/api/practice-sessions/${sessionId}/attempts`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ attempts }),
  });
}

export async function deleteLastPracticeAttempt(sessionId: string): Promise<void> {
  await apiFetch(`/api/practice-sessions/${sessionId}/attempts/last`, { method: "DELETE" });
}
