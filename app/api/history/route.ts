import { prisma } from "@/lib/prisma";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";

export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();

    const snapshots = await prisma.monthlySnapshot.findMany({
      where: { settingsId },
      orderBy: { snapshotDate: "asc" },
    });

    return Response.json(
      snapshots.map((s) => ({
        ...s,
        date: s.snapshotDate.toISOString(),
        cashTotal: Number(s.cashTotal),
        etfTotal: Number(s.etfTotal),
        stockTotal: Number(s.stockTotal),
        managedFundTotal: Number(s.managedFundTotal),
        cryptoTotal: Number(s.cryptoTotal),
        otherAssetsTotal: Number(s.otherAssetsTotal),
        superTotal: Number(s.superTotal),
        propertyValue: Number(s.propertyValue),
        propertyEquity: Number(s.propertyEquity),
        mortgageBalance: Number(s.mortgageBalance),
        liabilitiesTotal: Number(s.liabilitiesTotal),
        salary: s.salary ? Number(s.salary) : null,
        sideIncome: s.sideIncome ? Number(s.sideIncome) : null,
        investmentsAdded: s.investmentsAdded ? Number(s.investmentsAdded) : null,
        monthlySavings: s.monthlySavings ? Number(s.monthlySavings) : null,
        savingsRate: s.savingsRate ? Number(s.savingsRate) : null,
        monthlySpend: s.monthlySpend ? Number(s.monthlySpend) : null,
        totalAssets: Number(s.totalAssets),
        netWorth: Number(s.netWorth),
      }))
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to load history" }, { status: 500 });
  }
});
