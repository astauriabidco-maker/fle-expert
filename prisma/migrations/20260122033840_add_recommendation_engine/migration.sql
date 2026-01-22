/*
  Warnings:

  - You are about to drop the column `contactName` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `schoolName` on the `Lead` table. All the data in the column will be lost.
  - Added the required column `candidateId` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "contactName",
DROP COLUMN "email",
DROP COLUMN "phone",
DROP COLUMN "schoolName",
ADD COLUMN     "candidateId" TEXT NOT NULL,
ADD COLUMN     "matchingScore" DOUBLE PRECISION,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "address" TEXT,
ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "coordinates" JSONB,
ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "levels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "nextSessionStart" TIMESTAMP(3),
ADD COLUMN     "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "zipCode" TEXT;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
