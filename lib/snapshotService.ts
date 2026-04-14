import { prisma } from "@/lib/prisma";
import { mortgageBalance } from "@/lib/finance";
import { computeFIFO, summariseCGTByFY, type Trade } from "@/lib/capitalGains";
import { getFiscalYear } from "@/lib/australianFY";
export async function recordSnapshotForSettings(
  settingsId: string,
  snapshotDate: Date
) {
  const settings = await prisma.userSettings.findUnique({
    where: { id: settingsId },
    include: {
      bankAccounts: true,
      etfHoldings: { include: { purchases: true } },
      stockHoldings: { include: { purchases: true } },
      managedFundHoldings: { include: { purchases: true } },
      cryptoHoldings: { include: { purchases: true } },
      otherAssets: true,
      properties: true,
      loans: true,
      superAccounts: true,
    },
  });

  if (!settings) {
    throw new Error(`No settings found for id: ${settingsId}`);
  }

  const cashTotal = settings.bankAccounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0
  );

  const etfCost = settings.etfHoldings.reduce(
    (sum, holding) =>
      sum +
      holding.purchases
        .filter((purchase) => purchase.direction === "BUY")
        .reduce(
          (acc, purchase) => acc + Number(purchase.units) * Number(purchase.price),
          0
        ),
    0
  );

  const stockCost = settings.stockHoldings.reduce(
    (sum, holding) =>
      sum +
      holding.purchases
        .filter((purchase) => purchase.direction === "BUY")
        .reduce(
          (acc, purchase) => acc + Number(purchase.units) * Number(purchase.price),
          0
        ),
    0
  );

  const managedFundCost = settings.managedFundHoldings.reduce(
    (sum, holding) =>
      sum +
      holding.purchases
        .filter((purchase) => purchase.direction === "BUY")
        .reduce(
          (acc, purchase) => acc + Number(purchase.units) * Number(purchase.price),
          0
        ),
    0
  );

  const cryptoCost = settings.cryptoHoldings.reduce(
    (sum, holding) =>
      sum +
      holding.purchases
        .filter((purchase) => purchase.direction === "BUY")
        .reduce(
          (acc, purchase) => acc + Number(purchase.units) * Number(purchase.price),
          0
        ),
    0
  );

  const otherTotal = settings.otherAssets.reduce((sum, asset) => {
    const remainingUnits = Number(asset.units) - Number(asset.soldUnits);
    return (
      sum +
      remainingUnits * Number(asset.liveUnitPrice ?? asset.unitPurchasePrice)
    );
  }, 0);

  const superTotal = settings.superAccounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0
  );

  const propertyValue = settings.properties.reduce(
    (sum, property) => sum + Number(property.currentValue),
    0
  );

  const mortgageTotal = settings.properties.reduce((sum, property) => {
    if (
      !property.mortgageStartDate ||
      !property.mortgageStartBalance ||
      !property.mortgageAnnualRate ||
      !property.mortgageMonthlyPayment
    ) {
      return sum;
    }
    return (
      sum +
      mortgageBalance(
        Number(property.mortgageStartBalance),
        Number(property.mortgageAnnualRate),
        Number(property.mortgageMonthlyPayment),
        new Date(property.mortgageStartDate)
      )
    );
  }, 0);

  const propertyEquity = propertyValue - mortgageTotal;

  const loansTotal = settings.loans.reduce(
    (sum, loan) => sum + Number(loan.startingBalance),
    0
  );

  let cgtLiability = 0;
  if (settings.cgtShowInLiabilities) {
    const trades: Trade[] = [];
    for (const holding of settings.etfHoldings) {
      for (const purchase of holding.purchases) {
        trades.push({
          id: purchase.id,
          ticker: holding.ticker,
          date: new Date(purchase.date),
          units: Number(purchase.units),
          price: Number(purchase.price),
          brokerage: Number(purchase.brokerage),
          direction: purchase.direction as "BUY" | "SELL",
        });
      }
    }
    for (const holding of settings.stockHoldings) {
      for (const purchase of holding.purchases) {
        trades.push({
          id: purchase.id,
          ticker: holding.ticker,
          date: new Date(purchase.date),
          units: Number(purchase.units),
          price: Number(purchase.price),
          brokerage: Number(purchase.brokerage),
          direction: purchase.direction as "BUY" | "SELL",
        });
      }
    }
    for (const holding of settings.managedFundHoldings) {
      for (const purchase of holding.purchases) {
        trades.push({
          id: purchase.id,
          ticker: holding.ticker,
          date: new Date(purchase.date),
          units: Number(purchase.units),
          price: Number(purchase.price),
          brokerage: Number(purchase.brokerage),
          direction: purchase.direction as "BUY" | "SELL",
        });
      }
    }
    for (const holding of settings.cryptoHoldings) {
      for (const purchase of holding.purchases) {
        trades.push({
          id: purchase.id,
          ticker: holding.ticker,
          date: new Date(purchase.date),
          units: Number(purchase.units),
          price: Number(purchase.price),
          brokerage: Number(purchase.brokerage),
          direction: purchase.direction as "BUY" | "SELL",
        });
      }
    }
    const shortRate = Number(settings.shortTermTaxRate);
    const longRate = Number(settings.longTermTaxRate);
    const allRows = computeFIFO(trades, shortRate, longRate);
    const currentFiscalYear = getFiscalYear(snapshotDate);
    const fiscalYearSummary = summariseCGTByFY(allRows, shortRate, longRate).find(
      (summary) => summary.fy === currentFiscalYear
    );
    cgtLiability = fiscalYearSummary?.estimatedTax ?? 0;
  }

  const liabilitiesTotal = mortgageTotal + loansTotal + cgtLiability;
  const totalAssets =
    cashTotal +
    etfCost +
    stockCost +
    managedFundCost +
    cryptoCost +
    otherTotal +
    superTotal +
    propertyValue;
  const netWorth = totalAssets - liabilitiesTotal;

  const snapshotData = {
    cashTotal,
    etfTotal: etfCost,
    stockTotal: stockCost,
    managedFundTotal: managedFundCost,
    cryptoTotal: cryptoCost,
    otherAssetsTotal: otherTotal,
    superTotal,
    propertyValue,
    propertyEquity,
    mortgageBalance: mortgageTotal,
    liabilitiesTotal,
    totalAssets,
    netWorth,
    salary: Number(settings.netIncome),
  };

  return prisma.monthlySnapshot.upsert({
    where: { settingsId_snapshotDate: { settingsId: settings.id, snapshotDate } },
    create: { settingsId: settings.id, snapshotDate, ...snapshotData },
    update: snapshotData,
  });
}
