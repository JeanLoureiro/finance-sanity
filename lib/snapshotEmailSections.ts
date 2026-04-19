import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { mortgageBalance } from "@/lib/finance";
import { getFiscalYear, getFYStartDate } from "@/lib/australianFY";

// ---------------------------------------------------------------------------
// Section types
// ---------------------------------------------------------------------------

export interface CashSection {
  accounts: { name: string; balance: number }[];
  total: number;
}

export interface HoldingLine {
  ticker: string;
  name: string | null;
  netUnits: number;
  costBasis: number;
}

export interface InvestmentSection {
  holdings: HoldingLine[];
  total: number;
}

export interface OtherAssetLine {
  description: string;
  value: number;
}

export interface OtherAssetsSection {
  assets: OtherAssetLine[];
  total: number;
}

export interface SuperSection {
  accounts: { name: string; provider: string | null; balance: number }[];
  total: number;
}

export interface PropertyLine {
  name: string;
  currentValue: number;
  mortgageBalance: number;
  equity: number;
}

export interface PropertySection {
  properties: PropertyLine[];
}

export interface LoanLine {
  name: string;
  currentBalance: number;
  annualRate: number;
  regularPayment: number;
}

export interface LoanSection {
  loans: LoanLine[];
  total: number;
}

export interface BudgetSection {
  monthlyIncome: number;
  monthlySpend: number;
  monthlySavings: number;
  savingsRate: number;
}

export interface SideIncomeSection {
  fyTotal: number;
  fyLabel: string;
}

export interface DividendSection {
  fyTotal: number;
  reinvested: number;
  cashReceived: number;
  fyLabel: string;
}

export interface SnapshotEmailSections {
  cash?: CashSection;
  etfs?: InvestmentSection;
  stocks?: InvestmentSection;
  managedFunds?: InvestmentSection;
  crypto?: InvestmentSection;
  otherAssets?: OtherAssetsSection;
  super?: SuperSection;
  property?: PropertySection;
  loans?: LoanSection;
  budget?: BudgetSection;
  sideIncome?: SideIncomeSection;
  dividends?: DividendSection;
}

export interface SectionFlags {
  snapshotEmailCash: boolean;
  snapshotEmailETFs: boolean;
  snapshotEmailStocks: boolean;
  snapshotEmailManagedFunds: boolean;
  snapshotEmailCrypto: boolean;
  snapshotEmailOtherAssets: boolean;
  snapshotEmailSuper: boolean;
  snapshotEmailProperty: boolean;
  snapshotEmailLoans: boolean;
  snapshotEmailBudget: boolean;
  snapshotEmailSideIncome: boolean;
  snapshotEmailDividends: boolean;
  netIncome: number;
}

// ---------------------------------------------------------------------------
// Data fetcher
// ---------------------------------------------------------------------------

