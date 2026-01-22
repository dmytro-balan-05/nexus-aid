/*
  Warnings:

  - A unique constraint covering the columns `[provider,socialId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_provider_socialId_key" ON "User"("provider", "socialId");
