const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:7200";

export async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

// Typed API calls

export interface BreakEntry {
  playerName: string;
  highBreaks: number[];
}

export interface LiveMatch {
  id: string;
  tableNumber: number | null;
  player1Name: string;
  player2Name: string;
  player1NationIOC: string | null;
  player2NationIOC: string | null;
  framesPlayer1: number;
  framesPlayer2: number;
  bestOf: number;
  breaksPlayer1: number[];
  breaksPlayer2: number[];
  winner: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProfile {
  name: string;
  nationality: string | null;
  matchesPlayed: number;
  matchesCompleted: number;
  matchesWon: number;
  matchesLost: number;
  framesWon: number;
  framesLost: number;
  highBreaks: number[];
  incompleteMatches: number;
  averageBreakPerMatch: number;
  mostFrequentOpponent: {
    opponent: string;
    total_matches: number;
    wins: number;
    win_percentage: number;
  } | null;
  deciderWinRate: number;
  longestWinStreak: number;
  avgBreaksByMonth: { month: string; avg_high_break: number }[];
}

export interface MatchHistoryEntry {
  id: string;
  player1Name: string;
  player1NationIOC: string | null;
  player2Name: string;
  player2NationIOC: string | null;
  bestOf: number;
  framesPlayer1: number;
  framesPlayer2: number;
  winner: string | null;
  topBreaksPlayer1: number[];
  topBreaksPlayer2: number[];
  date: string;
  tableNumber: number | null;
}

export interface MatchHistoryResponse {
  data: MatchHistoryEntry[];
  metadata: {
    pagination: {
      currentPage: number;
      pageSize: number;
      totalPages: number;
      totalMatches: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface FrameAction {
  id: string;
  matchId: string;
  frameNumber: number;
  actionType: string;
  playerIndex: number;
  points: number;
  metadata: string | null;
  wasUndone: boolean;
  timestamp: string;
}

export interface BreakMatrixEntry {
  player_name: string;
  "Total Frames Played": number;
  "Highest Break": number;
  "20+": number;
  "30+": number;
  "40+": number;
  "50+": number;
  "60+": number;
  "70+": number;
  "80+": number;
  "90+": number;
  "100+": number;
}

export const api = {
  breaks: {
    byDate: (date: string) => fetchJSON<BreakEntry[]>(`/breaks/${date}`),
    leaderboard: () => fetchJSON<BreakEntry[]>("/breaks/leaderboard"),
    byYear: (year: number) =>
      fetchJSON<BreakEntry[]>(`/breaks/year/${year}`),
    matrix: () => fetchJSON<BreakMatrixEntry[]>("/breaks-matrix"),
  },
  matches: {
    live: () => fetchJSON<LiveMatch[]>("/api/matches/live"),
    playerHistory: (name: string, page = 1, opponent?: string) => {
      let url = `/matches/player/${encodeURIComponent(name)}?page=${page}&limit=10`;
      if (opponent) url += `&opponent=${encodeURIComponent(opponent)}`;
      return fetch(`${API_BASE_URL}${url}`)
        .then((r) => r.json())
        .then((r) => r as { data: MatchHistoryEntry[]; metadata: MatchHistoryResponse["metadata"] });
    },
    frameActions: (matchId: string) =>
      fetchJSON<FrameAction[]>(`/api/frame-actions/${matchId}`),
  },
  players: {
    list: () => fetchJSON<string[]>("/players"),
    profile: (name: string) =>
      fetchJSON<PlayerProfile>(`/players/${encodeURIComponent(name)}`),
  },
  data: {
    years: () => fetchJSON<number[]>("/data/years"),
  },
};
