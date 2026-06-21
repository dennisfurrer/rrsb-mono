import { z } from "zod";

// ===== Enums shared across v3 routes =====

export const matchTypeCodeEnum = z.enum([
  "SIX_REDS",
  "LIGA_A",
  "LIGA_BC",
  "OPEN_TURNIER",
  "QT",
  "SONSTIGES_TURNIER",
  "SWISS_SNOOKER_CUP",
  "TRAININGS_SPIEL",
  "WOCHENTURNIER",
  "OTHER",
]);
export type MatchTypeCode = z.infer<typeof matchTypeCodeEnum>;

export const inputModeEnum = z.enum(["BREAK", "BALL_BY_BALL"]);
export const ballTypeEnum = z.enum([
  "RED",
  "YELLOW",
  "GREEN",
  "BROWN",
  "BLUE",
  "PINK",
  "BLACK",
  "FREE_BALL",
]);
export const ballColorEnum = z.enum([
  "RED",
  "YELLOW",
  "GREEN",
  "BROWN",
  "BLUE",
  "PINK",
  "BLACK",
]);
export const bbPhaseEnum = z.enum(["RED", "COLOR", "COLORS_ONLY"]);
export const missTypeEnum = z.enum(["LONG", "EASY", "DIFFICULT", "POSITION", "FOUL"]);
export const foulTypeEnum = z.enum([
  "WHITE_POTTED",
  "WRONG_BALL_HIT",
  "NO_BALL_HIT",
  "WHITE_OFF_TABLE",
  "CLOTHING_FOUL",
  "CUE_FOUL",
]);
export const pocketEnum = z.enum([
  "CORNER",
  "MIDDLE",
  "CORNER_YELLOW",
  "CORNER_GREEN",
  "MIDDLE_YELLOW",
  "MIDDLE_GREEN",
  "CORNER_BLACK_YELLOW",
  "CORNER_BLACK_GREEN",
]);
export const eventSourceEnum = z.enum(["DISPLAY", "REMOTE_PHONE"]);
export const eventTypeEnum = z.enum([
  "POT",
  "MANUAL_BREAK",
  "FOUL",
  "MISS",
  "HANDICAP",
  "CORRECT_REDS",
  "SWITCH_PLAYER",
  "RERACK",
  "RESPOTTED_BLACK",
  "FRAME_END",
  "MATCH_END",
  "UNDO",
  "REDO",
  "EDIT_LAST_BREAK",
]);

/** Map the human match-type label shown in the UI to a normalized enum code. */
const MATCH_TYPE_CODE: Record<string, MatchTypeCode> = {
  "6-Reds": "SIX_REDS",
  "Liga A-Match": "LIGA_A",
  "Liga B/C-Match": "LIGA_BC",
  "Open-Turnier": "OPEN_TURNIER",
  QT: "QT",
  "Sonstiges Turnier": "SONSTIGES_TURNIER",
  "Swiss Snooker Cup": "SWISS_SNOOKER_CUP",
  "Trainings-Spiel": "TRAININGS_SPIEL",
  Wochenturnier: "WOCHENTURNIER",
};

export function matchTypeToCode(label: string | undefined | null): MatchTypeCode {
  if (!label) return "OTHER";
  return MATCH_TYPE_CODE[label] ?? "OTHER";
}

/** Insert a break value into a descending top-10 list (mirrors the UI rule). */
export function insertHighBreak(highBreaks: number[], value: number): number[] {
  if (value <= 7) return highBreaks;
  return [...highBreaks, value].sort((a, b) => b - a).slice(0, 10);
}
