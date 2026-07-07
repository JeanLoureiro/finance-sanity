-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "dashboardWidgets" JSONB;
