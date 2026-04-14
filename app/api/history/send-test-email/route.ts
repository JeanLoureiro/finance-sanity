import { prisma } from "@/lib/prisma";
import { recordSnapshotForSettings } from "@/lib/snapshotService";
import { fetchSnapshotEmailSections } from "@/lib/snapshotEmailSections";
import { sendSnapshotEmail } from "@/lib/email";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";

export const POST = withAuth(async () => {
  const { settingsId } = await getAuthorisedSettings("READ");

  const settings = await prisma.userSettings.findUnique({
    where: { id: settingsId },
    select: {
      ownerEmail: true,
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
    },
  });

  if (!settings) {
    return Response.json({ error: "Settings not found" }, { status: 404 });
  }

  if (!settings.ownerEmail) {
    return Response.json(
      { error: "No email address on your account. Visit the app once more to sync it." },
      { status: 400 }
    );
  }

  const snapshot = await recordSnapshotForSettings(settingsId, new Date());

  const sections = await fetchSnapshotEmailSections(settingsId, {
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

  const result = await sendSnapshotEmail([settings.ownerEmail], {
    snapshotDate: snapshot.snapshotDate,
    netWorth: Number(snapshot.netWorth),
    totalAssets: Number(snapshot.totalAssets),
    liabilitiesTotal: Number(snapshot.liabilitiesTotal),
    ownerEmail: settings.ownerEmail,
    sections,
  });

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json({ success: true, sentTo: settings.ownerEmail });
});
