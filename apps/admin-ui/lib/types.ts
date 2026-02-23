export type Role = "SUPER_ADMIN" | "ADMIN" | "PARTNER_ADMIN";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  locationId: string | null;
  location?: { id: string; name: string } | null;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  tableNumbers: number[];
  isDefault: boolean;
  createdAt: string;
  _count?: {
    scoreboardConfigs: number;
    matches: number;
    users: number;
  };
}

export interface Match {
  id: string;
  player1Name: string;
  player1NationIOC: string | null;
  player2Name: string;
  player2NationIOC: string | null;
  active: boolean;
  bestOf: number;
  framesPlayer1: number;
  framesPlayer2: number;
  breaksPlayer1: number[];
  breaksPlayer2: number[];
  winner: string | null;
  rawGameLog: string;
  tableNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreboardConfig {
  id: string;
  deviceId: string;
  tableNumber: number | null;
  locationId: string;
  location: { id: string; name: string };
  namesListId: string | null;
  namesList: { id: string; name: string } | null;
  lastPingAt: string | null;
  online: boolean;
  createdAt: string;
}

export interface NamesList {
  id: string;
  name: string;
  locationId: string | null;
  createdAt: string;
  _count?: { entries: number };
  entries?: NamesListEntry[];
}

export interface NamesListEntry {
  id: string;
  playerName: string;
  nationalityIOC: string;
  sortOrder: number;
}

export type AssignmentStatus = "PENDING" | "CLAIMED" | "CANCELLED" | "COMPLETED";

export interface MatchAssignment {
  id: string;
  player1Name: string;
  player2Name: string;
  bestOf: number;
  handicap: number | null;
  deviceId: string | null;
  tableNumber: number | null;
  status: AssignmentStatus;
  createdAt: string;
}