export async function fetchSnapshotEmailSections(
  settingsId: string,
  flags: SectionFlags
): Promise<SnapshotEmailSections> {
  const sections: SnapshotEmailSections = {};
  const today = new Date();
  const currentFiscalYear = getFiscalYear(today);
  const fyStart = getFYStartDate(currentFiscalYear);
  const fyLabel = `FY${currentFiscalYear - 1}–${String(currentFiscalYear).slice(2)}`;

  // Cash
  if (flags.snapshotEmailCash) {
    const accounts = await prisma.bankAccount.findMany({
      where: { settingsId },
      select: { name: true, balance: true },
      orderBy: { sortOrder: "asc" },
    });
    const total = accounts.reduce(
      (sum, account) => sum.plus(new Decimal(account.balance.toString())),
      new Decimal(0)
    ).toNumber();
    sections.cash = {
      accounts: accounts.map((account) => ({ name: account.name, balance: Number(account.balance) })),
      total,
    };
  }

  // ETFs
  if (flags.snapshotEmailETFs) {
    const holdings = await prisma.eTFHolding.findMany({
      where: { settingsId },
      include: { purchases: true },
      orderBy: { sortOrder: "asc" },
    });
    sections.etfs = buildInvestmentSection(holdings);
  }

  // Stocks
  if (flags.snapshotEmailStocks) {
    const holdings = await prisma.stockHolding.findMany({
      where: { settingsId },
      include: { purchases: true },
      orderBy: { sortOrder: "asc" },
    });
    sections.stocks = buildInvestmentSection(holdings);
  }

  // Managed Funds
  if (flags.snapshotEmailManagedFunds) {
    const holdings = await prisma.managedFundHolding.findMany({
      where: { settingsId },
      include: { purchases: true },
      orderBy: { sortOrder: "asc" },
    });
    sections.managedFunds = buildInvestmentSection(holdings);
  }

  // Crypto
  if (flags.snapshotEmailCrypto) {
    const holdings = await prisma.cryptoHolding.findMany({
      where: { settingsId },
      include: { purchases: true },
      orderBy: { sortOrder: "asc" },
    });
    sections.crypto = buildInvestmentSection(holdings);
  }

  // Other Assets
  if (flags.snapshotEmailOtherAssets) {
    const assets = await prisma.otherAsset.findMany({ where: { settingsId } });
    const lines = assets.map((asset) => {
      const remainingUnits = new Decimal(asset.units.toString()).minus(new Decimal(asset.soldUnits.toString()));
      const pricePerUnit = new Decimal((asset.liveUnitPrice ?? asset.unitPurchasePrice).toString());
      return { description: asset.description, value: remainingUnits.times(pricePerUnit).toNumber() };
    });
    sections.otherAssets = {
      assets: lines,
      total: lines.reduce((sum, line) => sum + line.value, 0),
    };
  }

  // Super
  if (flags.snapshotEmailSuper) {
    const accounts = await prisma.superAccount.findMany({
      where: { settingsId },
      orderBy: { sortOrder: "asc" },
    });
    const total = accounts.reduce(
      (sum, account) => sum.plus(new Decimal(account.balance.toString())),
      new Decimal(0)
    ).toNumber();
    sections.super = {
      accounts: accounts.map((account) => ({
        name: account.name,
        provider: account.provider,
        balance: Number(account.balance),
      })),
      total,
    };
  }

  // Property
  if (flags.snapshotEmailProperty) {
    const properties = await prisma.property.findMany({ where: { settingsId } });
    sections.property = {
      properties: properties.map((property) => {
        const currentMortgageBalance =
          property.mortgageStartDate &&
          property.mortgageStartBalance &&
          property.mortgageAnnualRate &&
          property.mortgageMonthlyPayment
            ? mortgageBalance(
                Number(property.mortgageStartBalance),
                Number(property.mortgageAnnualRate),
                Number(property.mortgageMonthlyPayment),
                new Date(property.mortgageStartDate)
              )
            : 0;
        const currentValue = Number(property.currentValue);
        return {
          name: property.name,
          currentValue,
          mortgageBalance: currentMortgageBalance,
          equity: currentValue - currentMortgageBalance,
        };
      }),
    };
  }

  // Loans
  if (flags.snapshotEmailLoans) {
    const loans = await prisma.loan.findMany({ where: { settingsId } });
    const loanLines = loans.map((loan) => {
      const currentBalance = mortgageBalance(
        Number(loan.startingBalance),
        Number(loan.annualRate),
        Number(loan.regularPayment),
        new Date(loan.startDate)
      );
      return {
        name: loan.name,
        currentBalance: Math.max(0, currentBalance),
        annualRate: Number(loan.annualRate),
        regularPayment: Number(loan.regularPayment),
      };
    });
    sections.loans = {
      loans: loanLines,
      total: loanLines.reduce((sum, loan) => sum + loan.currentBalance, 0), // currentBalance is already a number from mortgageBalance()
    };
  }

  // Budget
  if (flags.snapshotEmailBudget) {
    const budgetItems = await prisma.budgetItem.findMany({ where: { settingsId } });
    const monthlySpend = budgetItems.reduce(
      (sum, item) => sum.plus(new Decimal(item.monthlyAmount.toString())),
      new Decimal(0)
    ).toNumber();
    const monthlyIncome = flags.netIncome;
    const monthlySavings = monthlyIncome - monthlySpend;
    const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0;
    sections.budget = { monthlyIncome, monthlySpend, monthlySavings, savingsRate };
  }

  // Side Income
  if (flags.snapshotEmailSideIncome) {
    const entries = await prisma.sideIncomeEntry.findMany({
      where: { settingsId, date: { gte: fyStart } },
    });
    const fyTotal = entries.reduce(
      (sum, entry) =>
        sum
          .plus(new Decimal(entry.sideIncome.toString()))
          .plus(new Decimal(entry.rentalIncome.toString())),
      new Decimal(0)
    ).toNumber();
    sections.sideIncome = { fyTotal, fyLabel };
  }

  // Dividends
  if (flags.snapshotEmailDividends) {
    const dividends = await prisma.dividend.findMany({
      where: { settingsId, paymentDate: { gte: fyStart } },
    });
    const fyTotal = dividends.reduce(
      (sum, dividend) => sum.plus(new Decimal(dividend.netAmount.toString())),
      new Decimal(0)
    ).toNumber();
    const reinvested = dividends
      .filter((dividend) => dividend.reinvested)
      .reduce(
        (sum, dividend) => sum.plus(new Decimal(dividend.netAmount.toString())),
        new Decimal(0)
      ).toNumber();
    sections.dividends = {
      fyTotal,
      reinvested,
      cashReceived: fyTotal - reinvested,
      fyLabel,
    };
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PurchaseLike {
  units: { toString(): string };
  price: { toString(): string };
  direction: string;
}

interface HoldingLike {
  ticker: string;
  name?: string | null;
  purchases: PurchaseLike[];
}

function buildInvestmentSection(holdings: HoldingLike[]): InvestmentSection {
  const lines: HoldingLine[] = holdings
    .map((holding) => {
      const buyUnits = holding.purchases
        .filter((purchase) => purchase.direction === "BUY")
        .reduce((sum, purchase) => sum.plus(new Decimal(purchase.units.toString())), new Decimal(0))
        .toNumber();
      const sellUnits = holding.purchases
        .filter((purchase) => purchase.direction === "SELL")
        .reduce((sum, purchase) => sum.plus(new Decimal(purchase.units.toString())), new Decimal(0))
        .toNumber();
      const netUnits = buyUnits - sellUnits;
      const costBasis = holding.purchases
        .filter((purchase) => purchase.direction === "BUY")
        .reduce(
          (sum, purchase) =>
            sum.plus(
              new Decimal(purchase.units.toString()).times(new Decimal(purchase.price.toString()))
            ),
          new Decimal(0)
        )
        .toNumber();
      return { ticker: holding.ticker, name: holding.name ?? null, netUnits, costBasis };
    })
    .filter((line) => line.netUnits > 0);

  return {
    holdings: lines,
    total: lines.reduce((sum, line) => sum + line.costBasis, 0),
  };
}
