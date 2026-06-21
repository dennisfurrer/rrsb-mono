-- CreateTable
CREATE TABLE "location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "tableNumbers" JSONB NOT NULL DEFAULT '[]',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "v3_player" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "highBreaks" JSONB NOT NULL DEFAULT '[]',
    "centuries" INTEGER NOT NULL DEFAULT 0,
    "foulsCommitted" INTEGER NOT NULL DEFAULT 0,
    "foulPointsConceded" INTEGER NOT NULL DEFAULT 0,
    "potsByColor" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "v3_player_match_type_stat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "matchesDrawn" INTEGER NOT NULL DEFAULT 0,
    "framesWon" INTEGER NOT NULL DEFAULT 0,
    "framesLost" INTEGER NOT NULL DEFAULT 0,
    "highBreak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "v3_player_match_type_stat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "v3_player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "v3_match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchType" TEXT NOT NULL,
    "matchTypeCode" TEXT NOT NULL DEFAULT 'OTHER',
    "inputMode" TEXT NOT NULL,
    "redsCount" INTEGER NOT NULL DEFAULT 15,
    "bestOf" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isDraw" BOOLEAN NOT NULL DEFAULT false,
    "winnerPlayerIndex" INTEGER,
    "schemaVersion" INTEGER NOT NULL DEFAULT 3,
    "producer" TEXT,
    "producerVersion" TEXT,
    "tableNumber" INTEGER,
    "locationId" TEXT,
    "deviceId" TEXT,
    "remoteRoomId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "v3_match_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "v3_match_player" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "highBreaks" JSONB NOT NULL DEFAULT '[]',
    "pointsFor" INTEGER NOT NULL DEFAULT 0,
    "pointsAgainst" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "v3_match_player_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "v3_match_player_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "v3_player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "v3_frame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "frameNumber" INTEGER NOT NULL,
    "redsCount" INTEGER NOT NULL,
    "inputMode" TEXT NOT NULL,
    "breakerPlayerIndex" INTEGER,
    "winnerPlayerIndex" INTEGER,
    "scoreP0" INTEGER NOT NULL DEFAULT 0,
    "scoreP1" INTEGER NOT NULL DEFAULT 0,
    "rerackCount" INTEGER NOT NULL DEFAULT 0,
    "respottedBlack" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "v3_frame_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "v3_break" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "playerIndex" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "ballCount" INTEGER NOT NULL DEFAULT 0,
    "isClearance" BOOLEAN NOT NULL DEFAULT false,
    "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
    "endReason" TEXT,
    "missType" TEXT,
    "foulType" TEXT,
    "ball" TEXT,
    "pocket" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "v3_break_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "v3_break_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "v3_frame" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "v3_ball" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "breakId" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "ballType" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "isFreeBall" BOOLEAN NOT NULL DEFAULT false,
    "phase" TEXT NOT NULL,
    "redsRemainingAfter" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "v3_ball_breakId_fkey" FOREIGN KEY ("breakId") REFERENCES "v3_break" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "v3_ball_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "v3_frame" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "v3_event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "frameId" TEXT,
    "breakId" TEXT,
    "seq" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "playerIndex" INTEGER,
    "ballType" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "missType" TEXT,
    "foulType" TEXT,
    "pocket" TEXT,
    "isFreeBall" BOOLEAN NOT NULL DEFAULT false,
    "freeBallGranted" BOOLEAN,
    "phase" TEXT,
    "redsRemaining" INTEGER,
    "oldReds" INTEGER,
    "newReds" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'DISPLAY',
    "remotePlayerIndex" INTEGER,
    "wasUndone" BOOLEAN NOT NULL DEFAULT false,
    "manualFlagToIgnore" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "payload" JSONB,
    "clientTs" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "v3_event_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "v3_event_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "v3_frame" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "v3_remote_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT,
    "roomId" TEXT NOT NULL,
    "playerIndex" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "connectCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" DATETIME,
    "lastConnectedAt" DATETIME,
    "lastDisconnectedAt" DATETIME,
    CONSTRAINT "v3_remote_session_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "v3_remote_event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT,
    "roomId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "playerIndex" INTEGER,
    "commandType" TEXT,
    "commandPayload" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "v3_remote_event_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "v3_match" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "v3_remote_event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "v3_remote_session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "location_name_key" ON "location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "location_slug_key" ON "location"("slug");

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

