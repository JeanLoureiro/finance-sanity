-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "role" "AccessRole" NOT NULL DEFAULT 'OWNER';
