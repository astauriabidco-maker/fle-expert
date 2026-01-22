-- DropForeignKey
ALTER TABLE "ExamSession" DROP CONSTRAINT "ExamSession_organizationId_fkey";

-- AlterTable
ALTER TABLE "ExamSession" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
