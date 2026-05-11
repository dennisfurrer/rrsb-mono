-- CreateEnum
CREATE TYPE "PracticeMode" AS ENUM ('BREAK', 'HITMISS');

-- CreateEnum
CREATE TYPE "PracticeAttemptKind" AS ENUM ('BREAK', 'CLEARED', 'MISSED', 'HIT', 'MISS');

-- CreateEnum
CREATE TYPE "BallColor" AS ENUM ('RED', 'YELLOW', 'GREEN', 'BROWN', 'BLUE', 'PINK', 'BLACK');

-- CreateEnum
CREATE TYPE "MissType" AS ENUM ('LONG', 'EASY', 'DIFFICULT', 'POSITION');

-- CreateEnum
CREATE TYPE "Pocket" AS ENUM ('CORNER', 'MIDDLE');

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "routineName" TEXT NOT NULL,
    "mode" "PracticeMode" NOT NULL,
    "redsCount" INTEGER,
    "deviceId" TEXT,
    "tableNumber" INTEGER,
    "locationId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "kind" "PracticeAttemptKind" NOT NULL,
    "value" INTEGER,
    "missType" "MissType",
    "ball" "BallColor",
    "pocket" "Pocket",
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeSession_playerName_idx" ON "PracticeSession"("playerName");

-- CreateIndex
CREATE INDEX "PracticeSession_routineId_idx" ON "PracticeSession"("routineId");

-- CreateIndex
CREATE INDEX "PracticeSession_startedAt_idx" ON "PracticeSession"("startedAt");

-- CreateIndex
CREATE INDEX "PracticeSession_locationId_idx" ON "PracticeSession"("locationId");

-- CreateIndex
CREATE INDEX "PracticeSession_playerName_routineId_idx" ON "PracticeSession"("playerName", "routineId");

-- CreateIndex
CREATE INDEX "PracticeAttempt_sessionId_idx" ON "PracticeAttempt"("sessionId");

-- CreateIndex
CREATE INDEX "PracticeAttempt_kind_idx" ON "PracticeAttempt"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAttempt_sessionId_orderIndex_key" ON "PracticeAttempt"("sessionId", "orderIndex");

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
