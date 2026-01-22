-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "isRecording" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxListens" INTEGER NOT NULL DEFAULT 2;
