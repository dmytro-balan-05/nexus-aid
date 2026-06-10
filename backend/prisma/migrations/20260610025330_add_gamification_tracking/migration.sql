-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "campaignProgressAtDonation" INTEGER;

-- AlterTable
ALTER TABLE "DonorProfile" ADD COLUMN     "currentDayStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentMonthStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "customizationChangeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDonationDate" TIMESTAMP(3),
ADD COLUMN     "longestDayStreak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileView_viewerId_idx" ON "ProfileView"("viewerId");

-- CreateIndex
CREATE INDEX "ProfileView_targetId_idx" ON "ProfileView"("targetId");

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
