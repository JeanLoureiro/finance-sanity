import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPayday } from "@/lib/paydayUtils";
import { recordSnapshotForSettings } from "@/lib/snapshotService";

export const GET = async (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const candidates = await prisma.userSettings.findMany({
    where: { autoSnapshot: true },
    select: {
      id: true,
      salaryFrequency: true,
      dayOfMonthPaid: true,
      jobStartDate: true,
    },
  });

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const settings of candidates) {
    if (
      !isPayday(
        settings.salaryFrequency,
        settings.dayOfMonthPaid,
        settings.jobStartDate,
        today
      )
    ) {
      skipped++;
      continue;
    }

    try {
      await recordSnapshotForSettings(settings.id, today);
      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${settings.id}: ${message}`);
      console.error(`Failed to snapshot settings ${settings.id}:`, error);
    }
  }

  return Response.json({ processed, skipped, errors });
};
