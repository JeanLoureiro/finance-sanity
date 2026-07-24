import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPayday } from "@/lib/paydayUtils";
import { recordSnapshotForSettings } from "@/lib/snapshotService";
import { fetchSnapshotEmailSections } from "@/lib/snapshotEmailSections";
import { sendSnapshotEmail } from "@/lib/email";
import { computeEntitlements } from "@/lib/entitlements";

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
      ownerEmail: true,
      salaryFrequency: true,
      dayOfMonthPaid: true,
      jobStartDate: true,
      netIncome: true,
      snapshotEmailCash: true,
      snapshotEmailETFs: true,
      snapshotEmailStocks: true,
      snapshotEmailManagedFunds: true,
      snapshotEmailCrypto: true,
      snapshotEmailOtherAssets: true,
      snapshotEmailSuper: true,
      snapshotEmailProperty: true,
      snapshotEmailLoans: true,
      snapshotEmailBudget: true,
      snapshotEmailSideIncome: true,
      snapshotEmailDividends: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      sharedAccessGrants: {
        where: { status: "ACCEPTED" },
        select: { granteeEmail: true },
      },
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
      const snapshot = await recordSnapshotForSettings(settings.id, today);

      const sections = await fetchSnapshotEmailSections(settings.id, {
        snapshotEmailCash: settings.snapshotEmailCash,
        snapshotEmailETFs: settings.snapshotEmailETFs,
        snapshotEmailStocks: settings.snapshotEmailStocks,
        snapshotEmailManagedFunds: settings.snapshotEmailManagedFunds,
        snapshotEmailCrypto: settings.snapshotEmailCrypto,
        snapshotEmailOtherAssets: settings.snapshotEmailOtherAssets,
        snapshotEmailSuper: settings.snapshotEmailSuper,
        snapshotEmailProperty: settings.snapshotEmailProperty,
        snapshotEmailLoans: settings.snapshotEmailLoans,
        snapshotEmailBudget: settings.snapshotEmailBudget,
        snapshotEmailSideIncome: settings.snapshotEmailSideIncome,
        snapshotEmailDividends: settings.snapshotEmailDividends,
        netIncome: Number(settings.netIncome),
      });

      const granteeEmails = settings.sharedAccessGrants.map(
        (grant) => grant.granteeEmail
      );
      const recipients = settings.ownerEmail
        ? [settings.ownerEmail, ...granteeEmails]
        : granteeEmails;

      const entitlements = computeEntitlements(settings);
      if (recipients.length > 0 && entitlements.limits.snapshotEmailsEnabled) {
        await sendSnapshotEmail(recipients, {
          snapshotDate: snapshot.snapshotDate,
          netWorth: Number(snapshot.netWorth),
          totalAssets: Number(snapshot.totalAssets),
          liabilitiesTotal: Number(snapshot.liabilitiesTotal),
          ownerEmail: settings.ownerEmail ?? "",
          sections,
        });
      } else {
        console.warn(
          `No recipients for settings ${settings.id} — ownerEmail not yet populated`
        );
      }

      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${settings.id}: ${message}`);
      console.error(`Failed to snapshot settings ${settings.id}:`, error);
    }
  }

  return Response.json({ processed, skipped, errors });
};
