-- DropForeignKey
ALTER TABLE "v3_practice_attempt" DROP CONSTRAINT "v3_practice_attempt_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "v3_practice_session" DROP CONSTRAINT "v3_practice_session_locationId_fkey";

-- DropForeignKey
ALTER TABLE "v3_practice_session" DROP CONSTRAINT "v3_practice_session_playerId_fkey";

-- DropTable
DROP TABLE "v3_practice_attempt";

-- DropTable
DROP TABLE "v3_practice_session";

-- DropEnum
DROP TYPE "V3PracticeAttemptKind";

-- DropEnum
DROP TYPE "V3PracticeMode";

