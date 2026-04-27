import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { mortgageBalance } from "@/lib/finance";
import { computeFIFO, summariseCGTByFY, type Trade } from "@/lib/capitalGains";
import { getFiscalYear } from "@/lib/australianFY";

function freqToPPY(freq?: string | null): number {
  switch (freq) {
    case "weekly":
      return 52;
    case "fortnightly":
      return 26;
    case "monthly":
    default:
      return 12;
  }
}

function sumUnits(
  purchases: { direction: string; units: { toString(): string } }[],
  direction: "BUY" | "SELL"
): number {
  return purchases
    .filter((purchase) => purchase.direction === direction)
    .reduce(
      (acc, purchase) => acc.plus(new Decimal(purchase.units.toString())),
      new Decimal(0)
    )
    .toNumber();
}

function sumCostBasis(
  purchases: {
    direction: string;
    units: { toString(): string };
    price: { toString(): string };
    brokerage: { toString(): string };
  }[]
): number {
  return purchases
    .filter((purchase) => purchase.direction === "BUY")
    .reduce(
      (acc, purchase) =>
        acc.plus(
          new Decimal(purchase.units.toString())
            .times(new Decimal(purchase.price.toString()))
            .plus(new Decimal(purchase.brokerage.toString()))
        ),
      new Decimal(0)
    )
    .toNumber();
}

export type NetWorthData = {
  cashTotal: number;
  superTotal: number;
  propertyTotal: number;
  mortgageTotal: number;
  loansTotal: number;
  liabilitiesTotal: number;
  cgtLiability: number;
  etfHoldings: {
    id: string;
    ticker: string;
    name: string | null;
    targetAllocation: number;
    unitsHeld: number;
    costBasis: number;
  }[];
  stockHoldings: {
    id: string;
    ticker: string;
    name: string | null;
    targetAllocation: number;
    unitsHeld: number;
    costBasis: number;
  }[];
  cryptoHoldings: {
    id: string;
    ticker: string;
    name: string | null;
    targetAllocation: number;
    unitsHeld: number;
    costBasis: number;
  }[];
  allocationSettings: {
    etf: number;
    stock: number;
    crypto: number;
    cash: number;
    mf: number;
  };
  history: {
    date: Date;
    netWorth: number;
    cashTotal: number;
    etfTotal: number;
    stockTotal: number;
    managedFundTotal: number;
    cryptoTotal: number;
    superTotal: number;
    propertyValue: number;
    liabilitiesTotal: number;
    savingsRate: number | null;
  }[];
  properties: {
    id: string;
    name: string;
    purchaseValue: number;
    currentValue: number;
    netRentProfit: number;
    gain: number;
    currentMortgageBalance: number;
    mortgageRemainingBalance: number;
    equityLoanBalance: number;
    equity: number;
  }[];
  superAccounts: { id: string; name: string; provider: string | null; balance: number }[];
};

