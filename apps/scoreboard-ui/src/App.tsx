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
  createMatch,
  createPracticeSession,
  deleteLastPracticeAttempt,
  fetchNamesList,
  fetchPendingAssignment,
  getDeviceId,
  patchPracticeSession,
  pingScoreboard,
  sendFrameAction,
  updateMatch,
  type MatchAssignment,
  type NamesListEntry,
  type ScoreboardConfig,
} from "./lib/api";
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
import {
  breakAttemptToApi,
  createSoloSession,
  routineById,
  type BallColor,
  type BreakAttempt,
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
  kind?: "break" | "foul" | "handicap" | "frame_end" | "rerack";
  playerIndex?: 0 | 1;
  points?: number;
  frameNumber?: number;
  timestamp?: string;
  breakBalls?: Array<{ hex: string; points: number }>;
};

type RedoEntry = {
  entry: HistoryEntry;
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
  const pendingEditFoulRef = useRef<{ opponentIdx: 0 | 1; foulPts: number } | null>(null);
  const endFrameRef = useRef<() => void>(() => {});
  const [pendingEndFrame, setPendingEndFrame] = useState(false);
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

      const matchId = await createMatch({
        players: [
          { name: a.player1Name, nationalityIOC: nat1 || "SUI", frames: 0, highbreaks: [], winner: false },
          { name: a.player2Name, nationalityIOC: nat2 || "SUI", frames: 0, highbreaks: [], winner: false },
        ],
        bestOf: a.bestOf,
        tableNumber: newState.tableNumber,
      });

      newState.matchId = matchId;

      if (a.handicap && a.handicap > 0) {
        newState.players[1].score = a.handicap;
      }

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
      bestOf: number,
      inputMode: "break" | "ballbyball" = "break",
      redsCount: number = 15,
      matchType: string = "Trainings-Spiel",
    ) => {
      const newState: MatchState = {
        ...createInitialMatchState(),
        players: [createPlayer(name1, nat1), createPlayer(name2, nat2)],
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

      const matchId = await createMatch({
        players: [
          {
            name: name1,
            nationalityIOC: nat1,
            frames: 0,
            highbreaks: [],
            winner: false,
          },
          {
            name: name2,
            nationalityIOC: nat2,
            frames: 0,
            highbreaks: [],
            winner: false,
          },
        ],
        bestOf,
        tableNumber: newState.tableNumber,
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
      isHandicap: boolean
    ) => {
      const label = isFoul
        ? `${match.players[playerIndex].name} Foul ${points}`
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
        const actionType = isHandicap
          ? "handicap"
          : isFoul
            ? "foul"
            : "break";

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
          sendFrameAction({
            matchId: next.matchId,
            frameNumber: next.currentFrame,
            actionType,
            playerIndex: playerIndex + 1,
            points,
          });

          updateMatch({
            type: isFoul ? "ADD_FOUL" : "ADD_BREAK",
            matchState: {
              matchId: next.matchId,
              bestOf: next.bestOf,
              players: next.players.map((p) => ({
                name: p.name,
                frames: p.frames,
                highbreaks: p.highbreaks,
                winner: p.winner,
              })),
            },
            tableNumber: next.tableNumber,
          });
        }

        return next;
      });

      setCalcPlayer(null);
    },
    [match, pushHistory, playerColors]
  );

  // ===== BALL BY BALL =====
  const handleBBPot = useCallback((ball: BBBallType) => {
    if (!match.bbState) return;
    const result = applyPot(match.bbState, ball);
    const playerIdx = match.activePlayerIndex as 0 | 1;
    const opponentIdx = (playerIdx === 0 ? 1 : 0) as 0 | 1;

    // If only black remains after this pot, no break in progress, and diff > 7 → frame is decided
    const newBB = result.newState;
    if (!newBB.frameOver && newBB.phase === "colors_only" && newBB.colorsOnlyIndex === 5 && match.bbState.breakTotal === 0) {
      const newScore = match.players[playerIdx].score + result.points;
      const oppScore = match.players[opponentIdx].score;
      if (Math.abs(newScore - oppScore) > 7) {
        result.newState = { ...newBB, frameOver: true };
      }
    }

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
        sendFrameAction({ matchId: next.matchId, frameNumber: next.currentFrame, actionType: "break", playerIndex: playerIdx + 1, points: result.points });
      }
      return next;
    });
  }, [match, pushHistory]);

  const handleBBFoul = useCallback((ball: BBBallColor) => {
    const pendingFoul = pendingEditFoulRef.current;
    pendingEditFoulRef.current = null;
    isEditingBreakRef.current = false;
    preEditHistoryRef.current = null;
    preEditMatchRef.current = null;
    setIsEditingBreak(false);
    if (!match.bbState) return;
    const result = applyFoul(match.bbState, ball);
    const playerIdx = match.activePlayerIndex as 0 | 1;
    const opponentIdx = (playerIdx === 0 ? 1 : 0) as 0 | 1;
    const bbState = match.bbState;

    // After a foul the incoming player starts a fresh break — normalize phase back to red (or colors_only)
    const normalizedBBState = result.newState.phase === "color"
      ? result.newState.redsRemaining > 0
        ? { ...result.newState, phase: "red" as const }
        : { ...result.newState, phase: "colors_only" as const, colorsOnlyIndex: 0 }
      : result.newState;

    if (bbState.breakTotal > 0) {
      pushHistory(
        `${match.players[playerIdx].name} (${bbState.breakTotal}) & Foul (${result.points} für ${match.players[opponentIdx].name})`,
        match, undefined,
        { kind: "break", playerIndex: playerIdx, points: bbState.breakTotal, frameNumber: match.currentFrame }
      );
    } else {
      pushHistory(
        `${match.players[playerIdx].name} Foul (${result.points} für ${match.players[opponentIdx].name})`,
        match, undefined,
        { kind: "foul", playerIndex: playerIdx, points: result.points, frameNumber: match.currentFrame }
      );
    }

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
            sendFrameAction({ matchId: next.matchId, frameNumber: next.currentFrame, actionType: "foul", playerIndex: prev.activePlayerIndex + 1, points: result.points });
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
            sendFrameAction({ matchId: next.matchId, frameNumber: next.currentFrame, actionType: "foul", playerIndex: prev.activePlayerIndex + 1, points: result.points });
          }
          return next;
        });
        setPendingEndFrame(true);
      }
      setShowBBDialog(false);
      return;
    }

    setMatch((prev) => {
      const next = structuredClone(prev);
      if (pendingFoul) {
        next.players[pendingFoul.opponentIdx].score -= pendingFoul.foulPts;
      }
      next.players[opponentIdx].score += result.points;
      next.activePlayerIndex = opponentIdx;
      next.bbState = { ...normalizedBBState, foulByPlayerIndex: playerIdx };
      if (next.matchId) {
        sendFrameAction({ matchId: next.matchId, frameNumber: next.currentFrame, actionType: "foul", playerIndex: prev.activePlayerIndex + 1, points: result.points });
      }
      return next;
    });
    setShowBBDialog(false);
  }, [match, pushHistory]);

  const handleBBCorrectReds = useCallback((newCount: number) => {
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
      `Korrektur: ${old}→${newCount} Rote`,
      match,
      undefined,
      { kind: "rerack", frameNumber: match.currentFrame }
    );
    setMatch(nextMatch);
  }, [match, pushHistory]);

  // ===== FRAME END =====
  const endFrame = useCallback(() => {
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

      // Send frame action
      if (next.matchId) {
        sendFrameAction({
          matchId: next.matchId,
          frameNumber: next.currentFrame,
          actionType: "frame_end",
          playerIndex: winner !== null ? winner + 1 : 1,
          points: 0,
        });
      }

      // Check if match is over
      if (isMatchOver(next)) {
        const isDraw = next.players[0].frames === next.players[1].frames;
        const matchWinner = isDraw ? null : (next.players[0].frames > next.players[1].frames ? 0 : 1);
        if (matchWinner !== null) {
          next.players[matchWinner].winner = true;
        }
        next.finished = true;

        if (next.matchId && matchWinner !== null) {
          sendFrameAction({
            matchId: next.matchId,
            frameNumber: next.currentFrame,
            actionType: "match_end",
            playerIndex: matchWinner + 1,
            points: 0,
          });

          updateMatch({
            type: "END_MATCH",
            matchState: {
              matchId: next.matchId,
              bestOf: next.bestOf,
              players: next.players.map((p) => ({
                name: p.name,
                frames: p.frames,
                highbreaks: p.highbreaks,
                winner: p.winner,
              })),
            },
            tableNumber: next.tableNumber,
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

        // Reset ball-by-ball state for new frame
        if (next.inputMode === "ballbyball" && next.redsCount) {
          next.bbState = createBBState(next.redsCount);
        }

        if (next.matchId) {
          updateMatch({
            type: "NEW_FRAME",
            matchState: {
              matchId: next.matchId,
              bestOf: next.bestOf,
              players: next.players.map((p) => ({
                name: p.name,
                frames: p.frames,
                highbreaks: p.highbreaks,
                winner: p.winner,
              })),
            },
            tableNumber: next.tableNumber,
          });
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

  const handleBBMiss = useCallback(() => {
    isEditingBreakRef.current = false;
    preEditHistoryRef.current = null;
    preEditMatchRef.current = null;
    pendingEditFoulRef.current = null;
    setIsEditingBreak(false);
    const playerIdx = match.activePlayerIndex as 0 | 1;
    const opponentIdx = (playerIdx === 0 ? 1 : 0) as 0 | 1;
    const bbState = match.bbState;
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
          return next;
        });
        return;
      }
      // Record highbreak before frame ends
      setMatch((prev) => {
        const next = structuredClone(prev);
        if (next.bbState) {
          next.players[playerIdx].highbreaks = insertHighBreak(next.players[playerIdx].highbreaks, next.bbState.breakTotal);
        }
        return next;
      });
      endFrame();
      return;
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
      return next;
    });
  }, [match, pushHistory, endFrame]);

  // ===== RE-RACK =====
  const rerack = useCallback(() => {
    pushHistory("Re-rack", match, undefined, { kind: "rerack", frameNumber: match.currentFrame });
    setMatch((prev) => {
      const next = structuredClone(prev);
      next.players[0].score = 0;
      next.players[1].score = 0;

      if (next.matchId) {
        sendFrameAction({
          matchId: next.matchId,
          frameNumber: next.currentFrame,
          actionType: "rerack",
          playerIndex: next.activePlayerIndex + 1,
          points: 0,
        });
      }

      return next;
    });
    setShowMenu(false);
  }, [match, pushHistory]);

  // ===== EDIT LAST BREAK (ball-by-ball only) =====
  const handleEditLastBreak = useCallback(() => {
    preEditHistoryRef.current = history;
    preEditMatchRef.current = match;
    isEditingBreakRef.current = true;
    setIsEditingBreak(true);
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];

      if (last.label.includes("Foul")) {
        // Break+foul: keep current scores unchanged (break pts on player, foul pts on opponent).
        // Only restore bbState and activePlayerIndex to the pre-foul snapshot so the break
        // can continue editing from before the foul. The foul entry becomes an empty-label
        // undo step so the user can undo it inside the break dialog if desired.
        const preFoulState = JSON.parse(last.snapshot) as MatchState;
        const foulingPlayerIdx = preFoulState.activePlayerIndex as 0 | 1;
        const oppIdx = (foulingPlayerIdx === 0 ? 1 : 0) as 0 | 1;
        const foulPts = match.players[oppIdx].score - preFoulState.players[oppIdx].score;
        pendingEditFoulRef.current = { opponentIdx: oppIdx, foulPts };
        setMatch((prev) => {
          const next = structuredClone(prev);
          next.bbState = preFoulState.bbState;
          next.activePlayerIndex = preFoulState.activePlayerIndex;
          return next;
        });
        // Convert labeled foul entry → empty-label so Undo can pop it cleanly
        return [...prev.slice(0, -1), { ...last, label: "" }];
      }

      // Pure break: existing behaviour (scores don't change visibly)
      setMatch(JSON.parse(last.snapshot) as MatchState);
      return prev.slice(0, -1);
    });
    setShowBBDialog(true);
  }, [history, match]);

  const handleCancelBreakEdit = useCallback(() => {
    if (isEditingBreakRef.current) {
      if (preEditHistoryRef.current) setHistory(preEditHistoryRef.current);
      if (preEditMatchRef.current) setMatch(preEditMatchRef.current);
      preEditHistoryRef.current = null;
      preEditMatchRef.current = null;
      pendingEditFoulRef.current = null;
      isEditingBreakRef.current = false;
      setIsEditingBreak(false);
    }
    setShowBBDialog(false);
  }, []);

  // ===== UNDO =====
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const restored = JSON.parse(last.snapshot) as MatchState;
    // When undoing the converted foul entry during break edit, the pre-foul snapshot
    // already reverts opponent's score, so the pending foul adjustment is no longer needed.
    if (isEditingBreakRef.current) {
      pendingEditFoulRef.current = null;
    }
    setRedoStack(rs => [...rs, { entry: last, matchAfter: JSON.stringify(match) }]);
    setHistory(history.slice(0, -1));
    setMatch(restored);
    setShowMenu(false);

    if (restored.matchId) {
      sendFrameAction({
        matchId: restored.matchId,
        frameNumber: restored.currentFrame,
        actionType: "undo",
        playerIndex: restored.activePlayerIndex + 1,
        points: 0,
      });
    }
  }, [history, match]);

  // ===== REDO =====
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const top = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setHistory(h => [...h, top.entry]);
    setMatch(JSON.parse(top.matchAfter) as MatchState);
    setShowMenu(false);
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

      if (next.matchId && !isDraw) {
        sendFrameAction({
          matchId: next.matchId,
          frameNumber: next.currentFrame,
          actionType: "match_end",
          playerIndex: leader + 1,
          points: 0,
        });

        updateMatch({
          type: "END_MATCH",
          matchState: {
            matchId: next.matchId,
            bestOf: next.bestOf,
            players: next.players.map((p) => ({
              name: p.name,
              frames: p.frames,
              highbreaks: p.highbreaks,
              winner: p.winner,
            })),
          },
          tableNumber: next.tableNumber,
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

    setShowMenu(false);
  }, [match]);

  // ===== NEW GAME =====
  const newGame = useCallback(() => {
    setLastPlayerNames({
      name1: match.players[0].name,
      name2: match.players[1].name,
    });
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
      details?: { missType?: MissType; ball?: BallColor; pocket?: Pocket }
    ) => {
      if (!soloSession || soloSession.mode !== "break") return;
      const attempt: BreakAttempt = {
        kind: "break",
        value,
        missType: details?.missType,
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
      const key = `${soloSession.routineId}:${soloSession.redsCount}`;
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
    const key = `${soloSession.routineId}:${soloSession.redsCount}`;
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
    const key = `${soloSession.routineId}:${soloSession.redsCount}`;
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
          onNewSession={handleSoloReset}
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
              setMatch(prev => ({
                ...prev,
                activePlayerIndex: idx as 0 | 1,
                bbState: autoFrameOver && prev.bbState ? { ...prev.bbState, frameOver: true } : prev.bbState,
              }));
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
          initialAttempts={multiDailyAttempts[`${soloSession.routineId}:${soloSession.redsCount}`] ?? []}
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
          onRedo={redoStack.length > 0 && redoStack[redoStack.length - 1].entry.label === "" ? redo : undefined}
          onCorrectReds={handleBBCorrectReds}
          onClose={handleCancelBreakEdit}
          isEditMode={isEditingBreak}
          onCancelEdit={handleCancelBreakEdit}
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
          onUndo={history.length > 0 ? undo : undefined}
          onRedo={redoStack.length > 0 ? redo : undefined}
          onFrameEnd={match.finished ? undefined : endFrame}
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
          bestOf={match.bestOf}
          isFrameStart={isFrameStart}
          onChangeBestOf={changeBestOf}
        />
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
          nameP1={match.players[0].name}
          nameP2={match.players[1].name}
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
    </>
  );
}
