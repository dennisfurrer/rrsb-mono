-- AlterEnum
ALTER TYPE "MissType" ADD VALUE 'FOUL';

-- CreateEnum
CREATE TYPE "FoulType" AS ENUM ('WHITE_POTTED', 'WRONG_BALL_HIT', 'NO_BALL_HIT', 'WHITE_OFF_TABLE', 'CLOTHING_FOUL', 'CUE_FOUL');

-- AlterTable
ALTER TABLE "PracticeAttempt" ADD COLUMN "foulType" "FoulType";
