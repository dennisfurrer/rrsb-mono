export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:7200"
    : "https://rrsb-mono-sas-api.onrender.com"
);

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

export async function createMatch(
  payload: MatchPayload
): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.data?.matchId ?? null;
  } catch (e) {
    console.error("Failed to create match:", e);
    return null;
  }
}

export async function updateMatch(payload: MatchUpdatePayload): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/matches`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("Failed to update match:", e);
  }
}

export async function sendFrameAction(
  payload: FrameActionPayload
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/frame-actions/single`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("Failed to send frame action:", e);
  }
}

export function getDeviceId(): string {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

export async function pingScoreboard(
  deviceId: string
): Promise<ScoreboardConfig | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scoreboards/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    const data = await res.json();
    return data.config ?? null;
  } catch (e) {
    console.error("Ping failed:", e);
    return null;
  }
}

export async function fetchNamesList(
  id: string
): Promise<NamesListEntry[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scoreboards/names-list/${id}`);
    const data = await res.json();
    return data.data?.entries ?? null;
  } catch (e) {
    console.error("Failed to fetch names list:", e);
    return null;
  }
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
  try {
    const params = new URLSearchParams();
    if (tableNumber) {
      params.set("tableNumber", String(tableNumber));
    } else {
      params.set("deviceId", deviceId);
    }
    const res = await fetch(
      `${API_BASE_URL}/api/scoreboards/assignments/pending?${params}`
    );
    const data = await res.json();
    const assignments = data.data ?? [];
    return assignments.length > 0 ? assignments[0] : null;
  } catch (e) {
    console.error("Failed to fetch assignments:", e);
    return null;
  }
}

export async function claimAssignment(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/scoreboards/assignments/claim`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch (e) {
    console.error("Failed to claim assignment:", e);
  }
}

export async function cancelAssignment(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/scoreboards/assignments/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch (e) {
    console.error("Failed to cancel assignment:", e);
  }
}

export async function completeAssignment(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/scoreboards/assignments/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch (e) {
    console.error("Failed to complete assignment:", e);
  }
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
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/frame-actions/${matchId}/breaks/${playerIndex}`
    );
    const data = await res.json();
    return data.data ?? [];
  } catch (e) {
    console.error("Failed to fetch breaks:", e);
    return [];
  }
}

export async function toggleBreakFlag(actionId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/frame-actions/${actionId}/flag`,
      { method: "PATCH" }
    );
    const data = await res.json();
    return data.data?.manualFlagToIgnore ?? false;
  } catch (e) {
    console.error("Failed to toggle flag:", e);
    return false;
  }
}

export async function updateTableNumber(
  deviceId: string,
  tableNumber: number
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/scoreboards/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, tableNumber }),
    });
  } catch (e) {
    console.error("Failed to update table number:", e);
  }
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
  try {
    const res = await fetch(`${API_BASE_URL}/api/practice-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.data?.sessionId ?? null;
  } catch (e) {
    console.error("Failed to create practice session:", e);
    return null;
  }
}

export async function patchPracticeSession(
  sessionId: string,
  patch: { redsCount?: number; finished?: boolean }
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/practice-sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch (e) {
    console.error("Failed to patch practice session:", e);
  }
}

export async function addPracticeAttempts(
  sessionId: string,
  attempts: PracticeAttemptInput[]
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/practice-sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempts }),
    });
  } catch (e) {
    console.error("Failed to add practice attempts:", e);
  }
}

export async function deleteLastPracticeAttempt(
  sessionId: string
): Promise<void> {
  try {
    await fetch(
      `${API_BASE_URL}/api/practice-sessions/${sessionId}/attempts/last`,
      { method: "DELETE" }
    );
  } catch (e) {
    console.error("Failed to delete last attempt:", e);
  }
}
