-- AlterTable
ALTER TABLE "v3_match" ADD COLUMN     "producer" TEXT,
ADD COLUMN     "producerVersion" TEXT,
ADD COLUMN     "schemaVersion" INTEGER NOT NULL DEFAULT 3;

