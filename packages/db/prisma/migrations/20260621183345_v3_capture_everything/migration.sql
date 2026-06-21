-- CreateEnum
CREATE TYPE "V3MatchType" AS ENUM ('SIX_REDS', 'LIGA_A', 'LIGA_BC', 'OPEN_TURNIER', 'QT', 'SONSTIGES_TURNIER', 'SWISS_SNOOKER_CUP', 'TRAININGS_SPIEL', 'WOCHENTURNIER', 'OTHER');

-- CreateEnum
CREATE TYPE "V3InputMode" AS ENUM ('BREAK', 'BALL_BY_BALL');

-- CreateEnum
CREATE TYPE "V3MatchStatus" AS ENUM ('ACTIVE', 'FINISHED', 'ABORTED');

-- CreateEnum
CREATE TYPE "V3FrameStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "V3BallType" AS ENUM ('RED', 'YELLOW', 'GREEN', 'BROWN', 'BLUE', 'PINK', 'BLACK', 'FREE_BALL');

-- CreateEnum
CREATE TYPE "V3BallColor" AS ENUM ('RED', 'YELLOW', 'GREEN', 'BROWN', 'BLUE', 'PINK', 'BLACK');

-- CreateEnum
CREATE TYPE "V3BBPhase" AS ENUM ('RED', 'COLOR', 'COLORS_ONLY');

-- CreateEnum
CREATE TYPE "V3MissType" AS ENUM ('LONG', 'EASY', 'DIFFICULT', 'POSITION', 'FOUL');

-- CreateEnum
CREATE TYPE "V3Pocket" AS ENUM ('CORNER', 'MIDDLE');

-- CreateEnum
CREATE TYPE "V3BreakEndReason" AS ENUM ('MISS', 'FOUL', 'FRAME_END', 'EDIT', 'RESPOTTED_BLACK');

-- CreateEnum
CREATE TYPE "V3EventType" AS ENUM ('POT', 'MANUAL_BREAK', 'FOUL', 'MISS', 'HANDICAP', 'CORRECT_REDS', 'SWITCH_PLAYER', 'RERACK', 'RESPOTTED_BLACK', 'FRAME_END', 'MATCH_END', 'UNDO', 'REDO', 'EDIT_LAST_BREAK');

-- CreateEnum
CREATE TYPE "V3EventSource" AS ENUM ('DISPLAY', 'REMOTE_PHONE');

-- CreateEnum
CREATE TYPE "V3PracticeMode" AS ENUM ('BREAK', 'HITMISS');

-- CreateEnum
CREATE TYPE "V3PracticeAttemptKind" AS ENUM ('BREAK', 'CLEARED', 'MISSED', 'HIT', 'MISS');

-- CreateEnum
CREATE TYPE "V3RemoteEventType" AS ENUM ('SESSION_CREATED', 'SESSION_ROTATED', 'PHONE_CONNECTED', 'PHONE_DISCONNECTED', 'COMMAND_RECEIVED');

