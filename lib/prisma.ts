import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter }) as PrismaClient;
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
