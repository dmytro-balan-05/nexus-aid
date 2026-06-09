-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "urgentUntil" TIMESTAMP(3);