-- CreateTable
CREATE TABLE "v3_player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationalityIOC" TEXT,
    "club" TEXT,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "matchesDrawn" INTEGER NOT NULL DEFAULT 0,
    "framesWon" INTEGER NOT NULL DEFAULT 0,
    "framesLost" INTEGER NOT NULL DEFAULT 0,
    "pointsFor" INTEGER NOT NULL DEFAULT 0,
    "pointsAgainst" INTEGER NOT NULL DEFAULT 0,
    "breaksOver7" INTEGER NOT NULL DEFAULT 0,
    "highBreak" INTEGER NOT NULL DEFAULT 0,
    "highBreaks" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "centuries" INTEGER NOT NULL DEFAULT 0,
    "foulsCommitted" INTEGER NOT NULL DEFAULT 0,
    "foulPointsConceded" INTEGER NOT NULL DEFAULT 0,
    "potsByColor" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v3_player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_player_match_type_stat" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "matchType" "V3MatchType" NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "matchesDrawn" INTEGER NOT NULL DEFAULT 0,
    "framesWon" INTEGER NOT NULL DEFAULT 0,
    "framesLost" INTEGER NOT NULL DEFAULT 0,
    "highBreak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v3_player_match_type_stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_match" (
    "id" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "matchTypeCode" "V3MatchType" NOT NULL DEFAULT 'OTHER',
    "inputMode" "V3InputMode" NOT NULL,
    "redsCount" INTEGER NOT NULL DEFAULT 15,
    "bestOf" INTEGER NOT NULL,
    "status" "V3MatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDraw" BOOLEAN NOT NULL DEFAULT false,
    "winnerPlayerIndex" INTEGER,
    "tableNumber" INTEGER,
    "locationId" TEXT,
    "deviceId" TEXT,
    "remoteRoomId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v3_match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_match_player" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerIndex" INTEGER NOT NULL,
    "playerId" TEXT,
    "name" TEXT NOT NULL,
    "nationalityIOC" TEXT,
    "club" TEXT,
    "startingHandicap" INTEGER NOT NULL DEFAULT 0,
    "framesWon" INTEGER NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "highBreak" INTEGER NOT NULL DEFAULT 0,
    "highBreaks" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "pointsFor" INTEGER NOT NULL DEFAULT 0,
    "pointsAgainst" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "v3_match_player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_frame" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "frameNumber" INTEGER NOT NULL,
    "redsCount" INTEGER NOT NULL,
    "inputMode" "V3InputMode" NOT NULL,
    "breakerPlayerIndex" INTEGER,
    "winnerPlayerIndex" INTEGER,
    "scoreP0" INTEGER NOT NULL DEFAULT 0,
    "scoreP1" INTEGER NOT NULL DEFAULT 0,
    "rerackCount" INTEGER NOT NULL DEFAULT 0,
    "respottedBlack" BOOLEAN NOT NULL DEFAULT false,
    "status" "V3FrameStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "v3_frame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_break" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "playerIndex" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "ballCount" INTEGER NOT NULL DEFAULT 0,
    "isClearance" BOOLEAN NOT NULL DEFAULT false,
    "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
    "endReason" "V3BreakEndReason",
    "missType" "V3MissType",
    "ball" "V3BallColor",
    "pocket" "V3Pocket",
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "v3_break_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_ball" (
    "id" TEXT NOT NULL,
    "breakId" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "ballType" "V3BallType" NOT NULL,
    "points" INTEGER NOT NULL,
    "isFreeBall" BOOLEAN NOT NULL DEFAULT false,
    "phase" "V3BBPhase" NOT NULL,
    "redsRemainingAfter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v3_ball_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_event" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "frameId" TEXT,
    "breakId" TEXT,
    "seq" INTEGER NOT NULL,
    "type" "V3EventType" NOT NULL,
    "playerIndex" INTEGER,
    "ballType" "V3BallType",
    "points" INTEGER NOT NULL DEFAULT 0,
    "missType" "V3MissType",
    "pocket" "V3Pocket",
    "isFreeBall" BOOLEAN NOT NULL DEFAULT false,
    "freeBallGranted" BOOLEAN,
    "phase" "V3BBPhase",
    "redsRemaining" INTEGER,
    "oldReds" INTEGER,
    "newReds" INTEGER,
    "source" "V3EventSource" NOT NULL DEFAULT 'DISPLAY',
    "remotePlayerIndex" INTEGER,
    "wasUndone" BOOLEAN NOT NULL DEFAULT false,
    "manualFlagToIgnore" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "payload" JSONB,
    "clientTs" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v3_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_remote_session" (
    "id" TEXT NOT NULL,
    "matchId" TEXT,
    "roomId" TEXT NOT NULL,
    "playerIndex" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "connectCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),
    "lastConnectedAt" TIMESTAMP(3),
    "lastDisconnectedAt" TIMESTAMP(3),

    CONSTRAINT "v3_remote_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_remote_event" (
    "id" TEXT NOT NULL,
    "matchId" TEXT,
    "roomId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" "V3RemoteEventType" NOT NULL,
    "playerIndex" INTEGER,
    "commandType" TEXT,
    "commandPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v3_remote_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_practice_session" (
    "id" TEXT NOT NULL,
    "playerId" TEXT,
    "playerName" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "routineName" TEXT NOT NULL,
    "mode" "V3PracticeMode" NOT NULL,
    "seriesMode" BOOLEAN NOT NULL DEFAULT false,
    "redsCount" INTEGER,
    "deviceId" TEXT,
    "tableNumber" INTEGER,
    "locationId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "highestBreak" INTEGER NOT NULL DEFAULT 0,
    "averageBreak" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clearedCount" INTEGER NOT NULL DEFAULT 0,
    "missedCount" INTEGER NOT NULL DEFAULT 0,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "misses" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v3_practice_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v3_practice_attempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "kind" "V3PracticeAttemptKind" NOT NULL,
    "value" INTEGER,
    "clearance" BOOLEAN NOT NULL DEFAULT false,
    "missType" "V3MissType",
    "ball" "V3BallColor",
    "pocket" "V3Pocket",
    "isFreeBall" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "v3_practice_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "v3_player_name_key" ON "v3_player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "v3_player_match_type_stat_playerId_matchType_key" ON "v3_player_match_type_stat"("playerId", "matchType");

-- CreateIndex
CREATE INDEX "v3_match_status_idx" ON "v3_match"("status");

-- CreateIndex
CREATE INDEX "v3_match_tableNumber_idx" ON "v3_match"("tableNumber");

-- CreateIndex
CREATE INDEX "v3_match_matchTypeCode_idx" ON "v3_match"("matchTypeCode");

-- CreateIndex
CREATE INDEX "v3_match_startedAt_idx" ON "v3_match"("startedAt");

-- CreateIndex
CREATE INDEX "v3_match_player_name_idx" ON "v3_match_player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "v3_match_player_matchId_playerIndex_key" ON "v3_match_player"("matchId", "playerIndex");

-- CreateIndex
CREATE UNIQUE INDEX "v3_frame_matchId_frameNumber_key" ON "v3_frame"("matchId", "frameNumber");

-- CreateIndex
CREATE INDEX "v3_break_frameId_idx" ON "v3_break"("frameId");

-- CreateIndex
CREATE INDEX "v3_break_matchId_idx" ON "v3_break"("matchId");

-- CreateIndex
CREATE INDEX "v3_ball_breakId_idx" ON "v3_ball"("breakId");

-- CreateIndex
CREATE INDEX "v3_event_matchId_idx" ON "v3_event"("matchId");

-- CreateIndex
CREATE INDEX "v3_event_type_idx" ON "v3_event"("type");

-- CreateIndex
CREATE UNIQUE INDEX "v3_event_matchId_seq_key" ON "v3_event"("matchId", "seq");

-- CreateIndex
CREATE INDEX "v3_remote_session_roomId_idx" ON "v3_remote_session"("roomId");

-- CreateIndex
CREATE INDEX "v3_remote_event_roomId_idx" ON "v3_remote_event"("roomId");

-- CreateIndex
CREATE INDEX "v3_remote_event_matchId_idx" ON "v3_remote_event"("matchId");

-- CreateIndex
CREATE INDEX "v3_practice_session_playerName_idx" ON "v3_practice_session"("playerName");

-- CreateIndex
CREATE INDEX "v3_practice_session_routineId_idx" ON "v3_practice_session"("routineId");

-- CreateIndex
CREATE INDEX "v3_practice_attempt_sessionId_idx" ON "v3_practice_attempt"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "v3_practice_attempt_sessionId_orderIndex_key" ON "v3_practice_attempt"("sessionId", "orderIndex");

-- AddForeignKey
ALTER TABLE "v3_player_match_type_stat" ADD CONSTRAINT "v3_player_match_type_stat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "v3_player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_match" ADD CONSTRAINT "v3_match_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_match_player" ADD CONSTRAINT "v3_match_player_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_match_player" ADD CONSTRAINT "v3_match_player_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "v3_player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_frame" ADD CONSTRAINT "v3_frame_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_break" ADD CONSTRAINT "v3_break_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_break" ADD CONSTRAINT "v3_break_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "v3_frame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_ball" ADD CONSTRAINT "v3_ball_breakId_fkey" FOREIGN KEY ("breakId") REFERENCES "v3_break"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_ball" ADD CONSTRAINT "v3_ball_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "v3_frame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_event" ADD CONSTRAINT "v3_event_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_event" ADD CONSTRAINT "v3_event_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "v3_frame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_remote_session" ADD CONSTRAINT "v3_remote_session_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_remote_event" ADD CONSTRAINT "v3_remote_event_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_remote_event" ADD CONSTRAINT "v3_remote_event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "v3_remote_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_practice_session" ADD CONSTRAINT "v3_practice_session_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "v3_player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_practice_session" ADD CONSTRAINT "v3_practice_session_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v3_practice_attempt" ADD CONSTRAINT "v3_practice_attempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "v3_practice_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

