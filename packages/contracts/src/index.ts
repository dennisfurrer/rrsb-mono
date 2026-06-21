/**
 * Cross-app data contracts for RRSB — the SINGLE source of truth for "how rich
 * is this match's data" so the API and every front end can degrade gracefully
 * without scattering version `if`s everywhere.
 *
 * Two distinct ideas, kept separate on purpose:
 *
 *   - producerVersion ("scoreboard-ui 0.0.1") = provenance only. NEVER branch on it.
 *   - schemaVersion (1, 2, 3, …)             = a coarse *capability level*. The
 *     ONLY thing anyone branches on, and only ever via `capabilities()` below.
 *
 * To branch in code: read a capability boolean (`caps.hasVisits`), never a number.
 * To add a capability: add a field to `Capabilities` + one line in `capabilities()`.
 * To record new data in the scoreboard: bump the level it stamps and `SCHEMA_VERSION`.
 */

/** Current capability level of data this codebase produces/understands. */
export const SCHEMA_VERSION = 3;

/**
 * Capability levels (history):
 *   1 — legacy: aggregate/break-level only (old Match/FrameAction). No events.
 *   2 — v3 base: full ball-by-ball, visits, events, per-frame breakdown.
 *   3 — v3 + foul subtypes (FoulType) and detailed pockets.
 */

export type InputMode = "BREAK" | "BALL_BY_BALL";

export interface Capabilities {
  /** Individual balls were recorded (ball-by-ball mode, v2+). */
  hasBallByBall: boolean;
  /** Per-visit breakdown is available. */
  hasVisits: boolean;
  /** A full chronological play-by-play (event firehose) exists. */
  hasPointByPoint: boolean;
  /** Fouls carry a subtype (white potted, wrong ball hit, …). */
  hasFoulSubtypes: boolean;
  /** Pockets carry detail (corner-yellow, middle-green, …). */
  hasPocketDetail: boolean;
}

/**
 * The one place version meaning lives. Everything else consumes the booleans.
 * Robust to unknown/future integers via threshold checks.
 */
export function capabilities(schemaVersion: number, inputMode: InputMode): Capabilities {
  const v = Number.isFinite(schemaVersion) ? schemaVersion : 1;
  const v3 = v >= 2; // any v3 match has an event log + visit rows
  return {
    // Only ball-by-ball mode records individual balls (the ball-disc reveal).
    hasBallByBall: v3 && inputMode === "BALL_BY_BALL",
    // Visits exist for both modes (manual breaks are visits without balls).
    hasVisits: v3,
    hasPointByPoint: v3,
    hasFoulSubtypes: v >= 3,
    hasPocketDetail: v >= 3,
  };
}

/** Convenience: capabilities with every flag off (e.g. unknown/legacy aggregate). */
export const NO_CAPABILITIES: Capabilities = {
  hasBallByBall: false,
  hasVisits: false,
  hasPointByPoint: false,
  hasFoulSubtypes: false,
  hasPocketDetail: false,
};
