-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DonorProfile" ADD COLUMN     "selectedBadgeId" TEXT;

-- AddForeignKey
ALTER TABLE "DonorProfile" ADD CONSTRAINT "DonorProfile_selectedBadgeId_fkey" FOREIGN KEY ("selectedBadgeId") REFERENCES "Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
