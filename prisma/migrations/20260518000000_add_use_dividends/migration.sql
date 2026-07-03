-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "useDividends" BOOLEAN NOT NULL DEFAULT true;