export async function computeNetWorth(settingsId: string): Promise<NetWorthData> {
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
      monthlySnapshots: { orderBy: { snapshotDate: "asc" } },
    },
  });

  if (!settings) {
    throw new Error("No settings found");
  }

  const cashTotal = settings.bankAccounts
    .reduce(
      (sum, account) => sum.plus(new Decimal(account.balance.toString())),
      new Decimal(0)
    )
    .toNumber();

  const etfHoldings = settings.etfHoldings.map((holding) => ({
    id: holding.id,
    ticker: holding.ticker,
    name: holding.name,
    targetAllocation: Number(holding.targetAllocation),
    unitsHeld: sumUnits(holding.purchases, "BUY") - sumUnits(holding.purchases, "SELL"),
    costBasis: sumCostBasis(holding.purchases),
  }));

  const stockHoldings = settings.stockHoldings.map((holding) => ({
    id: holding.id,
    ticker: holding.ticker,
    name: holding.name,
    targetAllocation: Number(holding.targetAllocation),
    unitsHeld: sumUnits(holding.purchases, "BUY") - sumUnits(holding.purchases, "SELL"),
    costBasis: sumCostBasis(holding.purchases),
  }));

  const cryptoHoldings = settings.cryptoHoldings.map((holding) => ({
    id: holding.id,
    ticker: holding.ticker,
    name: holding.name,
    targetAllocation: Number(holding.targetAllocation),
    unitsHeld: sumUnits(holding.purchases, "BUY") - sumUnits(holding.purchases, "SELL"),
    costBasis: sumCostBasis(holding.purchases),
  }));

  const superTotal = settings.superAccounts
    .reduce(
      (sum, account) => sum.plus(new Decimal(account.balance.toString())),
      new Decimal(0)
    )
    .toNumber();

  const asOfDate = new Date();
  const properties = settings.properties.map((property) => {
    const startBalance = Number(property.mortgageStartBalance ?? 0);
    let mortgageRemainingBalance = 0;

    if (startBalance > 0) {
      const override = property.mortgageCurrentBalance;
      if (override !== null && override !== undefined && Number(override) > 0) {
        mortgageRemainingBalance = Number(override);
      } else {
        const annualRate = Number(property.mortgageAnnualRate ?? 0);
        const periodicPayment = Number(property.mortgageMonthlyPayment ?? 0);
        const startDate = property.mortgageStartDate ? new Date(property.mortgageStartDate) : null;
        const paymentsPerYear = freqToPPY(property.mortgagePaymentFrequency ?? "monthly");

        if (startDate && annualRate > 0 && periodicPayment > 0) {
          mortgageRemainingBalance = mortgageBalance(
            startBalance,
            annualRate,
            periodicPayment,
            startDate,
            asOfDate,
            paymentsPerYear
          );
        }
      }
    }

    const equityLoanStartBalance = Number(property.equityLoanStartBalance ?? 0);
    let equityLoanBalance = 0;

    if (equityLoanStartBalance > 0) {
      const elOverride = property.equityLoanCurrentBalance;
      if (elOverride !== null && elOverride !== undefined && Number(elOverride) > 0) {
        equityLoanBalance = Number(elOverride);
      } else {
        const elRate = Number(property.equityLoanAnnualRate ?? 0);
        const elPayment = Number(property.equityLoanMonthlyPayment ?? 0);
        const elStartDate = property.equityLoanStartDate
          ? new Date(property.equityLoanStartDate)
          : null;
        const elPaymentsPerYear = freqToPPY(property.equityLoanPaymentFrequency ?? "monthly");

        if (elStartDate && elRate > 0 && elPayment > 0) {
          equityLoanBalance = mortgageBalance(
            equityLoanStartBalance,
            elRate,
            elPayment,
            elStartDate,
            asOfDate,
            elPaymentsPerYear
          );
        } else {
          equityLoanBalance = equityLoanStartBalance;
        }
      }
    }

    const totalPropertyDebt = mortgageRemainingBalance + equityLoanBalance;

    return {
      id: property.id,
      name: property.name,
      purchaseValue: Number(property.purchaseValue),
      currentValue: Number(property.currentValue),
      netRentProfit: Number(property.netRentProfit),
      gain: new Decimal(property.currentValue.toString())
        .minus(new Decimal(property.purchaseValue.toString()))
        .plus(new Decimal(property.netRentProfit.toString()))
        .toNumber(),
      currentMortgageBalance: totalPropertyDebt,
      mortgageRemainingBalance,
      equityLoanBalance,
      equity: Number(property.currentValue) - mortgageRemainingBalance,
    };
  });

  const propertyTotal = properties.reduce((sum, property) => sum + property.currentValue, 0);
  const mortgageTotal = properties.reduce(
    (sum, property) => sum + property.currentMortgageBalance,
    0
  );

  const loansTotal = settings.loans
    .reduce(
      (sum, loan) => sum.plus(new Decimal(loan.startingBalance.toString())),
      new Decimal(0)
    )
    .toNumber();

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
    const currentFY = getFiscalYear(new Date());
    const fySummary = summariseCGTByFY(allRows).find((summary) => summary.fy === currentFY);
    cgtLiability = fySummary?.estimatedTax ?? 0;
  }

  const allocationSettings = {
    etf: Number(settings.etfAllocation),
    stock: Number(settings.stockAllocation),
    crypto: Number(settings.cryptoAllocation),
    cash: Number(settings.cashAllocation),
    mf: Number(settings.mfAllocation),
  };

  const history = settings.monthlySnapshots.map((snapshot) => ({
    date: snapshot.snapshotDate,
    netWorth: Number(snapshot.netWorth),
    cashTotal: Number(snapshot.cashTotal),
    etfTotal: Number(snapshot.etfTotal),
    stockTotal: Number(snapshot.stockTotal),
    managedFundTotal: Number(snapshot.managedFundTotal),
    cryptoTotal: Number(snapshot.cryptoTotal),
    superTotal: Number(snapshot.superTotal),
    propertyValue: Number(snapshot.propertyValue),
    liabilitiesTotal: Number(snapshot.liabilitiesTotal),
    savingsRate: snapshot.savingsRate ? Number(snapshot.savingsRate) : null,
  }));

  const superAccounts = settings.superAccounts.map((account) => ({
    id: account.id,
    name: account.name,
    provider: account.provider,
    balance: Number(account.balance),
  }));

  return {
    cashTotal,
    superTotal,
    propertyTotal,
    mortgageTotal,
    loansTotal,
    liabilitiesTotal: mortgageTotal + loansTotal + cgtLiability,
    cgtLiability,
    etfHoldings,
    stockHoldings,
    cryptoHoldings,
    allocationSettings,
    history,
    properties,
    superAccounts,
  };
}
