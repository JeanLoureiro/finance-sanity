import Decimal from "decimal.js";
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
    (sum, account) => sum.plus(new Decimal(account.balance.toString())),
    new Decimal(0)
  );

  const etfCost = settings.etfHoldings.reduce(
    (sum, holding) =>
      sum.plus(
        holding.purchases
          .filter((purchase) => purchase.direction === "BUY")
          .reduce(
            (acc, purchase) =>
              acc.plus(
                new Decimal(purchase.units.toString()).times(new Decimal(purchase.price.toString()))
              ),
            new Decimal(0)
          )
      ),
    new Decimal(0)
  );

  const stockCost = settings.stockHoldings.reduce(
    (sum, holding) =>
      sum.plus(
        holding.purchases
          .filter((purchase) => purchase.direction === "BUY")
          .reduce(
            (acc, purchase) =>
              acc.plus(
                new Decimal(purchase.units.toString()).times(new Decimal(purchase.price.toString()))
              ),
            new Decimal(0)
          )
      ),
    new Decimal(0)
  );

  const managedFundCost = settings.managedFundHoldings.reduce(
    (sum, holding) =>
      sum.plus(
        holding.purchases
          .filter((purchase) => purchase.direction === "BUY")
          .reduce(
            (acc, purchase) =>
              acc.plus(
                new Decimal(purchase.units.toString()).times(new Decimal(purchase.price.toString()))
              ),
            new Decimal(0)
          )
      ),
    new Decimal(0)
  );

  const cryptoCost = settings.cryptoHoldings.reduce(
    (sum, holding) =>
      sum.plus(
        holding.purchases
          .filter((purchase) => purchase.direction === "BUY")
          .reduce(
            (acc, purchase) =>
              acc.plus(
                new Decimal(purchase.units.toString()).times(new Decimal(purchase.price.toString()))
              ),
            new Decimal(0)
          )
      ),
    new Decimal(0)
  );

  const otherTotal = settings.otherAssets.reduce((sum, asset) => {
    const remainingUnits = new Decimal(asset.units.toString()).minus(new Decimal(asset.soldUnits.toString()));
    const unitPrice = new Decimal((asset.liveUnitPrice ?? asset.unitPurchasePrice).toString());
    return sum.plus(remainingUnits.times(unitPrice));
  }, new Decimal(0));

  const superTotal = settings.superAccounts.reduce(
    (sum, account) => sum.plus(new Decimal(account.balance.toString())),
    new Decimal(0)
  );

  const propertyValue = settings.properties.reduce(
    (sum, property) => sum.plus(new Decimal(property.currentValue.toString())),
    new Decimal(0)
  );

  // mortgageBalance() is a number-based function — convert at boundary only
  const mortgageTotal = settings.properties.reduce((sum, property) => {
    if (
      !property.mortgageStartDate ||
      !property.mortgageStartBalance ||
      !property.mortgageAnnualRate ||
      !property.mortgageMonthlyPayment
    ) {
      return sum;
    }
    const balance = mortgageBalance(
      new Decimal(property.mortgageStartBalance.toString()).toNumber(),
      new Decimal(property.mortgageAnnualRate.toString()).toNumber(),
      new Decimal(property.mortgageMonthlyPayment.toString()).toNumber(),
      new Date(property.mortgageStartDate)
    );
    return sum.plus(new Decimal(balance));
  }, new Decimal(0));

  const propertyEquity = propertyValue.minus(mortgageTotal);

  const loansTotal = settings.loans.reduce(
    (sum, loan) => sum.plus(new Decimal(loan.startingBalance.toString())),
    new Decimal(0)
  );

  let cgtLiability = new Decimal(0);
  if (settings.cgtShowInLiabilities) {
    // computeFIFO / Trade interface uses plain numbers — convert at boundary only
    const trades: Trade[] = [];
    for (const holding of settings.etfHoldings) {
      for (const purchase of holding.purchases) {
        trades.push({
          id: purchase.id,
          ticker: holding.ticker,
          date: new Date(purchase.date),
          units: new Decimal(purchase.units.toString()).toNumber(),
          price: new Decimal(purchase.price.toString()).toNumber(),
          brokerage: new Decimal(purchase.brokerage.toString()).toNumber(),
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
          units: new Decimal(purchase.units.toString()).toNumber(),
          price: new Decimal(purchase.price.toString()).toNumber(),
          brokerage: new Decimal(purchase.brokerage.toString()).toNumber(),
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
          units: new Decimal(purchase.units.toString()).toNumber(),
          price: new Decimal(purchase.price.toString()).toNumber(),
          brokerage: new Decimal(purchase.brokerage.toString()).toNumber(),
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
          units: new Decimal(purchase.units.toString()).toNumber(),
          price: new Decimal(purchase.price.toString()).toNumber(),
          brokerage: new Decimal(purchase.brokerage.toString()).toNumber(),
          direction: purchase.direction as "BUY" | "SELL",
        });
      }
    }
    const shortRate = new Decimal(settings.shortTermTaxRate.toString()).toNumber();
    const longRate = new Decimal(settings.longTermTaxRate.toString()).toNumber();
    const allRows = computeFIFO(trades, shortRate, longRate);
    const currentFiscalYear = getFiscalYear(snapshotDate);
    const fiscalYearSummary = summariseCGTByFY(allRows).find(
      (summary) => summary.fy === currentFiscalYear
    );
    cgtLiability = new Decimal(fiscalYearSummary?.estimatedTax ?? 0);
  }

  const liabilitiesTotal = mortgageTotal.plus(loansTotal).plus(cgtLiability);
  const totalAssets = cashTotal
    .plus(etfCost)
    .plus(stockCost)
    .plus(managedFundCost)
    .plus(cryptoCost)
    .plus(otherTotal)
    .plus(superTotal)
    .plus(propertyValue);
  const netWorth = totalAssets.minus(liabilitiesTotal);

  const snapshotData = {
    cashTotal: cashTotal.toNumber(),
    etfTotal: etfCost.toNumber(),
    stockTotal: stockCost.toNumber(),
    managedFundTotal: managedFundCost.toNumber(),
    cryptoTotal: cryptoCost.toNumber(),
    otherAssetsTotal: otherTotal.toNumber(),
    superTotal: superTotal.toNumber(),
    propertyValue: propertyValue.toNumber(),
    propertyEquity: propertyEquity.toNumber(),
    mortgageBalance: mortgageTotal.toNumber(),
    liabilitiesTotal: liabilitiesTotal.toNumber(),
    totalAssets: totalAssets.toNumber(),
    netWorth: netWorth.toNumber(),
    salary: new Decimal(settings.netIncome.toString()).toNumber(),
  };

  return prisma.monthlySnapshot.upsert({
    where: { settingsId_snapshotDate: { settingsId: settings.id, snapshotDate } },
    create: { settingsId: settings.id, snapshotDate, ...snapshotData },
    update: snapshotData,
  });
}
