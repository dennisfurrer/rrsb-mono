import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  createInitialMatchState,
  createPlayer,
  determineFrameWinner,
  framesToWin,
  insertHighBreak,
  isMatchOver,
  type MatchState,
} from "./lib/model";
import { createMatch, sendFrameAction, updateMatch } from "./lib/api";
import { Scoreboard } from "./components/Scoreboard";
import { SetupDialog } from "./components/SetupDialog";
import { CalculatorDialog } from "./components/CalculatorDialog";
import { MenuDialog } from "./components/MenuDialog";

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

  // Persist match state to sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem("matchState", JSON.stringify(match));
  }, [match]);

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
    if (newFrames >= framesToWin(match.bestOf)) {
      const loserIdx = frameWinner === 0 ? 1 : 0;
      pushHistory(`${winnerName} gewinnt Match ${newFrames}:${match.players[loserIdx].frames}`, match);
    } else {
      pushHistory(`${winnerName} gewinnt Frame ${winScore}:${loseScore}`, match);
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
  }, [match, pushHistory]);

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
    setShowMenu(false);
  }, [match, pushHistory]);

  // ===== NEW GAME =====
  const newGame = useCallback(() => {
    setMatch(createInitialMatchState());
    setHistory([]);
    setShowSetup(true);
    setShowMenu(false);
  }, []);

  const canEndMatchEarly =
    !match.finished &&
    match.players[0].frames !== match.players[1].frames;

  const isFrameStart =
    match.players[0].score === 0 && match.players[1].score === 0;

  return (
    <>
      <Scoreboard
        match={match}
        onPlayerClick={(idx) => {
          if (!match.finished) setCalcPlayer(idx as 0 | 1);
        }}
        onMenuClick={() => setShowMenu(true)}
        history={history}
      />

      {showSetup && (
        <SetupDialog
          onComplete={handleSetupComplete}
          defaultBestOf={match.bestOf}
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
        />
      )}
    </>
  );
}
