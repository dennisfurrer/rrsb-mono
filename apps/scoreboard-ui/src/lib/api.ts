const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

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
