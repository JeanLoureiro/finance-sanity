/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `UserSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AccessRole" AS ENUM ('READ', 'WRITE');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "ownerEmail" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "SharedAccess" (
    "id" TEXT NOT NULL,
    "ownerSettingsId" TEXT NOT NULL,
    "granteeUserId" TEXT NOT NULL DEFAULT '',
    "granteeEmail" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "role" "AccessRole" NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedAccess_token_key" ON "SharedAccess"("token");

-- CreateIndex
CREATE INDEX "SharedAccess_granteeUserId_idx" ON "SharedAccess"("granteeUserId");

-- CreateIndex
CREATE INDEX "SharedAccess_ownerSettingsId_idx" ON "SharedAccess"("ownerSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "SharedAccess" ADD CONSTRAINT "SharedAccess_ownerSettingsId_fkey" FOREIGN KEY ("ownerSettingsId") REFERENCES "UserSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
