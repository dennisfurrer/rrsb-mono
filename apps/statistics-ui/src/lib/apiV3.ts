const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7200";

async function getV3<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api/v3${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

async function getV3Raw<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api/v3${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()) as T;
}

// ===== Types =====

export type V3Status = "ACTIVE" | "FINISHED" | "ABORTED";
export type V3InputMode = "BREAK" | "BALL_BY_BALL";
export type V3BallType =
  | "RED"
  | "YELLOW"
  | "GREEN"
  | "BROWN"
  | "BLUE"
  | "PINK"
  | "BLACK"
  | "FREE_BALL";
export type V3Phase = "RED" | "COLOR" | "COLORS_ONLY";
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
  | "EDIT_LAST_BREAK";

/** Capability flags the API derives from a match's schemaVersion (see @rrsb/contracts). */
export interface V3Capabilities {
  hasBallByBall: boolean;
  hasVisits: boolean;
  hasPointByPoint: boolean;
  hasFoulSubtypes: boolean;
  hasPocketDetail: boolean;
}

export interface V3MatchPlayer {
  id: string;
  playerIndex: number;
  name: string;
  nationalityIOC: string | null;
  club: string | null;
  startingHandicap: number;
  framesWon: number;
  isWinner: boolean;
  highBreak: number;
  highBreaks: number[];
  pointsFor: number;
  pointsAgainst: number;
}

export interface V3MatchSummary {
  id: string;
  matchType: string;
  matchTypeCode: string;
  inputMode: V3InputMode;
  redsCount: number;
  bestOf: number;
  status: V3Status;
  isDraw: boolean;
  winnerPlayerIndex: number | null;
  tableNumber: number | null;
  startedAt: string;
  finishedAt: string | null;
  updatedAt: string;
  schemaVersion?: number;
  producer?: string | null;
  producerVersion?: string | null;
  capabilities?: V3Capabilities;
  players: V3MatchPlayer[];
}

export interface V3Ball {
  id: string;
  sequence: number;
  ballType: V3BallType;
  points: number;
  isFreeBall: boolean;
  phase: V3Phase;
  redsRemainingAfter: number | null;
}

export interface V3Break {
  id: string;
  playerIndex: number;
  sequence: number;
  totalPoints: number;
  ballCount: number;
  isClearance: boolean;
  isManualEntry: boolean;
  endReason: string | null;
  missType: string | null;
  foulType: string | null;
  ball: string | null;
  pocket: string | null;
  startedAt: string;
  endedAt: string | null;
  balls: V3Ball[];
}

export interface V3Frame {
  id: string;
  frameNumber: number;
  redsCount: number;
  inputMode: V3InputMode;
  breakerPlayerIndex: number | null;
  winnerPlayerIndex: number | null;
  scoreP0: number;
  scoreP1: number;
  rerackCount: number;
  respottedBlack: boolean;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  endedAt: string | null;
  breaks: V3Break[];
}

export interface V3Event {
  id: string;
  frameId: string | null;
  breakId: string | null;
  seq: number;
  type: V3EventType;
  playerIndex: number | null;
  ballType: V3BallType | null;
  points: number;
  missType: string | null;
  foulType: string | null;
  pocket: string | null;
  isFreeBall: boolean;
  freeBallGranted: boolean | null;
  phase: V3Phase | null;
  redsRemaining: number | null;
  oldReds: number | null;
  newReds: number | null;
  source: "DISPLAY" | "REMOTE_PHONE";
  remotePlayerIndex: number | null;
  wasUndone: boolean;
  manualFlagToIgnore: boolean;
  label: string | null;
  clientTs: string | null;
  createdAt: string;
}

export interface V3RemoteEvent {
  id: string;
  type: string;
  playerIndex: number | null;
  commandType: string | null;
  commandPayload: unknown;
  createdAt: string;
}

export interface V3MatchDetail extends V3MatchSummary {
  frames: V3Frame[];
  events: V3Event[];
  remoteEvents: V3RemoteEvent[];
}

export interface V3PlayerLifetime {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  framesWon: number;
  framesLost: number;
  pointsFor: number;
  pointsAgainst: number;
  breaksOver7: number;
  highBreak: number;
  highBreaks: number[];
  centuries: number;
  foulsCommitted: number;
  foulPointsConceded: number;
}

export interface V3MatchTypeStat {
  matchType: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  framesWon: number;
  framesLost: number;
  highBreak: number;
}

export interface V3RecentMatch {
  matchId: string;
  matchType: string;
  startedAt: string;
  finishedAt: string | null;
  status: V3Status;
  bestOf: number;
  framesWon: number;
  framesLost: number;
  isWinner: boolean;
  highBreak: number;
  highBreaks: number[];
  opponent: string | null;
}

export interface V3PlayerProfile {
  id: string;
  name: string;
  nationalityIOC: string | null;
  club: string | null;
  lifetime: V3PlayerLifetime;
  byMatchType: V3MatchTypeStat[];
  recentMatches: V3RecentMatch[];
}

export interface V3PlayerListItem {
  id: string;
  name: string;
  nationalityIOC: string | null;
  club: string | null;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  framesWon: number;
  framesLost: number;
  highBreak: number;
  highBreaks: number[];
  centuries: number;
}

export interface V3Club {
  id: string;
  name: string;
  slug: string;
  tableNumbers: number[];
  isDefault: boolean;
}

export interface V3TablePlayer {
  name: string;
  nationalityIOC: string | null;
  club: string | null;
  framesWon: number;
  highBreaks: number[];
}

export interface V3TableMatch {
  id: string;
  status: V3Status;
  matchType: string;
  matchTypeCode: string;
  schemaVersion?: number;
  capabilities?: V3Capabilities;
  bestOf: number;
  startedAt: string;
  finishedAt: string | null;
  updatedAt: string;
  players: V3TablePlayer[];
  frameScore: [number, number];
}

export interface V3Table {
  tableNumber: number;
  match: V3TableMatch | null;
}

export interface V3ClubTables {
  club: { id: string; name: string; slug: string; tableNumbers: number[] };
  tables: V3Table[];
}

export interface Paginated<T> {
  data: T[];
  metadata: {
    pagination: {
      currentPage: number;
      pageSize: number;
      totalMatches?: number;
      totalPages: number;
    };
  };
}

// ===== API =====

export const apiV3 = {
  matches: {
    live: () => getV3<V3MatchSummary[]>("/matches/live"),
    detail: (id: string) => getV3<V3MatchDetail>(`/matches/${id}`),
    list: (params: {
      status?: V3Status;
      matchType?: string;
      player?: string;
      page?: number;
      limit?: number;
    } = {}) => {
      const qs = new URLSearchParams();
      if (params.status) qs.set("status", params.status);
      if (params.matchType) qs.set("matchType", params.matchType);
      if (params.player) qs.set("player", params.player);
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      return getV3Raw<Paginated<V3MatchSummary>>(
        `/matches${qs.toString() ? `?${qs}` : ""}`
      );
    },
  },
  players: {
    list: () => getV3<V3PlayerListItem[]>("/players"),
    profile: (name: string) =>
      getV3<V3PlayerProfile>(`/players/${encodeURIComponent(name)}`),
  },
  clubs: {
    list: () => getV3<V3Club[]>("/clubs"),
    tables: (id: string) => getV3<V3ClubTables>(`/clubs/${id}/tables`),
  },
};
