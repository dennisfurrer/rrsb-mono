const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:7200";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  const data = await apiFetch<{
    token: string;
    user: import("./types").User;
  }>("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("admin_token", data.token);
  return data;
}

export async function getMe() {
  return apiFetch<{ user: import("./types").User }>("/api/admin/auth/me");
}

export function logout() {
  localStorage.removeItem("admin_token");
}

// Scoreboards
export async function getScoreboards() {
  return apiFetch<{ data: import("./types").ScoreboardConfig[] }>(
    "/api/admin/scoreboards"
  );
}

export async function updateScoreboard(
  deviceId: string,
  data: { tableNumber?: number; namesListId?: string | null; locationId?: string }
) {
  return apiFetch<{ data: import("./types").ScoreboardConfig }>(
    `/api/admin/scoreboards/${deviceId}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

export async function deleteScoreboard(deviceId: string) {
  return apiFetch<{ success: boolean }>(
    `/api/admin/scoreboards/${deviceId}`,
    { method: "DELETE" }
  );
}

// Names Lists
export async function getNamesLists() {
  return apiFetch<{ data: import("./types").NamesList[] }>(
    "/api/admin/names-lists"
  );
}

export async function createNamesList(name: string, locationId?: string) {
  return apiFetch<{ data: import("./types").NamesList }>(
    "/api/admin/names-lists",
    { method: "POST", body: JSON.stringify({ name, locationId }) }
  );
}

export async function getNamesList(id: string) {
  return apiFetch<{ data: import("./types").NamesList }>(
    `/api/admin/names-lists/${id}`
  );
}

export async function addNamesListEntry(
  listId: string,
  playerName: string,
  nationalityIOC?: string
) {
  return apiFetch<{ data: import("./types").NamesListEntry }>(
    `/api/admin/names-lists/${listId}/entries`,
    {
      method: "POST",
      body: JSON.stringify({ playerName, nationalityIOC }),
    }
  );
}

export async function deleteNamesListEntry(listId: string, entryId: string) {
  return apiFetch<{ success: boolean }>(
    `/api/admin/names-lists/${listId}/entries/${entryId}`,
    { method: "DELETE" }
  );
}

export async function uploadNamesListCsv(listId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<{ data: { count: number } }>(
    `/api/admin/names-lists/${listId}/upload-csv`,
    { method: "POST", body: formData }
  );
}

// Locations
export async function getLocations() {
  return apiFetch<{ data: import("./types").Location[] }>(
    "/api/admin/locations"
  );
}

export async function createLocation(name: string, address?: string) {
  return apiFetch<{ data: import("./types").Location }>(
    "/api/admin/locations",
    { method: "POST", body: JSON.stringify({ name, address }) }
  );
}

export async function updateLocation(
  id: string,
  data: { name?: string; address?: string }
) {
  return apiFetch<{ data: import("./types").Location }>(
    `/api/admin/locations/${id}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

// Users
export async function getUsers() {
  return apiFetch<{ data: import("./types").User[] }>("/api/admin/users");
}

export async function createUser(data: {
  email: string;
  password: string;
  displayName: string;
  role?: string;
  locationId?: string;
}) {
  return apiFetch<{ data: import("./types").User }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: { displayName?: string; role?: string; locationId?: string; password?: string }
) {
  return apiFetch<{ data: import("./types").User }>(
    `/api/admin/users/${id}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

export async function deleteUser(id: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
}

// Match Setup
export async function getMatchAssignments() {
  return apiFetch<{ data: import("./types").MatchAssignment[] }>(
    "/api/admin/match-setup"
  );
}

export async function createMatchAssignment(data: {
  player1Name: string;
  player2Name: string;
  bestOf: number;
  handicap?: number;
  deviceId?: string;
  tableNumber?: number;
}) {
  return apiFetch<{ data: import("./types").MatchAssignment }>(
    "/api/admin/match-setup",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function deleteMatchAssignment(id: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/match-setup/${id}`, {
    method: "DELETE",
  });
}
