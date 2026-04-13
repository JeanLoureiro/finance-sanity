-- AlterEnum: Add OWNER value in its own transaction so it can be used in the next migration.
ALTER TYPE "AccessRole" ADD VALUE 'OWNER';
