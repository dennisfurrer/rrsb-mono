-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PARTNER_ADMIN');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "locationId" TEXT;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARTNER_ADMIN',
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreboardConfig" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "tableNumber" INTEGER,
    "locationId" TEXT NOT NULL,
    "namesListId" TEXT,
    "lastPingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreboardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NamesList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NamesList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NamesListEntry" (
    "id" TEXT NOT NULL,
    "namesListId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "nationalityIOC" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NamesListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchAssignment" (
    "id" TEXT NOT NULL,
    "player1Name" TEXT NOT NULL,
    "player2Name" TEXT NOT NULL,
    "bestOf" INTEGER NOT NULL,
    "handicap" INTEGER,
    "deviceId" TEXT,
    "tableNumber" INTEGER,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreboardConfig_deviceId_key" ON "ScoreboardConfig"("deviceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreboardConfig" ADD CONSTRAINT "ScoreboardConfig_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreboardConfig" ADD CONSTRAINT "ScoreboardConfig_namesListId_fkey" FOREIGN KEY ("namesListId") REFERENCES "NamesList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NamesListEntry" ADD CONSTRAINT "NamesListEntry_namesListId_fkey" FOREIGN KEY ("namesListId") REFERENCES "NamesList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
