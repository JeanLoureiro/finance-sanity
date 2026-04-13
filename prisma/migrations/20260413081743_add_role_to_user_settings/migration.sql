-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "role" "AccessRole" NOT NULL DEFAULT 'OWNER';
