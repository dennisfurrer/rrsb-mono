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
  cancelAssignment,
  claimAssignment,
  completeAssignment,
  createMatch,
  fetchNamesList,
  fetchPendingAssignment,
  getDeviceId,
  pingScoreboard,
  sendFrameAction,
  updateMatch,
  type MatchAssignment,
  type NamesListEntry,
  type ScoreboardConfig,
} from "./lib/api";
import { Scoreboard } from "./components/Scoreboard";
import { SetupDialog } from "./components/SetupDialog";
import { CalculatorDialog } from "./components/CalculatorDialog";
import { MenuDialog } from "./components/MenuDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import { BreaksDialog } from "./components/BreaksDialog";
import { RoutinePickerDialog } from "./components/RoutinePickerDialog";
import { SoloSession } from "./components/SoloSession";
import { SoloMenuDialog } from "./components/SoloMenuDialog";
import { BreakEntryDialog } from "./components/BreakEntryDialog";
import { MultiEntryDialog } from "./components/MultiEntryDialog";
import { RedsConfigDialog } from "./components/RedsConfigDialog";
import {
  createSoloSession,
  maxClearanceValue,
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
};

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
  const [showSetup, setShowSetup] = useState(!match.matchId);
  const [calcPlayer, setCalcPlayer] = useState<0 | 1 | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  useEffect(() => {
    if (soloSession) {
      sessionStorage.setItem("soloSession", JSON.stringify(soloSession));
    } else {
      sessionStorage.removeItem("soloSession");
    }
  }, [soloSession]);

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
      setShowSetup(false);
      setActiveAssignmentId(a.id);
      setPendingAssignment(null);
      claimAssignment(a.id);
    },
    [playerList]
  );

  const pushHistory = useCallback(
    (label: string, state: MatchState) => {
      setHistory((prev) => [
        ...prev,
        { label, snapshot: JSON.stringify(state) },
      ]);
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
      bestOf: number
    ) => {
      const newState: MatchState = {
        ...createInitialMatchState(),
        players: [createPlayer(name1, nat1), createPlayer(name2, nat2)],
        bestOf,
      };

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

      newState.matchId = matchId;
      setMatch(newState);
      setHistory([]);
      setShowSetup(false);
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
      const label = `${match.players[playerIndex].name} ${isFoul ? "Foul" : isHandicap ? "HC" : ""} ${points}`;
      pushHistory(label, match);

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
    [match, pushHistory]
  );

  // ===== FRAME END =====
  const endFrame = useCallback(() => {
    const frameWinner = determineFrameWinner(match);
    const winnerName = frameWinner !== null ? match.players[frameWinner].name : "?";
    const s0 = match.players[0].score;
    const s1 = match.players[1].score;
    const winScore = Math.max(s0, s1);
    const loseScore = Math.min(s0, s1);
    const newFrames = frameWinner !== null ? match.players[frameWinner].frames + 1 : 0;
    const willMatchEnd = newFrames >= framesToWin(match.bestOf);
    if (willMatchEnd) {
      const loserIdx = frameWinner === 0 ? 1 : 0;
      pushHistory(`${winnerName} gewinnt Match ${newFrames}:${match.players[loserIdx].frames}`, match);
    } else {
      pushHistory(`${winnerName} gewinnt Frame ${winScore}:${loseScore}`, match);
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
        const matchWinner =
          next.players[0].frames >= framesToWin(next.bestOf) ? 0 : 1;
        next.players[matchWinner].winner = true;
        next.finished = true;

        if (next.matchId) {
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

  // ===== RE-RACK =====
  const rerack = useCallback(() => {
    pushHistory("Re-rack", match);
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

  // ===== UNDO =====
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const restored = JSON.parse(last.snapshot) as MatchState;
      setMatch(restored);

      if (restored.matchId) {
        sendFrameAction({
          matchId: restored.matchId,
          frameNumber: restored.currentFrame,
          actionType: "undo",
          playerIndex: restored.activePlayerIndex + 1,
          points: 0,
        });
      }

      return prev.slice(0, -1);
    });
    setShowMenu(false);
  }, []);

  // ===== MATCH END (EARLY) =====
  const endMatchEarly = useCallback(() => {
    pushHistory("Match End (Early)", match);
    setMatch((prev) => {
      const next = structuredClone(prev);

      // Determine who's leading
      const leader =
        next.players[0].frames > next.players[1].frames ? 0 : 1;

      if (next.players[0].frames === next.players[1].frames) {
        // Tied - can't end early
        return prev;
      }

      next.players[leader].winner = true;
      next.finished = true;

      // Adjust bestOf to minimum needed
      const totalFrames = next.players[0].frames + next.players[1].frames;
      next.bestOf = totalFrames;

      if (next.matchId) {
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

  // ===== NEW GAME =====
  const newGame = useCallback(() => {
    // Cancel active assignment if match wasn't completed naturally
    if (activeAssignmentId) {
      cancelAssignment(activeAssignmentId);
      setActiveAssignmentId(null);
    }
    setMatch(createInitialMatchState());
    setHistory([]);
    setShowSetup(true);
    setShowMenu(false);
  }, [activeAssignmentId]);

  // ===== PRACTICE MODE =====
  const handlePracticeStart = useCallback((playerName: string) => {
    setPracticePlayer(playerName);
    setShowRoutinePicker(true);
  }, []);

  const handleRoutinePicked = useCallback(
    (routineId: SoloRoutineId) => {
      const name = practicePlayer || soloSession?.playerName || "Spieler";
      setSoloSession(createSoloSession(name, routineId));
      setShowRoutinePicker(false);
      setShowSetup(false);
    },
    [practicePlayer, soloSession]
  );

  const handleRoutinePickerCancel = useCallback(() => {
    setShowRoutinePicker(false);
    setPracticePlayer(null);
  }, []);

  const handleHitMissShot = useCallback((shot: SoloShot) => {
    setSoloSession((prev) => {
      if (!prev || prev.mode !== "hitmiss") return prev;
      return { ...prev, shots: [...prev.shots, shot] };
    });
  }, []);

  const handleBreakSubmit = useCallback(
    (
      value: number,
      details?: { missType?: MissType; ball?: BallColor; pocket?: Pocket }
    ) => {
      setSoloSession((prev) => {
        if (!prev || prev.mode !== "break") return prev;
        const attempt: BreakAttempt = {
          kind: "break",
          value,
          missType: details?.missType,
          ball: details?.ball,
          pocket: details?.pocket,
          timestamp: Date.now(),
        };
        return { ...prev, attempts: [...prev.attempts, attempt] };
      });
      setShowBreakEntry(false);
    },
    []
  );

  const handleCleared = useCallback(() => {
    setSoloSession((prev) => {
      if (!prev || prev.mode !== "break") return prev;
      const attempt: BreakAttempt = {
        kind: "cleared",
        value: maxClearanceValue(prev.redsCount),
        timestamp: Date.now(),
      };
      return { ...prev, attempts: [...prev.attempts, attempt] };
    });
  }, []);

  const handleMissed = useCallback(() => {
    setSoloSession((prev) => {
      if (!prev || prev.mode !== "break") return prev;
      const attempt: BreakAttempt = {
        kind: "missed",
        timestamp: Date.now(),
      };
      return { ...prev, attempts: [...prev.attempts, attempt] };
    });
  }, []);

  const handleMultiCommit = useCallback((attempts: BreakAttempt[]) => {
    setSoloSession((prev) => {
      if (!prev || prev.mode !== "break") return prev;
      return { ...prev, attempts: [...prev.attempts, ...attempts] };
    });
    setShowMultiEntry(false);
  }, []);

  const handleRedsChange = useCallback((reds: number) => {
    setSoloSession((prev) => {
      if (!prev || prev.mode !== "break") return prev;
      return { ...prev, redsCount: reds };
    });
    setShowRedsConfig(false);
  }, []);

  const handleSoloUndo = useCallback(() => {
    setSoloSession((prev) => {
      if (!prev) return prev;
      if (prev.mode === "hitmiss") {
        if (prev.shots.length === 0) return prev;
        return { ...prev, shots: prev.shots.slice(0, -1) };
      }
      if (prev.attempts.length === 0) return prev;
      return { ...prev, attempts: prev.attempts.slice(0, -1) };
    });
    setShowSoloMenu(false);
  }, []);

  const handleSoloReset = useCallback(() => {
    setSoloSession((prev) => {
      if (!prev) return prev;
      if (prev.mode === "hitmiss") {
        return { ...prev, shots: [], startedAt: Date.now() };
      }
      return { ...prev, attempts: [], startedAt: Date.now() };
    });
    setShowSoloMenu(false);
  }, []);

  const handleSoloChangeRoutine = useCallback(() => {
    setSoloSession(null);
    setShowSoloMenu(false);
    setShowRoutinePicker(true);
  }, []);

  const handleSoloEnd = useCallback(() => {
    setSoloSession(null);
    setPracticePlayer(null);
    setShowSoloMenu(false);
    setShowSetup(true);
  }, []);

  // ===== SETTINGS =====
  const handleSettingsSave = useCallback(
    (tableNum: string) => {
      localStorage.setItem("tableNumber", tableNum);
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

  const canEndMatchEarly =
    !match.finished &&
    match.players[0].frames !== match.players[1].frames;

  const isFrameStart =
    match.players[0].score === 0 && match.players[1].score === 0;

  return (
    <>
      {soloSession ? (
        <SoloSession
          session={soloSession}
          onHitMissShot={handleHitMissShot}
          onBreakEntry={() => setShowBreakEntry(true)}
          onCleared={handleCleared}
          onMissed={handleMissed}
          onMultiEntry={() => setShowMultiEntry(true)}
          onEditReds={() => setShowRedsConfig(true)}
          onMenuClick={() => setShowSoloMenu(true)}
        />
      ) : (
        <Scoreboard
          match={match}
          onPlayerClick={(idx) => {
            if (!match.finished) setCalcPlayer(idx as 0 | 1);
          }}
          onMenuClick={() => setShowMenu(true)}
          onBreaksClick={(idx) => setBreaksPlayer(idx as 0 | 1)}
          history={history}
        />
      )}

      {showSetup && !soloSession && !showRoutinePicker && (
        <SetupDialog
          onComplete={handleSetupComplete}
          onPracticeStart={handlePracticeStart}
          defaultBestOf={match.bestOf}
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
          onCommit={handleMultiCommit}
          onClose={() => setShowMultiEntry(false)}
        />
      )}

      {showRedsConfig && soloSession && soloSession.mode === "break" && (
        <RedsConfigDialog
          current={soloSession.redsCount}
          onSave={handleRedsChange}
          onClose={() => setShowRedsConfig(false)}
        />
      )}

      {calcPlayer !== null && (
        <CalculatorDialog
          playerName={match.players[calcPlayer].name}
          playerIndex={calcPlayer}
          showHandicap={isFrameStart && match.currentFrame === 1}
          onSubmit={addPoints}
          onClose={() => setCalcPlayer(null)}
        />
      )}

      {showMenu && (
        <MenuDialog
          onUndo={undo}
          onFrameEnd={endFrame}
          onRerack={rerack}
          onMatchEnd={canEndMatchEarly ? endMatchEarly : undefined}
          onNewGame={newGame}
          onClose={() => setShowMenu(false)}
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
        />
      )}

      {showSettings && (
        <SettingsDialog
          currentTableNumber={match.tableNumber}
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
    </>
  );
}
