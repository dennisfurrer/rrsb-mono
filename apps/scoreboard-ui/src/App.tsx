import { useCallback, useEffect, useRef, useState } from "react";
import {
  createInitialMatchState,
  createPlayer,
  determineFrameWinner,
  framesToWin,
  insertHighBreak,
  isMatchOver,
  type MatchState,
} from "./lib/model";
import {
  addPracticeAttempts,
  cancelAssignment,
  claimAssignment,
  completeAssignment,
  createPracticeSession,
  deleteLastPracticeAttempt,
  fetchNamesList,
  fetchPendingAssignment,
  getDeviceId,
  patchPracticeSession,
  pingScoreboard,
  type MatchAssignment,
  type NamesListEntry,
  type ScoreboardConfig,
} from "./lib/api";
import {
  appendEventsV3,
  ballToApi,
  createMatchV3,
  getRemoteRoomId,
  inputModeToApi,
  patchMatchV3,
  phaseToApi,
  type V3EventInput,
} from "./lib/apiV3";
import { Scoreboard } from "./components/Scoreboard";
import { SetupDialog, PRACTICE_MODE_VALUE } from "./components/SetupDialog";
import { CalculatorDialog } from "./components/CalculatorDialog";
import { MenuDialog } from "./components/MenuDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import { BreaksDialog } from "./components/BreaksDialog";
import { MatchStatsDialog } from "./components/MatchStatsDialog";
import { RoutinePickerDialog } from "./components/RoutinePickerDialog";
import { SoloSession } from "./components/SoloSession";
import { SoloMenuDialog } from "./components/SoloMenuDialog";
import { BallByBallDialog } from "./components/BallByBallDialog";
import {
  applyFoul,
  applyPot,
  createBBState,
  resetBreak,
  type BBBallColor,
  type BBBallType,
} from "./lib/ballbyball";
import { BreakEntryDialog } from "./components/BreakEntryDialog";
import { MultiEntryDialog } from "./components/MultiEntryDialog";
import { RedsConfigDialog } from "./components/RedsConfigDialog";
import { RemoteQRDialog } from "./components/RemoteQRDialog";
import { useRemoteHost } from "./hooks/useRemoteHost";
import type { RemoteCommand } from "./lib/remote";
import {
  breakAttemptToApi,
  createSoloSession,
  routineById,
  type BallColor,
  type BreakAttempt,
  type FoulType,
  type MissType,
  type Pocket,
  type SoloRoutineId,
  type SoloSessionState,
  type SoloShot,
} from "./lib/solo";

type HistoryEntry = {
  label: string;
  snapshot: string;
  color?: string;
  kind?: "break" | "foul" | "handicap" | "frame_end" | "rerack" | "correction";
  playerIndex?: 0 | 1;
  points?: number;
  frameNumber?: number;
  timestamp?: string;
  breakBalls?: Array<{ hex: string; points: number }>;
};

type RedoEntry = {
  entries: HistoryEntry[];
  matchAfter: string; // JSON of match state AFTER the action (to restore on redo)
};

