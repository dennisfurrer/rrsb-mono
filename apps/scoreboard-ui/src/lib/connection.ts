import { useSyncExternalStore } from "react";

/**
 * The scores-and-stats API is OPTIONAL. The scoreboard never talks to the
 * database directly — only through this API — and must run fine with no API
 * configured at all (it just won't send anything). When an API URL *is*
 * configured but requests fail, we surface a quiet on-screen indicator.
 *
 * Configuration is solely `VITE_API_URL`. No localhost/production fallback:
 * if it isn't set, the scoreboard simply doesn't send.
 */
const raw = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").trim();
export const API_BASE_URL: string | null = raw ? raw.replace(/\/+$/, "") : null;
export const API_CONFIGURED = API_BASE_URL !== null;

export type ApiStatus = "unconfigured" | "unknown" | "ok" | "error";

let status: ApiStatus = API_CONFIGURED ? "unknown" : "unconfigured";
const listeners = new Set<() => void>();

export function getApiStatus(): ApiStatus {
  return status;
}

/** Record the outcome of an API call so the UI can reflect connection health. */
export function markApiResult(ok: boolean): void {
  if (!API_CONFIGURED) return; // unconfigured is intentional, not an error
  const next: ApiStatus = ok ? "ok" : "error";
  if (next !== status) {
    status = next;
    listeners.forEach((l) => l());
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** React hook: live API connection status. */
export function useApiStatus(): ApiStatus {
  return useSyncExternalStore(subscribe, getApiStatus, getApiStatus);
}

/**
 * Configured-aware fetch. Returns `null` (a no-op) when no API URL is set, so
 * callers naturally fall back to their default. Tracks ok/error for the
 * indicator. `path` is relative (e.g. "/api/v3/matches").
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response | null> {
  if (!API_BASE_URL) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, init);
    markApiResult(res.ok);
    return res;
  } catch {
    markApiResult(false);
    return null;
  }
}
