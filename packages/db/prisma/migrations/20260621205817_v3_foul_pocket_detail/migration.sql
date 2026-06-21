-- CreateEnum
CREATE TYPE "V3FoulType" AS ENUM ('WHITE_POTTED', 'WRONG_BALL_HIT', 'NO_BALL_HIT', 'WHITE_OFF_TABLE', 'CLOTHING_FOUL', 'CUE_FOUL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "V3Pocket" ADD VALUE 'CORNER_YELLOW';
ALTER TYPE "V3Pocket" ADD VALUE 'CORNER_GREEN';
ALTER TYPE "V3Pocket" ADD VALUE 'MIDDLE_YELLOW';
ALTER TYPE "V3Pocket" ADD VALUE 'MIDDLE_GREEN';
ALTER TYPE "V3Pocket" ADD VALUE 'CORNER_BLACK_YELLOW';
ALTER TYPE "V3Pocket" ADD VALUE 'CORNER_BLACK_GREEN';

-- AlterTable
ALTER TABLE "v3_break" ADD COLUMN     "foulType" "V3FoulType";

-- AlterTable
ALTER TABLE "v3_event" ADD COLUMN     "foulType" "V3FoulType";