function adjustColor(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  const r = clamp(((n >> 16) & 0xff) * f);
  const g = clamp(((n >> 8) & 0xff) * f);
  const b = clamp((n & 0xff) * f);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function resolvePlayerColor(own: string | null, other: string | null, lighter: boolean): string | undefined {
  if (!own) return undefined;
  return own === other ? adjustColor(own, lighter ? 1.7 : 0.5) : own;
}

/** Origin of a scoring action: the display itself, or a player's remote phone. */
type EvtMeta = { source: "REMOTE_PHONE"; remotePlayerIndex: 0 | 1 } | undefined;

/** Authoritative per-frame state snapshot sent with every v3 event. */
function frameSnap(m: MatchState): { scoreP0: number; scoreP1: number; activePlayerIndex: 0 | 1 } {
  return {
    scoreP0: m.players[0].score,
    scoreP1: m.players[1].score,
    activePlayerIndex: m.activePlayerIndex as 0 | 1,
  };
}

/**
 * Spread the source/remote-player tag onto an event (defaults to DISPLAY).
 * Defensive: some handlers double as onClick callbacks, so a stray MouseEvent
 * may arrive here — only a genuine remote tag flips the source.
 */
function withMeta(meta: EvtMeta): Pick<V3EventInput, "source" | "remotePlayerIndex"> {
  return meta && meta.source === "REMOTE_PHONE"
    ? { source: "REMOTE_PHONE", remotePlayerIndex: meta.remotePlayerIndex }
    : { source: "DISPLAY" };
}

export function App() {
  const [match, setMatch] = useState<MatchState>(() => {
    const saved = sessionStorage.getItem("matchState");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* ignore */
      }
    }
    return createInitialMatchState();
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<RedoEntry[]>([]);
  const [playerColors, setPlayerColors] = useState<[string | null, string | null]>([null, null]);
  const [showSetup, setShowSetup] = useState(!match.matchId);
  const [lastPlayerNames, setLastPlayerNames] = useState<{ name1: string; name2: string } | null>(null);
  const [calcPlayer, setCalcPlayer] = useState<0 | 1 | null>(null);
  const [showBBDialog, setShowBBDialog] = useState(false);
  const [isEditingBreak, setIsEditingBreak] = useState(false);
  const isEditingBreakRef = useRef(false);
  const preEditHistoryRef = useRef<HistoryEntry[] | null>(null);
  const preEditMatchRef = useRef<MatchState | null>(null);
  const endFrameRef = useRef<() => void>(() => {});
  const [pendingEndFrame, setPendingEndFrame] = useState(false);
  const [showMenuFrameEndStats, setShowMenuFrameEndStats] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [breaksPlayer, setBreaksPlayer] = useState<0 | 1 | null>(null);
  const [scoreboardConfig, setScoreboardConfig] =
    useState<ScoreboardConfig | null>(() => {
      const savedLocation = localStorage.getItem("scoreboardLocationName");
      const savedTable = localStorage.getItem("tableNumber");
      if (savedLocation || savedTable) {
        return {
          locationName: savedLocation || "",
          tableNumber: savedTable ? Number(savedTable) : null,
          namesListId: localStorage.getItem("scoreboardNamesListId"),
        };
      }
      return null;
    });
  const [playerList, setPlayerList] = useState<NamesListEntry[] | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<MatchAssignment | null>(null);

  // Practice mode state
  const [practicePlayer, setPracticePlayer] = useState<string | null>(null);
  const [showRoutinePicker, setShowRoutinePicker] = useState(false);
  const [soloSession, setSoloSession] = useState<SoloSessionState | null>(() => {
    const saved = sessionStorage.getItem("soloSession");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* ignore */
      }
    }
    return null;
  });
  const [showSoloMenu, setShowSoloMenu] = useState(false);
  const [showBreakEntry, setShowBreakEntry] = useState(false);
  const [showMultiEntry, setShowMultiEntry] = useState(false);
  const [showRedsConfig, setShowRedsConfig] = useState(false);
  const [multiDailyAttempts, setMultiDailyAttempts] = useState<Record<string, BreakAttempt[]>>(() => {
    try {
      const saved = sessionStorage.getItem("multiDailyAttempts");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    if (soloSession) {
      sessionStorage.setItem("soloSession", JSON.stringify(soloSession));
    } else {
      sessionStorage.removeItem("soloSession");
    }
  }, [soloSession]);

  useEffect(() => {
    sessionStorage.setItem("multiDailyAttempts", JSON.stringify(multiDailyAttempts));
  }, [multiDailyAttempts]);

  const deviceId = useRef(getDeviceId());

  // Persist match state to sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem("matchState", JSON.stringify(match));
  }, [match]);

  // Ping loop - every 30s
  useEffect(() => {
    let active = true;

    const doPing = async () => {
      const config = await pingScoreboard(deviceId.current);
      if (active && config) {
        setScoreboardConfig(config);

        // Persist location name
        if (config.locationName) {
          localStorage.setItem("scoreboardLocationName", config.locationName);
        }
        // Persist names list id
        if (config.namesListId) {
          localStorage.setItem("scoreboardNamesListId", config.namesListId);
        }

        // Update table number from config if set remotely
        if (config.tableNumber !== null) {
          setMatch((prev) => ({
            ...prev,
            tableNumber: String(config.tableNumber),
          }));
          localStorage.setItem("tableNumber", String(config.tableNumber));
        }
      }
    };

    doPing();
    const interval = setInterval(doPing, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch names list when config changes
  useEffect(() => {
    if (!scoreboardConfig?.namesListId) return;

    const cachedKey = `namesList_${scoreboardConfig.namesListId}`;
    const cached = localStorage.getItem(cachedKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setPlayerList(parsed.entries);
      } catch {
        /* ignore */
      }
    }

    fetchNamesList(scoreboardConfig.namesListId).then((entries) => {
      if (entries) {
        setPlayerList(entries);
        localStorage.setItem(
          cachedKey,
          JSON.stringify({ entries, ts: Date.now() })
        );
      }
    });
  }, [scoreboardConfig?.namesListId]);

  // Fetch pending assignment when setup is showing
  useEffect(() => {
    if (!showSetup || match.matchId) return;

    const tableNum = scoreboardConfig?.tableNumber ?? null;
    fetchPendingAssignment(tableNum, deviceId.current).then((a) => {
      setPendingAssignment(a);
    });
  }, [showSetup, match.matchId, scoreboardConfig?.tableNumber]);

  // Start an assigned match (called from SetupDialog button or auto-start)
  const startAssignedMatch = useCallback(
    async (a: MatchAssignment) => {
      const getIOC = (name: string) => {
        if (playerList) {
          const found = playerList.find((p) => p.playerName === name);
          if (found) return found.nationalityIOC;
        }
        return "";
      };

      const nat1 = getIOC(a.player1Name);
      const nat2 = getIOC(a.player2Name);

      const newState: MatchState = {
        ...createInitialMatchState(),
        players: [
          createPlayer(a.player1Name, nat1 || "SUI"),
          createPlayer(a.player2Name, nat2 || "SUI"),
        ],
        bestOf: a.bestOf,
      };

      if (a.handicap && a.handicap > 0) {
        newState.players[1].score = a.handicap;
      }

      const matchId = await createMatchV3({
        matchType: newState.matchType ?? "Trainings-Spiel",
        inputMode: inputModeToApi(newState.inputMode),
        redsCount: newState.redsCount ?? 15,
        bestOf: a.bestOf,
        players: [
          { name: a.player1Name, nationalityIOC: nat1 || "SUI" },
          {
            name: a.player2Name,
            nationalityIOC: nat2 || "SUI",
            startingHandicap: a.handicap && a.handicap > 0 ? a.handicap : 0,
          },
        ],
        tableNumber: newState.tableNumber ? Number(newState.tableNumber) : null,
        deviceId: deviceId.current,
        remoteRoomId: getRemoteRoomId(),
      });

      newState.matchId = matchId;

      setMatch(newState);
      setHistory([]);
      setRedoStack([]);
      setShowSetup(false);
      setActiveAssignmentId(a.id);
      setPendingAssignment(null);
      claimAssignment(a.id);
    },
    [playerList]
  );

  const pushHistory = useCallback(
    (label: string, state: MatchState, color?: string, extra?: Pick<HistoryEntry, "kind" | "playerIndex" | "points" | "frameNumber" | "breakBalls">) => {
      setHistory((prev) => [
        ...prev,
        { label, snapshot: JSON.stringify(state), color, timestamp: new Date().toISOString(), ...extra },
      ]);
      setRedoStack([]);
    },
    []
  );

  // ===== SETUP =====
  const handleSetupComplete = useCallback(
    async (
      name1: string,
      name2: string,
      nat1: string,
      nat2: string,
      club1: string,
      club2: string,
      bestOf: number,
      inputMode: "break" | "ballbyball" = "break",
      redsCount: number = 15,
      matchType: string = "Trainings-Spiel",
    ) => {
      const newState: MatchState = {
        ...createInitialMatchState(),
        players: [createPlayer(name1, nat1, club1), createPlayer(name2, nat2, club2)],
        bestOf,
        inputMode,
        redsCount,
        bbState: inputMode === "ballbyball" ? createBBState(redsCount) : null,
        matchType,
      };

      // Show scoreboard immediately, create match in background
      setMatch(newState);
      setHistory([]);
      setRedoStack([]);
      setPlayerColors([null, null]);
      setShowSetup(false);

      const matchId = await createMatchV3({
        matchType,
        inputMode: inputModeToApi(inputMode),
        redsCount,
        bestOf,
        players: [
          { name: name1, nationalityIOC: nat1, club: club1 },
          { name: name2, nationalityIOC: nat2, club: club2 },
        ],
        tableNumber: newState.tableNumber ? Number(newState.tableNumber) : null,
        deviceId: deviceId.current,
        remoteRoomId: getRemoteRoomId(),
      });

      if (matchId) {
        setMatch(prev => ({ ...prev, matchId }));
      }
    },
    []
  );

  // ===== ADD POINTS =====
  const addPoints = useCallback(
    (
      playerIndex: 0 | 1,
      points: number,
      isFoul: boolean,
      isHandicap: boolean,
      meta?: EvtMeta
    ) => {
      const label = isFoul
        ? `${match.players[playerIndex].name} - Foul ${points}`
        : isHandicap
        ? `${match.players[playerIndex].name} HC ${points}`
        : `${match.players[playerIndex].name} (${points})`;
      const [p1c, p2c] = playerColors;
      const playerColor = playerIndex === 0
        ? (resolvePlayerColor(p1c, p2c, true) ?? "#5599ff")
        : (resolvePlayerColor(p2c, p1c, false) ?? "#ff8833");
      pushHistory(label, match, playerColor, {
        kind: isHandicap ? "handicap" : isFoul ? "foul" : "break",
        playerIndex,
        points,
        frameNumber: match.currentFrame,
      });

      setMatch((prev) => {
        const next = structuredClone(prev);

        if (isFoul) {
          const opponentIndex = playerIndex === 0 ? 1 : 0;
          next.players[opponentIndex].score += points;
        } else {
          next.players[playerIndex].score += points;
          if (!isHandicap) {
            next.players[playerIndex].highbreaks = insertHighBreak(
              next.players[playerIndex].highbreaks,
              points
            );
          }
        }

        if (!isHandicap) {
          next.activePlayerIndex = next.activePlayerIndex === 0 ? 1 : 0;
        }

        if (next.matchId) {
          appendEventsV3(next.matchId, [
            {
              type: isHandicap ? "HANDICAP" : isFoul ? "FOUL" : "MANUAL_BREAK",
              frameNumber: next.currentFrame,
              playerIndex,
              points,
              state: frameSnap(next),
              ...withMeta(meta),
            },
          ]);
        }

        return next;
      });

      setCalcPlayer(null);
    },
    [match, pushHistory, playerColors]
  );

  // ===== BALL BY BALL =====
  const handleBBPot = useCallback((ball: BBBallType, meta?: EvtMeta) => {
    if (!match.bbState) return;
    const phaseBefore = match.bbState.phase;
    const result = applyPot(match.bbState, ball);
    const playerIdx = match.activePlayerIndex as 0 | 1;

    pushHistory(
      "",
      match, undefined,
      { kind: "break", playerIndex: playerIdx, points: result.points, frameNumber: match.currentFrame }
    );

    setMatch((prev) => {
      const next = structuredClone(prev);
      next.players[playerIdx].score += result.points;
      next.bbState = result.newState;
      if (next.matchId) {
        appendEventsV3(next.matchId, [
          {
            type: "POT",
            frameNumber: next.currentFrame,
            playerIndex: playerIdx,
            ballType: ballToApi(ball),
            points: result.points,
            isFreeBall: ball === "freeball",
            phase: phaseToApi(phaseBefore),
            redsRemaining: result.newState.redsRemaining,
            breakTotal: result.newState.breakTotal,
            state: frameSnap(next),
            ...withMeta(meta),
          },
        ]);
      }
      return next;
    });
  }, [match, pushHistory]);

  const handleBBFoul = useCallback((ball: BBBallColor, meta?: EvtMeta) => {
    isEditingBreakRef.current = false;
    preEditHistoryRef.current = null;
    preEditMatchRef.current = null;
    setIsEditingBreak(false);
    if (!match.bbState) return;
    const result = applyFoul(match.bbState, ball);
    const playerIdx = match.activePlayerIndex as 0 | 1;
    const opponentIdx = (playerIdx === 0 ? 1 : 0) as 0 | 1;
    const bbState = match.bbState;
    // The foul is committed by the active player; opponent receives the points.
    const foulEvent = (next: MatchState): V3EventInput => ({
      type: "FOUL",
      frameNumber: next.currentFrame,
      playerIndex: playerIdx,
      ballType: ballToApi(ball),
      points: result.points,
      freeBallGranted: result.newState.freeBallAvailable,
      state: frameSnap(next),
      ...withMeta(meta),
    });

    // After a foul the incoming player starts a fresh break — normalize phase back to red (or colors_only)
    const normalizedBBState = result.newState.phase === "color"
      ? result.newState.redsRemaining > 0
        ? { ...result.newState, phase: "red" as const }
        : { ...result.newState, phase: "colors_only" as const, colorsOnlyIndex: 0 }
      : result.newState;

    pushHistory(
      `${match.players[playerIdx].name} - Foul ${result.points}`,
      match, undefined,
      { kind: "foul", playerIndex: playerIdx, points: result.points, frameNumber: match.currentFrame }
    );

    // Foul when only the black remains → check for re-spotted black
    const isOnlyBlack = bbState.phase === "colors_only" && bbState.colorsOnlyIndex === 5;
    if (isOnlyBlack) {
      const newScore0 = match.players[0].score + (opponentIdx === 0 ? result.points : 0);
      const newScore1 = match.players[1].score + (opponentIdx === 1 ? result.points : 0);
      const tied = newScore0 === newScore1 && !bbState.respottedBlack;
      if (tied) {
        pushHistory(
          "Gleichstand – Re-spotted Black",
          match, undefined,
          { kind: "rerack", frameNumber: match.currentFrame }
        );
        setMatch((prev) => {
          const next = structuredClone(prev);
          next.players[opponentIdx].score += result.points;
          next.activePlayerIndex = opponentIdx;
          next.bbState = {
            ...bbState,
            freeBallAvailable: false,
            foulByPlayerIndex: playerIdx,
            breakBalls: [],
            breakTotal: 0,
            frameOver: false,
            respottedBlack: true,
          };
          if (next.matchId) {
            appendEventsV3(next.matchId, [
              foulEvent(next),
              { type: "RESPOTTED_BLACK", frameNumber: next.currentFrame, state: frameSnap(next), ...withMeta(meta) },
            ]);
          }
          return next;
        });
      } else {
        setMatch((prev) => {
          const next = structuredClone(prev);
          next.players[opponentIdx].score += result.points;
          next.activePlayerIndex = opponentIdx;
          next.bbState = { ...normalizedBBState, foulByPlayerIndex: playerIdx };
          if (next.matchId) {
            appendEventsV3(next.matchId, [foulEvent(next)]);
          }
          return next;
        });
        setShowMenuFrameEndStats(true);
      }
      setShowBBDialog(false);
      return;
    }

    setMatch((prev) => {
      const next = structuredClone(prev);
      next.players[opponentIdx].score += result.points;
      next.activePlayerIndex = opponentIdx;
      next.bbState = { ...normalizedBBState, foulByPlayerIndex: playerIdx };
      if (next.matchId) {
        appendEventsV3(next.matchId, [foulEvent(next)]);
      }
      return next;
    });
    setShowBBDialog(false);
  }, [match, pushHistory]);

  const handleBBCorrectReds = useCallback((newCount: number, meta?: EvtMeta) => {
    if (!match.bbState) return;
    const old = match.bbState.redsRemaining;
    const nextMatch = structuredClone(match);
    const currentPhase = nextMatch.bbState!.phase;
    nextMatch.bbState = { ...nextMatch.bbState!, redsRemaining: newCount };
    // If correcting to 0 while red is on, switch to colors_only starting at yellow
    if (newCount === 0 && currentPhase === "red") {
      nextMatch.bbState.phase = "colors_only";
      nextMatch.bbState.colorsOnlyIndex = 0;
    }
    pushHistory(
      `Korrektur: ${old}→${newCount} 🔴`,
      match,
      undefined,
      { kind: "correction", frameNumber: match.currentFrame }
    );
    if (nextMatch.matchId) {
      appendEventsV3(nextMatch.matchId, [
        {
          type: "CORRECT_REDS",
          frameNumber: nextMatch.currentFrame,
          oldReds: old,
          newReds: newCount,
          state: frameSnap(nextMatch),
          ...withMeta(meta),
        },
      ]);
    }
    setMatch(nextMatch);
    setShowBBDialog(false);
  }, [match, pushHistory]);

  // ===== FRAME END =====
  const endFrame = useCallback((meta?: EvtMeta) => {
    if (match.finished) return;
    const frameWinner = determineFrameWinner(match);
    if (frameWinner === null) return;

    const winnerName = match.players[frameWinner].name;
    const s0 = match.players[0].score;
    const s1 = match.players[1].score;
    const winScore = Math.max(s0, s1);
    const loseScore = Math.min(s0, s1);

    const framesAfter0 = match.players[0].frames + (frameWinner === 0 ? 1 : 0);
    const framesAfter1 = match.players[1].frames + (frameWinner === 1 ? 1 : 0);
    const totalFramesAfter = framesAfter0 + framesAfter1;

    const willMatchEnd = match.bestOf % 2 === 0
      ? totalFramesAfter >= match.bestOf
      : Math.max(framesAfter0, framesAfter1) >= framesToWin(match.bestOf);

    if (willMatchEnd) {
      if (framesAfter0 === framesAfter1) {
        pushHistory(`Unentschieden ${framesAfter0}:${framesAfter1}`, match, undefined, { kind: "frame_end", frameNumber: match.currentFrame });
      } else {
        const matchWinnerIdx = framesAfter0 > framesAfter1 ? 0 : 1;
        pushHistory(
          `${match.players[matchWinnerIdx].name} gewinnt Match ${Math.max(framesAfter0, framesAfter1)}:${Math.min(framesAfter0, framesAfter1)}`,
          match,
          undefined,
          { kind: "frame_end", frameNumber: match.currentFrame }
        );
      }
    } else {
      pushHistory(`${winnerName} gewinnt ${match.currentFrame}. Frame ${winScore}:${loseScore}`, match, undefined, { kind: "frame_end", frameNumber: match.currentFrame });
    }
    // Complete the assignment if the match ends naturally
    if (willMatchEnd && activeAssignmentId) {
      completeAssignment(activeAssignmentId);
      setActiveAssignmentId(null);
    }
    setMatch((prev) => {
      const next = structuredClone(prev);
      const winner = determineFrameWinner(next);

      if (winner !== null) {
        next.players[winner].frames += 1;
      }

      // Record the frame end (scores are still the final frame scores here).
      if (next.matchId) {
        appendEventsV3(next.matchId, [
          {
            type: "FRAME_END",
            frameNumber: next.currentFrame,
            state: {
              ...frameSnap(next),
              frameWinnerIndex: winner,
              framesP0: next.players[0].frames,
              framesP1: next.players[1].frames,
            },
            ...withMeta(meta),
          },
        ]);
      }

      // Check if match is over
      if (isMatchOver(next)) {
        const isDraw = next.players[0].frames === next.players[1].frames;
        const matchWinner = isDraw ? null : (next.players[0].frames > next.players[1].frames ? 0 : 1);
        if (matchWinner !== null) {
          next.players[matchWinner].winner = true;
        }
        next.finished = true;

        if (next.matchId) {
          appendEventsV3(next.matchId, [
            {
              type: "MATCH_END",
              frameNumber: next.currentFrame,
              state: {
                matchWinnerIndex: matchWinner,
                framesP0: next.players[0].frames,
                framesP1: next.players[1].frames,
              },
              ...withMeta(meta),
            },
          ]);
          patchMatchV3(next.matchId, {
            status: "FINISHED",
            winnerPlayerIndex: matchWinner,
            isDraw,
            bestOf: next.bestOf,
          });
        }
      } else {
        // Start new frame
        next.players[0].score = 0;
        next.players[1].score = 0;
        next.currentFrame += 1;

        // Alternate break
        if (next.bestOf % 2 === 1) {
          next.hasBreak = next.currentFrame % 2 === 1 ? 0 : 1;
        }
        next.activePlayerIndex = next.hasBreak;

        // Reset ball-by-ball state for new frame. The new frame row is created
        // server-side on its first event.
        if (next.inputMode === "ballbyball" && next.redsCount) {
          next.bbState = createBBState(next.redsCount);
        }
      }

      return next;
    });
    setShowMenu(false);
  }, [match, pushHistory, activeAssignmentId]);

  useEffect(() => { endFrameRef.current = endFrame; }, [endFrame]);

  // Deferred endFrame call: ensures endFrame runs AFTER React re-renders with updated scores
  useEffect(() => {
    if (pendingEndFrame) {
      setPendingEndFrame(false);
      endFrame();
    }
  }, [pendingEndFrame, endFrame]);

  const handleBBMiss = useCallback((meta?: EvtMeta) => {
    isEditingBreakRef.current = false;
    preEditHistoryRef.current = null;
    preEditMatchRef.current = null;
    setIsEditingBreak(false);
    const playerIdx = match.activePlayerIndex as 0 | 1;
    const opponentIdx = (playerIdx === 0 ? 1 : 0) as 0 | 1;
    const bbState = match.bbState;
    // A miss ends the current visit; the v3 MISS event closes the open break.
    const missEvent = (next: MatchState): V3EventInput => ({
      type: "MISS",
      frameNumber: next.currentFrame,
      playerIndex: playerIdx,
      breakTotal: bbState?.breakTotal ?? 0,
      state: frameSnap(next),
      ...withMeta(meta),
    });
    if (bbState && bbState.breakTotal > 0) {
      pushHistory(
        `${match.players[playerIdx].name} (${bbState.breakTotal})`,
        match, undefined,
        { kind: "break", playerIndex: playerIdx, points: bbState.breakTotal, frameNumber: match.currentFrame, breakBalls: bbState.breakBalls }
      );
    }
    if (bbState?.frameOver) {
      // Tie after last black → re-spot black (only once)
      if (match.players[0].score === match.players[1].score && !bbState.respottedBlack) {
        pushHistory(
          "Gleichstand – Re-spotted Black",
          match, undefined,
          { kind: "rerack", frameNumber: match.currentFrame }
        );
        setMatch((prev) => {
          const next = structuredClone(prev);
          if (next.bbState) {
            next.players[playerIdx].highbreaks = insertHighBreak(next.players[playerIdx].highbreaks, next.bbState.breakTotal);
            next.bbState = { ...next.bbState, frameOver: false, colorsOnlyIndex: 5, breakBalls: [], breakTotal: 0, respottedBlack: true };
          }
          if (next.matchId) {
            appendEventsV3(next.matchId, [
              missEvent(next),
              { type: "RESPOTTED_BLACK", frameNumber: next.currentFrame, state: frameSnap(next), ...withMeta(meta) },
            ]);
          }
          return next;
        });
        return;
      }
      // Record highbreak before frame ends, clear breakBalls so undo snapshot is clean
      setMatch((prev) => {
        const next = structuredClone(prev);
        if (next.bbState) {
          next.players[playerIdx].highbreaks = insertHighBreak(next.players[playerIdx].highbreaks, next.bbState.breakTotal);
          next.bbState = { ...next.bbState, breakBalls: [], breakTotal: 0 };
        }
        if (next.matchId) appendEventsV3(next.matchId, [missEvent(next)]);
        return next;
      });
      setShowMenuFrameEndStats(true);
      return;
    }
    // Only black remains and score diff > 7 → frame decided, end it
    if (bbState?.phase === "colors_only" && bbState.colorsOnlyIndex === 5) {
      const s0 = match.players[0].score;
      const s1 = match.players[1].score;
      if (Math.abs(s0 - s1) > 7) {
        setMatch((prev) => {
          const next = structuredClone(prev);
          if (next.bbState) {
            next.players[playerIdx].highbreaks = insertHighBreak(next.players[playerIdx].highbreaks, next.bbState.breakTotal);
            next.bbState = { ...next.bbState, breakBalls: [], breakTotal: 0 };
          }
          if (next.matchId) appendEventsV3(next.matchId, [missEvent(next)]);
          return next;
        });
        setShowMenuFrameEndStats(true);
        return;
      }
    }
    setMatch((prev) => {
      const next = structuredClone(prev);
      next.activePlayerIndex = opponentIdx;
      if (next.bbState) {
        // Record highbreak at break end with actual break total
        const breakTotal = next.bbState.breakTotal;
        next.players[playerIdx].highbreaks = insertHighBreak(next.players[playerIdx].highbreaks, breakTotal);
        const afterReset = resetBreak({ ...next.bbState, freeBallAvailable: false });
        if (afterReset.phase === "color" && afterReset.redsRemaining > 0) {
          // Break ended after a red with reds still remaining → next break starts on red
          next.bbState = { ...afterReset, phase: "red" };
        } else if (afterReset.phase === "color" && afterReset.redsRemaining === 0) {
          // Break ended after the last red without potting a color → next must start on lowest color (yellow)
          next.bbState = { ...afterReset, phase: "colors_only", colorsOnlyIndex: 0 };
        } else {
          next.bbState = afterReset;
        }
      }
      if (next.matchId) appendEventsV3(next.matchId, [missEvent(next)]);
      return next;
    });
  }, [match, pushHistory, endFrame, setShowMenuFrameEndStats]);

  // ===== RE-RACK =====
  const rerack = useCallback(() => {
    const frameHistory = history.filter(e => e.frameNumber === match.currentFrame);
    const firstRerackIdx = frameHistory.findIndex(e => e.kind === "rerack");
    const originalHC = firstRerackIdx >= 0
      ? frameHistory.slice(0, firstRerackIdx).filter(e => e.kind === "handicap")
      : frameHistory.filter(e => e.kind === "handicap");
    const hc0 = originalHC.filter(e => e.playerIndex === 0).reduce((s, e) => s + (e.points ?? 0), 0);
    const hc1 = originalHC.filter(e => e.playerIndex === 1).reduce((s, e) => s + (e.points ?? 0), 0);
    const [p1c, p2c] = playerColors;

    // Snapshot after rerack but before HC: scores = 0, bbState reset
    const snapPostRerack = structuredClone(match);
    snapPostRerack.players[0].score = 0;
    snapPostRerack.players[1].score = 0;
    if (snapPostRerack.bbState) snapPostRerack.bbState = createBBState(snapPostRerack.redsCount ?? 15);

    pushHistory("Re-rack", match, undefined, { kind: "rerack", frameNumber: match.currentFrame });
    if (hc0 > 0) {
      pushHistory(
        `${match.players[0].name} HC ${hc0}`, snapPostRerack,
        resolvePlayerColor(p1c, p2c, true) ?? "#5599ff",
        { kind: "handicap", playerIndex: 0, points: hc0, frameNumber: match.currentFrame }
      );
    }
    if (hc1 > 0) {
      // Snapshot for second HC entry: after first HC already applied
      const snapAfterHC0 = structuredClone(snapPostRerack);
      snapAfterHC0.players[0].score = hc0;
      pushHistory(
        `${match.players[1].name} HC ${hc1}`, snapAfterHC0,
        resolvePlayerColor(p2c, p1c, false) ?? "#ff8833",
        { kind: "handicap", playerIndex: 1, points: hc1, frameNumber: match.currentFrame }
      );
    }

    setMatch((prev) => {
      const next = structuredClone(prev);
      next.players[0].score = hc0;
      next.players[1].score = hc1;
      if (next.bbState) {
        next.bbState = createBBState(next.redsCount ?? 15);
      }

      if (next.matchId) {
        appendEventsV3(next.matchId, [
          {
            type: "RERACK",
            frameNumber: next.currentFrame,
            state: frameSnap(next),
            source: "DISPLAY",
          },
        ]);
      }

      return next;
    });
    setShowMenu(false);
  }, [match, history, playerColors, pushHistory]);

  // ===== EDIT LAST BREAK (ball-by-ball only) =====
  const handleEditLastBreak = useCallback((meta?: EvtMeta) => {
    preEditHistoryRef.current = history;
    preEditMatchRef.current = match;
    isEditingBreakRef.current = true;
    setIsEditingBreak(true);
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setMatch(JSON.parse(last.snapshot) as MatchState);
      return prev.slice(0, -1);
    });
    setShowBBDialog(true);
    if (match.matchId) {
      appendEventsV3(match.matchId, [
        {
          type: "EDIT_LAST_BREAK",
          frameNumber: match.currentFrame,
          state: frameSnap(match),
          ...withMeta(meta),
        },
      ]);
    }
  }, [history, match]);

  const handleCancelBreakEdit = useCallback(() => {
    if (isEditingBreakRef.current) {
      if (preEditHistoryRef.current) setHistory(preEditHistoryRef.current);
      if (preEditMatchRef.current) setMatch(preEditMatchRef.current);
      preEditHistoryRef.current = null;
      preEditMatchRef.current = null;
      isEditingBreakRef.current = false;
      setIsEditingBreak(false);
    }
    setShowBBDialog(false);
  }, []);

  // Confirms permanent removal of a break that was undone back to its start while editing
  const handleDeleteBreak = useCallback(() => {
    preEditHistoryRef.current = null;
    preEditMatchRef.current = null;
    isEditingBreakRef.current = false;
    setIsEditingBreak(false);
    setRedoStack([]);
    setShowBBDialog(false);
    if (match.matchId) {
      appendEventsV3(match.matchId, [
        {
          type: "DELETE_BREAK",
          frameNumber: match.currentFrame,
          state: frameSnap(match),
          source: "DISPLAY",
        },
      ]);
    }
  }, [match]);

  // ===== UNDO (ball-by-ball — used inside BBDialog edit mode) =====
  const undo = useCallback((meta?: EvtMeta) => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const restored = JSON.parse(last.snapshot) as MatchState;
    setRedoStack(rs => [...rs, { entries: [last], matchAfter: JSON.stringify(match) }]);
    setHistory(history.slice(0, -1));
    setMatch(restored);
    setShowMenu(false);

    if (restored.matchId) {
      appendEventsV3(restored.matchId, [
        {
          type: "UNDO",
          frameNumber: restored.currentFrame,
          playerIndex: restored.activePlayerIndex as 0 | 1,
          state: frameSnap(restored),
          ...withMeta(meta),
        },
      ]);
    }
  }, [history, match]);

  // ===== UNDO FULL (whole break — used from main menu) =====
  const undoFull = useCallback((meta?: EvtMeta) => {
    if (history.length === 0) return;
    const last = history[history.length - 1];

    // For a labeled entry, also remove all preceding empty-label entries of the same break
    let removeFrom = history.length - 1;
    if (last.label !== "") {
      while (removeFrom > 0 && history[removeFrom - 1].label === "") {
        removeFrom--;
      }
    }

    const removed = history.slice(removeFrom);
    const restored = JSON.parse(removed[0].snapshot) as MatchState;

    setRedoStack(rs => [...rs, { entries: removed, matchAfter: JSON.stringify(match) }]);
    setHistory(history.slice(0, removeFrom));
    setMatch(restored);
    setShowMenu(false);

    if (restored.matchId) {
      appendEventsV3(restored.matchId, [
        {
          type: "UNDO",
          frameNumber: restored.currentFrame,
          playerIndex: restored.activePlayerIndex as 0 | 1,
          state: frameSnap(restored),
          ...withMeta(meta),
        },
      ]);
    }
  }, [history, match]);

  // ===== REDO =====
  const redo = useCallback((meta?: EvtMeta) => {
    if (redoStack.length === 0) return;
    const top = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setHistory(h => [...h, ...top.entries]);
    const restored = JSON.parse(top.matchAfter) as MatchState;
    setMatch(restored);
    setShowMenu(false);
    if (restored.matchId) {
      appendEventsV3(restored.matchId, [
        {
          type: "REDO",
          frameNumber: restored.currentFrame,
          state: frameSnap(restored),
          ...withMeta(meta),
        },
      ]);
    }
  }, [redoStack]);

  // ===== MATCH END (EARLY) =====
  const endMatchEarly = useCallback(() => {
    pushHistory("Match End (Early)", match, undefined);
    setMatch((prev) => {
      const next = structuredClone(prev);

      const isDraw = next.players[0].frames === next.players[1].frames;
      const leader = next.players[0].frames > next.players[1].frames ? 0 : 1;

      if (!isDraw) {
        next.players[leader].winner = true;
      }
      next.finished = true;

      // Adjust bestOf to frames played
      const totalFrames = next.players[0].frames + next.players[1].frames;
      next.bestOf = totalFrames;

      if (next.matchId) {
        const matchWinner = isDraw ? null : (leader as 0 | 1);
        appendEventsV3(next.matchId, [
          {
            type: "MATCH_END",
            frameNumber: next.currentFrame,
            state: {
              matchWinnerIndex: matchWinner,
              framesP0: next.players[0].frames,
              framesP1: next.players[1].frames,
            },
            source: "DISPLAY",
          },
        ]);
        patchMatchV3(next.matchId, {
          status: "ABORTED",
          winnerPlayerIndex: matchWinner,
          isDraw,
          bestOf: next.bestOf,
        });
      }

      return next;
    });
    // Cancel active assignment (match ended without natural completion)
    if (activeAssignmentId) {
      cancelAssignment(activeAssignmentId);
      setActiveAssignmentId(null);
    }
    setShowMenu(false);
  }, [match, pushHistory, activeAssignmentId]);

  // ===== CHANGE BEST OF =====
  const changeBestOf = useCallback((newBestOf: number) => {
    const totalFrames = match.players[0].frames + match.players[1].frames;
    if (newBestOf < totalFrames) return;

    const willReopen = match.finished && !isMatchOver({ ...match, bestOf: newBestOf });

    setMatch((prev) => {
      const next = structuredClone(prev);
      next.bestOf = newBestOf;

      if (prev.finished && !isMatchOver(next)) {
        // Extend a finished match — unfinish and start new frame
        next.finished = false;
        next.players[0].winner = false;
        next.players[1].winner = false;
        next.players[0].score = 0;
        next.players[1].score = 0;
        next.currentFrame = totalFrames + 1;
        if (next.bestOf % 2 === 1) {
          next.hasBreak = next.currentFrame % 2 === 1 ? 0 : 1;
        }
        next.activePlayerIndex = next.hasBreak;
        if (next.inputMode === "ballbyball" && next.redsCount) {
          next.bbState = createBBState(next.redsCount);
        }
      } else if (!prev.finished && isMatchOver(next)) {
        // Reduced bestOf during a live game — finish the match now
        const isDraw = next.players[0].frames === next.players[1].frames;
        const matchWinner = isDraw ? null : (next.players[0].frames > next.players[1].frames ? 0 : 1);
        if (matchWinner !== null) next.players[matchWinner].winner = true;
        next.finished = true;
      }
      return next;
    });

    // When reopening a finished match, replace the "gewinnt Match" label with the actual frame score
    if (willReopen) {
      setHistory((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.kind !== "frame_end") return prev;
        try {
          const snap = JSON.parse(last.snapshot) as MatchState;
          const s0 = snap.players[0].score;
          const s1 = snap.players[1].score;
          const winScore = Math.max(s0, s1);
          const loseScore = Math.min(s0, s1);
          const winnerIdx = s0 >= s1 ? 0 : 1;
          const winnerName = snap.players[winnerIdx].name;
          const frameNum = last.frameNumber ?? snap.currentFrame;
          return [...prev.slice(0, -1), { ...last, label: `${winnerName} gewinnt ${frameNum}. Frame ${winScore}:${loseScore}` }];
        } catch {
          return prev;
        }
      });
    }

    setShowMenu(false);
  }, [match]);

  // ===== NEW GAME =====
  const newGame = useCallback(() => {
    setLastPlayerNames({
      name1: match.players[0].name,
      name2: match.players[1].name,
    });
    // Starting a new game over an unfinished match abandons it — record that.
    if (match.matchId && !match.finished) {
      appendEventsV3(match.matchId, [
        {
          type: "MATCH_ABANDONED",
          frameNumber: match.currentFrame,
          state: {
            ...frameSnap(match),
            framesP0: match.players[0].frames,
            framesP1: match.players[1].frames,
          },
          source: "DISPLAY",
        },
      ]);
      patchMatchV3(match.matchId, { status: "ABORTED" });
    }
    if (activeAssignmentId) {
      cancelAssignment(activeAssignmentId);
      setActiveAssignmentId(null);
    }
    setMatch(createInitialMatchState());
    setHistory([]);
    setRedoStack([]);
    setPlayerColors([null, null]);
    setShowSetup(true);
    setShowMenu(false);
  }, [match, activeAssignmentId]);

  // ===== PRACTICE MODE =====
  const handlePracticeStart = useCallback((playerName: string) => {
    setPracticePlayer(playerName);
    setShowRoutinePicker(true);
  }, []);

  const handleRoutinePicked = useCallback(
    (routineId: SoloRoutineId, redsCount: number) => {
      const name = practicePlayer || soloSession?.playerName || "Spieler";
      const routine = routineById(routineId);
      const fresh = createSoloSession(name, routineId, redsCount);

      // Show next screen immediately, create remote session in background
      setSoloSession({ ...fresh, remoteId: null });
      setShowRoutinePicker(false);
      setShowSetup(false);
      if (routine.mode === "break") {
        setShowMultiEntry(true);
      }

      const tableNum = scoreboardConfig?.tableNumber ?? null;
      createPracticeSession({
        playerName: name,
        routineId,
        routineName: routine.name,
        mode: routine.mode === "break" ? "BREAK" : "HITMISS",
        redsCount: fresh.mode === "break" ? fresh.redsCount : undefined,
        deviceId: deviceId.current,
        tableNumber: tableNum ?? undefined,
      }).then((remoteId) => {
        setSoloSession((prev) =>
          prev && prev.sessionId === fresh.sessionId
            ? { ...prev, remoteId }
            : prev
        );
      });
    },
    [practicePlayer, soloSession, scoreboardConfig]
  );

  const handleRoutinePickerCancel = useCallback(() => {
    if (practicePlayer) {
      setLastPlayerNames({
        name1: practicePlayer,
        name2: PRACTICE_MODE_VALUE,
      });
    }
    setShowRoutinePicker(false);
    setPracticePlayer(null);
    setShowSetup(true);
  }, [practicePlayer]);

  const handleHitMissShot = useCallback(
    (shot: SoloShot) => {
      if (!soloSession || soloSession.mode !== "hitmiss") return;
      setSoloSession((prev) =>
        prev && prev.mode === "hitmiss"
          ? { ...prev, shots: [...prev.shots, shot] }
          : prev
      );
      if (soloSession.remoteId) {
        addPracticeAttempts(soloSession.remoteId, [
          { kind: shot === "hit" ? "HIT" : "MISS" },
        ]);
      }
    },
    [soloSession]
  );

  const handleBreakSubmit = useCallback(
    (
      value: number,
      details?: { missType?: MissType; foulType?: FoulType; ball?: BallColor; pocket?: Pocket }
    ) => {
      if (!soloSession || soloSession.mode !== "break") return;
      const attempt: BreakAttempt = {
        kind: "break",
        value,
        missType: details?.missType,
        foulType: details?.foulType,
        ball: details?.ball,
        pocket: details?.pocket,
        timestamp: Date.now(),
      };
      setSoloSession((prev) =>
        prev && prev.mode === "break"
          ? { ...prev, attempts: [...prev.attempts, attempt] }
          : prev
      );
      if (soloSession.remoteId) {
        addPracticeAttempts(soloSession.remoteId, [breakAttemptToApi(attempt)]);
      }
      setShowBreakEntry(false);
    },
    [soloSession]
  );

  const handleClearance = useCallback(() => {
    if (!soloSession || soloSession.mode !== "break") return;
    const last = soloSession.attempts[soloSession.attempts.length - 1];
    if (!last || last.kind !== "break" || last.clearance) return;

    setSoloSession((prev) => {
      if (!prev || prev.mode !== "break") return prev;
      const attempts = [...prev.attempts];
      const lastAttempt = attempts[attempts.length - 1];
      if (lastAttempt.kind !== "break") return prev;
      attempts[attempts.length - 1] = { ...lastAttempt, clearance: true };
      return { ...prev, attempts };
    });

    if (soloSession.remoteId) {
      addPracticeAttempts(soloSession.remoteId, [{ kind: "CLEARED", value: 0 }]);
    }
  }, [soloSession]);

  const handleMissed = useCallback(() => {
    if (!soloSession || soloSession.mode !== "break") return;
    const attempt: BreakAttempt = {
      kind: "missed",
      timestamp: Date.now(),
    };
    setSoloSession((prev) =>
      prev && prev.mode === "break"
        ? { ...prev, attempts: [...prev.attempts, attempt] }
        : prev
    );
    if (soloSession.remoteId) {
      addPracticeAttempts(soloSession.remoteId, [breakAttemptToApi(attempt)]);
    }
  }, [soloSession]);

  const handleMultiCommit = useCallback(
    (attempts: BreakAttempt[]) => {
      if (!soloSession || soloSession.mode !== "break") return;
      if (soloSession.remoteId && attempts.length > 0) {
        addPracticeAttempts(
          soloSession.remoteId,
          attempts.map(breakAttemptToApi)
        );
      }
      if (soloSession.remoteId) {
        patchPracticeSession(soloSession.remoteId, { finished: true });
      }
      const key = `${soloSession.playerName}:${soloSession.routineId}:${soloSession.redsCount}`;
      setMultiDailyAttempts((prev) => ({
        ...prev,
        [key]: [...(prev[key] ?? []), ...attempts],
      }));
      setPracticePlayer(soloSession.playerName);
      setSoloSession(null);
      setShowMultiEntry(false);
      setShowRoutinePicker(true);
    },
    [soloSession]
  );

  const handleMultiNewSession = useCallback(() => {
    if (!soloSession || soloSession.mode !== "break") return;
    const key = `${soloSession.playerName}:${soloSession.routineId}:${soloSession.redsCount}`;
    setMultiDailyAttempts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [soloSession]);

  const handleMultiSaveAndNewSession = useCallback((attempts: BreakAttempt[]) => {
    if (!soloSession || soloSession.mode !== "break") return;
    if (soloSession.remoteId && attempts.length > 0) {
      addPracticeAttempts(soloSession.remoteId, attempts.map(breakAttemptToApi));
    }
    const key = `${soloSession.playerName}:${soloSession.routineId}:${soloSession.redsCount}`;
    setMultiDailyAttempts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [soloSession]);

  const handleRedsChange = useCallback(
    (reds: number) => {
      if (!soloSession || soloSession.mode !== "break") return;
      setSoloSession((prev) =>
        prev && prev.mode === "break" ? { ...prev, redsCount: reds } : prev
      );
      if (soloSession.remoteId) {
        patchPracticeSession(soloSession.remoteId, { redsCount: reds });
      }
      setShowRedsConfig(false);
    },
    [soloSession]
  );

  const handleSoloUndo = useCallback(() => {
    if (!soloSession) return;
    const hasEntries =
      soloSession.mode === "hitmiss"
        ? soloSession.shots.length > 0
        : soloSession.attempts.length > 0;
    if (!hasEntries) {
      setShowSoloMenu(false);
      return;
    }
    setSoloSession((prev) => {
      if (!prev) return prev;
      if (prev.mode === "hitmiss") {
        return { ...prev, shots: prev.shots.slice(0, -1) };
      }
      return { ...prev, attempts: prev.attempts.slice(0, -1) };
    });
    if (soloSession.remoteId) {
      deleteLastPracticeAttempt(soloSession.remoteId);
    }
    setShowSoloMenu(false);
  }, [soloSession]);

  const handleSoloReset = useCallback(() => {
    setShowSoloMenu(false);
    const prev = soloSession;
    if (!prev) return;

    if (prev.remoteId) {
      patchPracticeSession(prev.remoteId, { finished: true });
    }

    const routine = routineById(prev.routineId);
    const redsCount = prev.mode === "break" ? prev.redsCount : undefined;
    const fresh = createSoloSession(prev.playerName, prev.routineId, redsCount);

    // Show next screen immediately, create remote session in background
    setSoloSession({ ...fresh, remoteId: null });
    if (routine.mode === "break") {
      setShowMultiEntry(true);
    }

    createPracticeSession({
      playerName: prev.playerName,
      routineId: prev.routineId,
      routineName: routine.name,
      mode: routine.mode === "break" ? "BREAK" : "HITMISS",
      redsCount,
      deviceId: deviceId.current,
      tableNumber: scoreboardConfig?.tableNumber ?? undefined,
    }).then((newRemote) => {
      setSoloSession((cur) =>
        cur && cur.sessionId === fresh.sessionId
          ? { ...cur, remoteId: newRemote }
          : cur
      );
    });
  }, [scoreboardConfig, soloSession]);

  const handleSoloChangeRoutine = useCallback(() => {
    if (soloSession?.remoteId) {
      patchPracticeSession(soloSession.remoteId, { finished: true });
    }
    if (soloSession?.playerName) {
      setPracticePlayer(soloSession.playerName);
    }
    setSoloSession(null);
    setShowSoloMenu(false);
    setShowRoutinePicker(true);
  }, [soloSession]);

  const handleSoloEnd = useCallback(() => {
    if (soloSession?.remoteId) {
      patchPracticeSession(soloSession.remoteId, { finished: true });
    }
    // Pre-fill setup dialog for next time: same player, SOLO TRAINING already selected
    if (soloSession) {
      setLastPlayerNames({
        name1: soloSession.playerName,
        name2: PRACTICE_MODE_VALUE,
      });
    }
    setSoloSession(null);
    setPracticePlayer(null);
    setShowSoloMenu(false);
    setShowSetup(true);
  }, [soloSession]);

  // ===== SETTINGS =====
  const [centerName, setCenterName] = useState<string>(
    () => localStorage.getItem("centerName") || ""
  );

  const handleSettingsSave = useCallback(
    (tableNum: string, center: string) => {
      localStorage.setItem("tableNumber", tableNum);
      localStorage.setItem("centerName", center);
      setCenterName(center);
      setMatch((prev) => ({ ...prev, tableNumber: tableNum }));
      // Sync table number to server
      const num = Number(tableNum);
      if (num > 0) {
        import("./lib/api").then(({ updateTableNumber }) =>
          updateTableNumber(deviceId.current, num)
        );
      }
    },
    []
  );

  // ===== REMOTE SCORER (phone) =====
  const effColors: [string, string] = [
    resolvePlayerColor(playerColors[0], playerColors[1], true) ?? "#5599ff",
    resolvePlayerColor(playerColors[1], playerColors[0], false) ?? "#ff8833",
  ];

  const dispatchRemote = useCallback(
    (cmd: RemoteCommand & { fromPlayerIndex?: 0 | 1 }) => {
      // Tag every remote-originated action with the controlling player's phone.
      const meta: EvtMeta =
        cmd.fromPlayerIndex === 0 || cmd.fromPlayerIndex === 1
          ? { source: "REMOTE_PHONE", remotePlayerIndex: cmd.fromPlayerIndex }
          : undefined;
      switch (cmd.t) {
        case "bb_pot": handleBBPot(cmd.ball, meta); setShowBBDialog(true); break;
        case "bb_foul": handleBBFoul(cmd.ball, meta); break;
        case "bb_miss": handleBBMiss(meta); break;
        case "bb_correct_reds": handleBBCorrectReds(cmd.count, meta); break;
        case "add_points": addPoints(cmd.playerIndex, cmd.points, cmd.isFoul, cmd.isHandicap, meta); break;
        case "switch_player":
          setMatch((prev) => {
            const next = { ...prev, activePlayerIndex: cmd.playerIndex };
            if (next.matchId) {
              appendEventsV3(next.matchId, [
                {
                  type: "SWITCH_PLAYER",
                  frameNumber: next.currentFrame,
                  playerIndex: cmd.playerIndex,
                  state: frameSnap(next),
                  ...withMeta(meta),
                },
              ]);
            }
            return next;
          });
          break;
        case "undo": undoFull(meta); break;
        case "redo": redo(meta); break;
        case "end_frame": endFrame(meta); break;
        case "edit_last_break": handleEditLastBreak(meta); break;
      }
    },
    [handleBBPot, handleBBFoul, handleBBMiss, handleBBCorrectReds, addPoints, undoFull, endFrame, handleEditLastBreak, redo]
  );
  const dispatchRef = useRef(dispatchRemote);
  useEffect(() => {
    dispatchRef.current = dispatchRemote;
  }, [dispatchRemote]);

  const remote = useRemoteHost({ match, colors: effColors, redoAvailable: redoStack.length > 0, dispatchRef });
  const [remoteModalPlayer, setRemoteModalPlayer] = useState<0 | 1 | null>(null);

  const isFrameStart =
    match.players[0].score === 0 && match.players[1].score === 0;

  const isFrameTied = match.players[0].score === match.players[1].score;

  const canEndMatchEarly =
    !match.finished &&
    isFrameStart &&
    match.currentFrame > 1;

  return (
    <>
      {soloSession ? (
        <SoloSession
          session={soloSession}
          onHitMissShot={handleHitMissShot}
          onUndo={handleSoloUndo}
          onChangeRoutine={handleSoloChangeRoutine}
          onMenuClick={() => setShowSoloMenu(true)}
        />
      ) : (
        <Scoreboard
          match={match}
          onPlayerClick={(idx) => {
            if (match.finished) return;
            if (match.inputMode === "ballbyball") {
              const bb = match.bbState;
              const autoFrameOver = !!bb && bb.phase === "colors_only" && bb.colorsOnlyIndex === 5
                && !bb.frameOver && bb.breakTotal === 0 && Math.abs(match.players[0].score - match.players[1].score) > 7;
              setMatch(prev => {
                const next: MatchState = {
                  ...prev,
                  activePlayerIndex: idx as 0 | 1,
                  bbState: autoFrameOver && prev.bbState ? { ...prev.bbState, frameOver: true } : prev.bbState,
                };
                if (next.matchId && prev.activePlayerIndex !== idx) {
                  appendEventsV3(next.matchId, [
                    {
                      type: "SWITCH_PLAYER",
                      frameNumber: next.currentFrame,
                      playerIndex: idx as 0 | 1,
                      state: frameSnap(next),
                      source: "DISPLAY",
                    },
                  ]);
                }
                return next;
              });
              setShowBBDialog(true);
            } else {
              setCalcPlayer(idx as 0 | 1);
            }
          }}
          onMenuClick={() => setShowMenu(true)}
          onBreaksClick={(idx) => setBreaksPlayer(idx as 0 | 1)}
          onCenterClick={history.length > 0 ? () => setShowStats(true) : undefined}
          history={history}
          onEditLastBreak={
            match.inputMode === "ballbyball" && !match.finished &&
            history.length > 0 && history[history.length - 1].kind === "break" && history[history.length - 1].label !== ""
              ? handleEditLastBreak
              : undefined
          }
          centerName={centerName || undefined}
          matchStartTime={history[0]?.timestamp}
          matchEndTime={match.finished ? history[history.length - 1]?.timestamp : undefined}
          matchFinished={match.finished}
          playerColors={playerColors}
          onColorChange={(idx, color) => setPlayerColors(prev => idx === 0 ? [color, prev[1]] : [prev[0], color])}
          onRemoteClick={(idx) => {
            remote.ensureSession(idx as 0 | 1);
            setRemoteModalPlayer(idx as 0 | 1);
          }}
          remoteConnected={remote.connected}
        />
      )}

      {showSetup && !soloSession && !showRoutinePicker && (
        <SetupDialog
          onComplete={handleSetupComplete}
          onPracticeStart={handlePracticeStart}
          defaultBestOf={match.bestOf}
          defaultName1={lastPlayerNames?.name1}
          defaultName2={lastPlayerNames?.name2}
          defaultInputMode={match.inputMode}
          defaultRedsCount={match.redsCount}
          playerList={playerList}
          pendingAssignment={pendingAssignment}
          onStartAssignment={startAssignedMatch}
          onSettingsClick={() => setShowSettings(true)}
        />
      )}

      {showRoutinePicker && (
        <RoutinePickerDialog
          playerName={practicePlayer || soloSession?.playerName || "Spieler"}
          onStart={handleRoutinePicked}
          onCancel={handleRoutinePickerCancel}
        />
      )}

      {showSoloMenu && soloSession && (
        <SoloMenuDialog
          session={soloSession}
          onUndo={handleSoloUndo}
          onChangeRoutine={handleSoloChangeRoutine}
          onResetSession={handleSoloReset}
          onEndPractice={handleSoloEnd}
          onClose={() => setShowSoloMenu(false)}
        />
      )}

      {showBreakEntry && soloSession && soloSession.mode === "break" && (
        <BreakEntryDialog
          playerName={soloSession.playerName}
          onSubmit={handleBreakSubmit}
          onClose={() => setShowBreakEntry(false)}
        />
      )}

      {showMultiEntry && soloSession && soloSession.mode === "break" && (
        <MultiEntryDialog
          playerName={soloSession.playerName}
          routineId={soloSession.routineId}
          redsCount={soloSession.redsCount}
          initialAttempts={multiDailyAttempts[`${soloSession.playerName}:${soloSession.routineId}:${soloSession.redsCount}`] ?? []}
          onNewSession={handleMultiNewSession}
          onSaveAndNewSession={handleMultiSaveAndNewSession}
          onCommit={handleMultiCommit}
          onClose={() => {
            if (soloSession.remoteId) {
              patchPracticeSession(soloSession.remoteId, { finished: true });
            }
            setPracticePlayer(soloSession.playerName);
            setSoloSession(null);
            setShowMultiEntry(false);
            setShowRoutinePicker(true);
          }}
        />
      )}

      {showRedsConfig && soloSession && soloSession.mode === "break" && (
        <RedsConfigDialog
          current={soloSession.redsCount}
          onSave={handleRedsChange}
          onClose={() => setShowRedsConfig(false)}
        />
      )}

      {showBBDialog && match.bbState && (
        <BallByBallDialog
          playerName={match.players[match.activePlayerIndex].name}
          playerIndex={match.activePlayerIndex as 0 | 1}
          bbState={match.bbState}
          onPot={handleBBPot}
          onFoul={handleBBFoul}
          onMiss={handleBBMiss}
          onUndo={undo}
          onRedo={redoStack.length > 0 && redoStack[redoStack.length - 1].entries.length === 1 && redoStack[redoStack.length - 1].entries[0].label === "" ? redo : undefined}
          onCorrectReds={handleBBCorrectReds}
          onClose={handleCancelBreakEdit}
          isEditMode={isEditingBreak}
          onCancelEdit={handleCancelBreakEdit}
          onDeleteBreak={handleDeleteBreak}
          frameScores={[match.players[0].score, match.players[1].score]}
          opponentName={match.players[1 - match.activePlayerIndex].name}
          frameNumber={match.currentFrame}
          frameHistory={history.filter(e => e.frameNumber === match.currentFrame)}
          playerColors={[
            resolvePlayerColor(playerColors[0], playerColors[1], true) ?? "#5599ff",
            resolvePlayerColor(playerColors[1], playerColors[0], false) ?? "#ff8833",
          ]}
          onHandicap={(idx, pts) => addPoints(idx, pts, false, true)}
        />
      )}

      {calcPlayer !== null && (
        <CalculatorDialog
          playerName={match.players[calcPlayer].name}
          playerIndex={calcPlayer}
          showHandicap={isFrameStart}
          onSubmit={addPoints}
          onClose={() => setCalcPlayer(null)}
        />
      )}

      {showMenu && (
        <MenuDialog
          onUndo={history.length > 0 ? undoFull : undefined}
          onRedo={redoStack.length > 0 ? redo : undefined}
          onFrameEnd={match.finished ? undefined : () => setShowMenuFrameEndStats(true)}
          isFrameTied={isFrameTied}
          onRerack={rerack}
          onMatchEnd={canEndMatchEarly ? endMatchEarly : undefined}
          onNewGame={newGame}
          onClose={() => setShowMenu(false)}
          matchFinished={match.finished}
          hasEntries={history.length > 0}
          frameLeader={
            match.players[0].score >= match.players[1].score
              ? match.players[0].name
              : match.players[1].name
          }
          matchLeader={
            match.players[0].frames >= match.players[1].frames
              ? match.players[0].name
              : match.players[1].name
          }
          framesP1={match.players[0].frames}
          framesP2={match.players[1].frames}
          nameP1={match.players[0].name}
          nameP2={match.players[1].name}
          colorP1={resolvePlayerColor(playerColors[0], playerColors[1], true) ?? "#5599ff"}
          colorP2={resolvePlayerColor(playerColors[1], playerColors[0], false) ?? "#ff8833"}
          bestOf={match.bestOf}
          isFrameStart={isFrameStart}
          onChangeBestOf={changeBestOf}
        />
      )}

      {showMenuFrameEndStats && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ background: "#1e1e1e", border: "1px solid #555", borderRadius: "14px", padding: "4vh 4vw", display: "flex", flexDirection: "column", gap: "2vh", alignItems: "center", minWidth: "62vw" }}>
            <div style={{ color: "#fff", fontSize: "2.2vw", fontWeight: "bold" }}>{match.currentFrame}. Frame beenden?</div>
            {/* Score */}
            <div style={{ width: "100%", background: "#111", borderRadius: "10px", padding: "2vh 2vw", display: "flex", alignItems: "center", gap: "1vw" }}>
              {(() => {
                const s0 = match.players[0].score;
                const s1 = match.players[1].score;
                const p0wins = s0 > s1;
                const p1wins = s1 > s0;
                const effCol0 = resolvePlayerColor(playerColors[0], playerColors[1], true) ?? "#5599ff";
                const effCol1 = resolvePlayerColor(playerColors[1], playerColors[0], false) ?? "#ff8833";
                return (
                  <>
                    <span style={{ flex: 1, textAlign: "left", color: effCol0, fontSize: "1.8vw", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {match.players[0].name}{p0wins && " 🏆"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", background: "#222", borderRadius: "8px", padding: "0.8vh 1.5vw" }}>
                      <span style={{ color: p0wins ? "#ffee44" : "#888", fontSize: "3vw", fontWeight: "bold" }}>{s0}</span>
                      <span style={{ color: "#555", fontSize: "1.8vw" }}>:</span>
                      <span style={{ color: p1wins ? "#ffee44" : "#888", fontSize: "3vw", fontWeight: "bold" }}>{s1}</span>
                    </div>
                    <span style={{ flex: 1, textAlign: "right", color: effCol1, fontSize: "1.8vw", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p1wins && "🏆 "}{match.players[1].name}
                    </span>
                  </>
                );
              })()}
            </div>
            {/* Frame stats */}
            {(() => {
              const fh = history.filter(e => e.frameNumber === match.currentFrame);
              const hBreaks0 = fh.filter(e => e.kind === "break" && e.playerIndex === 0 && (e.points ?? 0) > 7).map(e => e.points!).sort((a, b) => b - a);
              const hBreaks1 = fh.filter(e => e.kind === "break" && e.playerIndex === 1 && (e.points ?? 0) > 7).map(e => e.points!).sort((a, b) => b - a);
              const fouls0 = fh.filter(e => e.kind === "foul" && e.playerIndex === 0).reduce((s, e) => s + (e.points ?? 0), 0);
              const fouls1 = fh.filter(e => e.kind === "foul" && e.playerIndex === 1).reduce((s, e) => s + (e.points ?? 0), 0);
              const hc0 = fh.filter(e => e.kind === "handicap" && e.playerIndex === 0).reduce((s, e) => s + (e.points ?? 0), 0);
              const hc1 = fh.filter(e => e.kind === "handicap" && e.playerIndex === 1).reduce((s, e) => s + (e.points ?? 0), 0);
              const showHandicap = hc0 > 0 || hc1 > 0;
              const reracks = fh.filter(e => e.kind === "rerack").length;
              const corrections = fh.filter(e => e.kind === "correction");
              const startTs = fh.find(e => e.timestamp)?.timestamp;
              const effCol0 = resolvePlayerColor(playerColors[0], playerColors[1], true) ?? "#5599ff";
              const effCol1 = resolvePlayerColor(playerColors[1], playerColors[0], false) ?? "#ff8833";
              const durationStr = startTs ? (() => {
                const ms = Date.now() - new Date(startTs).getTime();
                const tot = Math.floor(ms / 1000);
                const h = Math.floor(tot / 3600);
                const m = Math.floor((tot % 3600) / 60);
                const s = tot % 60;
                return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
              })() : null;
              return (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.2vh", borderTop: "1px solid #333", paddingTop: "1.5vh" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto 1fr", columnGap: "0.6vw", rowGap: "0.35vh", fontSize: "1.35vw", alignItems: "baseline" }}>
                    <div style={{ gridColumn: "1 / 3", color: effCol0, fontWeight: "bold", fontSize: "1.2vw", paddingBottom: "0.15vh" }}>{match.players[0].name}</div>
                    <div style={{ gridColumn: "3 / 5", color: effCol1, fontWeight: "bold", fontSize: "1.2vw", paddingBottom: "0.15vh" }}>{match.players[1].name}</div>
                    <div style={{ color: "#ccc" }}>Breaks &gt;7:</div>
                    <div style={{ color: effCol0 }}>{hBreaks0.join(", ") || "—"}</div>
                    <div style={{ color: "#ccc" }}>Breaks &gt;7:</div>
                    <div style={{ color: effCol1 }}>{hBreaks1.join(", ") || "—"}</div>
                    <div style={{ color: "#ccc" }}>Foulpunkte:</div>
                    <div style={{ color: "#ff4444" }}>{fouls0}</div>
                    <div style={{ color: "#ccc" }}>Foulpunkte:</div>
                    <div style={{ color: "#ff4444" }}>{fouls1}</div>
                    {showHandicap && (
                      <>
                        <div style={{ color: "#ccc" }}>Handicap:</div>
                        <div style={{ color: "#c87832" }}>{hc0}</div>
                        <div style={{ color: "#ccc" }}>Handicap:</div>
                        <div style={{ color: "#c87832" }}>{hc1}</div>
                      </>
                    )}
                    {(durationStr || reracks > 0) && (
                      <>
                        <div style={{ color: "#aaa" }}>{durationStr ? "⏱ Framedauer:" : ""}</div>
                        <div style={{ color: "#fff" }}>{durationStr ? <strong>{durationStr}</strong> : ""}</div>
                        <div style={{ color: "#ffa040" }}>{reracks > 0 ? "🔴 Re-racks:" : ""}</div>
                        <div style={{ color: "#ffa040" }}>{reracks > 0 ? reracks : ""}</div>
                      </>
                    )}
                    {corrections.map((e, i) => (
                      <div key={`corr-${i}`} style={{ gridColumn: "1 / 5", color: "#f0c040" }}>{e.label}</div>
                    ))}
                  </div>
                  {(() => {
                    const svgW = 500, svgH = 150, px = 32, py = 20;
                    const cW = svgW - 2 * px, cH = svgH - 2 * py;
                    const fs0 = match.players[0].score, fs1 = match.players[1].score;
                    if (fs0 === 0 && fs1 === 0) return null;
                    const yMax = Math.max(fs0, fs1) + 5;
                    const lastRerackIdx = fh.reduce((idx, e, i) => e.kind === "rerack" ? i : idx, -1);
                    const eventsAfterRerack = lastRerackIdx >= 0 ? fh.slice(lastRerackIdx + 1) : fh;
                    const initHC0 = eventsAfterRerack.filter(e => e.kind === "handicap" && e.playerIndex === 0).reduce((s, e) => s + (e.points ?? 0), 0);
                    const initHC1 = eventsAfterRerack.filter(e => e.kind === "handicap" && e.playerIndex === 1).reduce((s, e) => s + (e.points ?? 0), 0);
                    const scoreData: Array<{ s: [number, number]; b?: 0 | 1; f?: 0 | 1 }> = [{ s: [initHC0, initHC1] }];
                    let acc0 = initHC0, acc1 = initHC1;
                    for (const e of eventsAfterRerack) {
                      if (e.kind === "handicap") continue;
                      let n0 = acc0, n1 = acc1;
                      if (e.kind === "break") {
                        if (e.playerIndex === 0) n0 = Math.min(fs0, acc0 + (e.points ?? 0));
                        else if (e.playerIndex === 1) n1 = Math.min(fs1, acc1 + (e.points ?? 0));
                      } else if (e.kind === "foul") {
                        if (e.playerIndex === 0) n1 = Math.min(fs1, acc1 + (e.points ?? 0));
                        else if (e.playerIndex === 1) n0 = Math.min(fs0, acc0 + (e.points ?? 0));
                      } else {
                        continue;
                      }
                      if (n0 >= acc0 && n1 >= acc1 && (n0 !== acc0 || n1 !== acc1)) {
                        acc0 = n0; acc1 = n1;
                        const isFoul = e.kind === "foul";
                        scoreData.push({
                          s: [acc0, acc1],
                          b: !isFoul ? (e.playerIndex as 0 | 1) : undefined,
                          f: isFoul ? (e.playerIndex === 0 ? 1 : 0) : undefined,
                        });
                      }
                    }
                    const last = scoreData[scoreData.length - 1];
                    if (last.s[0] !== fs0 || last.s[1] !== fs1) scoreData.push({ s: [fs0, fs1] });
                    const firstEvent = eventsAfterRerack.find(e => e.kind === "break" || e.kind === "foul");
                    const p0First = firstEvent ? (firstEvent.kind === "break" ? firstEvent.playerIndex === 0 : firstEvent.playerIndex === 1) : true;
                    const n = scoreData.length;
                    const toX = (i: number) => px + (n > 1 ? (i / (n - 1)) * cW : cW / 2);
                    const toY = (score: number) => py + cH - (score / yMax) * cH;
                    const pts0 = scoreData.map((pt, i) => `${toX(i).toFixed(1)},${toY(pt.s[0]).toFixed(1)}`).join(" ");
                    const pts1 = scoreData.map((pt, i) => `${toX(i).toFixed(1)},${toY(pt.s[1]).toFixed(1)}`).join(" ");
                    const midY = toY(Math.max(fs0, fs1) / 2);
                    const col0 = effCol0;
                    const col1 = effCol1;
                    const lastX = toX(n - 1);
                    const lastY0 = toY(fs0);
                    const lastY1 = toY(fs1);
                    const lcMin = 14;
                    const lcGap0 = initHC0 > 0 && initHC1 === 0 ? toY(0) - toY(initHC0) : Infinity;
                    const lcGap1 = initHC1 > 0 && initHC0 === 0 ? toY(0) - toY(initHC1) : Infinity;
                    const lcHC0y = lcGap0 < lcMin ? (toY(initHC0) + toY(0)) / 2 - lcMin / 2 : toY(initHC0);
                    const lcHC1y = lcGap1 < lcMin ? (toY(initHC1) + toY(0)) / 2 - lcMin / 2 : toY(initHC1);
                    const lcZ1y  = lcGap0 < lcMin ? (toY(initHC0) + toY(0)) / 2 + lcMin / 2 : toY(0);
                    const lcZ0y  = lcGap1 < lcMin ? (toY(initHC1) + toY(0)) / 2 + lcMin / 2 : toY(0);
                    const rcGap = Math.abs(lastY0 - lastY1);
                    const rcMid = (lastY0 + lastY1) / 2;
                    const rcFs0y = rcGap < lcMin ? (lastY0 <= lastY1 ? rcMid - lcMin / 2 : rcMid + lcMin / 2) : lastY0;
                    const rcFs1y = rcGap < lcMin ? (lastY0 <= lastY1 ? rcMid + lcMin / 2 : rcMid - lcMin / 2) : lastY1;
                    return (
                      <div style={{ width: "100%", background: "#111", borderRadius: "8px", padding: "0.5vh 0.3vw" }}>
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", display: "block", overflow: "visible" }}>
                          <text x={svgW / 2} y={toY(Math.max(fs0, fs1)) / 2} textAnchor="middle" dominantBaseline="middle" fontSize={15} fill="#666">Frameverlauf</text>
                          <line x1={4} y1={toY(Math.max(fs0, fs1))} x2={svgW - 4} y2={toY(Math.max(fs0, fs1))} stroke="#383838" strokeWidth="1.5" strokeDasharray="6,4" />
                          <line x1={4} y1={midY} x2={svgW - 4} y2={midY} stroke="#383838" strokeWidth="1.5" strokeDasharray="6,4" />
                          <line x1={4} y1={toY(0)} x2={svgW - 4} y2={toY(0)} stroke="#383838" strokeWidth="1.5" strokeDasharray="6,4" />
                          {initHC0 > 0 && <text x={px - 4} y={lcHC0y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={col0}>{initHC0}</text>}
                          {initHC1 > 0 && <text x={px - 4} y={lcHC1y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={col1}>{initHC1}</text>}
                          {initHC0 === 0 && initHC1 > 0 && <text x={px - 4} y={lcZ0y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={col0}>0</text>}
                          {initHC1 === 0 && initHC0 > 0 && <text x={px - 4} y={lcZ1y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={col1}>0</text>}
                          {initHC0 === 0 && initHC1 === 0 && <text x={px - 4} y={toY(0) - lcMin / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={p0First ? col0 : col1}>0</text>}
                          {initHC0 === 0 && initHC1 === 0 && <text x={px - 4} y={toY(0) + lcMin / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={p0First ? col1 : col0}>0</text>}
                          <polyline points={pts0} fill="none" stroke={col0} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          <polyline points={pts1} fill="none" stroke={col1} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          {scoreData.map((pt, i) => pt.b === 0 ? <circle key={`b0-${i}`} cx={toX(i)} cy={toY(pt.s[0])} r={3} fill={col0} /> : null)}
                          {scoreData.map((pt, i) => pt.b === 1 ? <circle key={`b1-${i}`} cx={toX(i)} cy={toY(pt.s[1])} r={3} fill={col1} /> : null)}
                          {scoreData.map((pt, i) => pt.f === 0 ? <circle key={`f0-${i}`} cx={toX(i)} cy={toY(pt.s[0])} r={3} fill={col1} /> : null)}
                          {scoreData.map((pt, i) => pt.f === 1 ? <circle key={`f1-${i}`} cx={toX(i)} cy={toY(pt.s[1])} r={3} fill={col0} /> : null)}
                          <circle cx={lastX} cy={lastY0} r={4} fill={col0} />
                          <circle cx={lastX} cy={lastY1} r={4} fill={col1} />
                          <text x={lastX + 7} y={rcFs0y} textAnchor="start" dominantBaseline="middle" fontSize={12} fill={col0}>{fs0}</text>
                          <text x={lastX + 7} y={rcFs1y} textAnchor="start" dominantBaseline="middle" fontSize={12} fill={col1}>{fs1}</text>
                          <text x={svgW + 8} y={svgH - py} textAnchor="start" dominantBaseline="middle" fontSize={14} fill="#666">0</text>
                          <text x={svgW + 8} y={midY} textAnchor="start" dominantBaseline="middle" fontSize={14} fill="#666">{Math.floor(Math.max(fs0, fs1) / 2)}</text>
                          <text x={svgW + 8} y={toY(Math.max(fs0, fs1))} textAnchor="start" dominantBaseline="middle" fontSize={14} fill="#666">{Math.max(fs0, fs1)}</text>
                        </svg>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: "1.5vw", width: "100%" }}>
              <button
                className="bbb-btn-cancel"
                onClick={() => { setShowMenuFrameEndStats(false); setShowMenu(false); }}
                style={{ flex: 1, background: "#3a1a1a", color: "#ff4444", border: "1px solid #553333", borderRadius: "8px", padding: "1.5vh 0", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => { setShowMenuFrameEndStats(false); endFrame(); setShowMenu(false); }}
                className="frame-end-btn-glow"
                style={{ flex: 1, background: "#1a5c1a", color: "#4ade80", border: "2.5px solid #4ade80", borderRadius: "8px", padding: "1.5vh 0", fontSize: "1.7vw", fontWeight: "bold", cursor: "pointer" }}
              >
                Frame beenden
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsDialog
          currentTableNumber={match.tableNumber}
          currentCenterName={centerName}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}

      {breaksPlayer !== null && match.matchId && (
        <BreaksDialog
          matchId={match.matchId}
          playerIndex={breaksPlayer}
          playerName={match.players[breaksPlayer].name}
          onClose={() => setBreaksPlayer(null)}
        />
      )}

      {showStats && (
        <MatchStatsDialog
          history={history}
          matchStartedAt={match.startedAt ?? null}
          nameP1={match.players[0].name}
          nameP2={match.players[1].name}
          iocP1={match.players[0].nationalityIOC}
          iocP2={match.players[1].nationalityIOC}
          bestOf={match.bestOf}
          framesP1={match.players[0].frames}
          framesP2={match.players[1].frames}
          currentFrame={match.currentFrame}
          currentScores={[match.players[0].score, match.players[1].score]}
          colorP1={resolvePlayerColor(playerColors[0], playerColors[1], true) ?? "#5599ff"}
          colorP2={resolvePlayerColor(playerColors[1], playerColors[0], false) ?? "#ff8833"}
          onClose={() => setShowStats(false)}
        />
      )}

      {remoteModalPlayer !== null && (() => {
        const rp = remoteModalPlayer;
        return (
          <RemoteQRDialog
            playerName={match.players[rp].name}
            playerColor={effColors[rp]}
            url={remote.urlFor(rp)}
            connected={remote.connected[rp]}
            onRegenerate={() => remote.rotateSession(rp)}
            onClose={() => setRemoteModalPlayer(null)}
          />
        );
      })()}
    </>
  );
}
