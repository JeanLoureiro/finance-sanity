import { prisma } from "@/lib/prisma";
import { mortgageBalance, eomonth } from "@/lib/finance";
import { computeFIFO, summariseCGTByFY, type Trade } from "@/lib/capitalGains";
import { getFiscalYear } from "@/lib/australianFY";

export async function POST() {
  try {
    const settings = await prisma.userSettings.findFirst({
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
      return Response.json({ error: "No settings found" }, { status: 404 });
    }

    const snapshotDate = eomonth(new Date());

    // Cash
    const cashTotal = settings.bankAccounts.reduce(
      (s, a) => s + Number(a.balance),
      0
    );

    // Investments — stored at cost basis (live prices not available server-side at record time)
    // The client should pass live prices; for now we store what we have
    const etfCost = settings.etfHoldings.reduce(
      (s, h) =>
        s +
        h.purchases
          .filter((p) => p.direction === "BUY")
          .reduce((acc, p) => acc + Number(p.units) * Number(p.price), 0),
      0
    );
    const stockCost = settings.stockHoldings.reduce(
      (s, h) =>
        s +
        h.purchases
          .filter((p) => p.direction === "BUY")
          .reduce((acc, p) => acc + Number(p.units) * Number(p.price), 0),
      0
    );
    const mfCost = settings.managedFundHoldings.reduce(
      (s, h) =>
        s +
        h.purchases
          .filter((p) => p.direction === "BUY")
          .reduce((acc, p) => acc + Number(p.units) * Number(p.price), 0),
      0
    );
    const cryptoCost = settings.cryptoHoldings.reduce(
      (s, h) =>
        s +
        h.purchases
          .filter((p) => p.direction === "BUY")
          .reduce((acc, p) => acc + Number(p.units) * Number(p.price), 0),
      0
    );
    const otherTotal = settings.otherAssets.reduce((s, a) => {
      const remaining = Number(a.units) - Number(a.soldUnits);
      return s + remaining * (Number(a.liveUnitPrice ?? a.unitPurchasePrice));
    }, 0);

    // Super
    const superTotal = settings.superAccounts.reduce(
      (s, a) => s + Number(a.balance),
      0
    );

    // Property & mortgage
    const propertyValue = settings.properties.reduce(
      (s, p) => s + Number(p.currentValue),
      0
    );
    const mortgageTotal = settings.properties.reduce((s, p) => {
      if (!p.mortgageStartDate || !p.mortgageStartBalance || !p.mortgageAnnualRate || !p.mortgageMonthlyPayment)
        return s;
      return (
        s +
        mortgageBalance(
          Number(p.mortgageStartBalance),
          Number(p.mortgageAnnualRate),
          Number(p.mortgageMonthlyPayment),
          new Date(p.mortgageStartDate)
        )
      );
    }, 0);
    const propertyEquity = propertyValue - mortgageTotal;

    // Loans
    const loansTotal = settings.loans.reduce(
      (s, l) => s + Number(l.startingBalance),
      0
    );
    // CGT liability for current FY
    let cgtLiability = 0;
    if (settings.cgtShowInLiabilities) {
      const trades: Trade[] = [];
      for (const h of settings.etfHoldings) {
        for (const p of h.purchases) {
          trades.push({ id: p.id, ticker: h.ticker, date: new Date(p.date), units: Number(p.units), price: Number(p.price), brokerage: Number(p.brokerage), direction: p.direction as "BUY" | "SELL" });
        }
      }
      for (const h of settings.stockHoldings) {
        for (const p of h.purchases) {
          trades.push({ id: p.id, ticker: h.ticker, date: new Date(p.date), units: Number(p.units), price: Number(p.price), brokerage: Number(p.brokerage), direction: p.direction as "BUY" | "SELL" });
        }
      }
      for (const h of settings.managedFundHoldings) {
        for (const p of h.purchases) {
          trades.push({ id: p.id, ticker: h.ticker, date: new Date(p.date), units: Number(p.units), price: Number(p.price), brokerage: Number(p.brokerage), direction: p.direction as "BUY" | "SELL" });
        }
      }
      for (const h of settings.cryptoHoldings) {
        for (const p of h.purchases) {
          trades.push({ id: p.id, ticker: h.ticker, date: new Date(p.date), units: Number(p.units), price: Number(p.price), brokerage: Number(p.brokerage), direction: p.direction as "BUY" | "SELL" });
        }
      }
      const shortRate = Number(settings.shortTermTaxRate);
      const longRate = Number(settings.longTermTaxRate);
      const allRows = computeFIFO(trades, shortRate, longRate);
      const currentFY = getFiscalYear(snapshotDate);
      const fySummary = summariseCGTByFY(allRows, shortRate, longRate).find((s) => s.fy === currentFY);
      cgtLiability = fySummary?.estimatedTax ?? 0;
    }

    const liabilitiesTotal = mortgageTotal + loansTotal + cgtLiability;

    const totalAssets =
      cashTotal + etfCost + stockCost + mfCost + cryptoCost + otherTotal + superTotal + propertyValue;
    const netWorth = totalAssets - liabilitiesTotal;

    const snapshot = await prisma.monthlySnapshot.upsert({
      where: { settingsId_snapshotDate: { settingsId: settings.id, snapshotDate } },
      create: {
        settingsId: settings.id,
        snapshotDate,
        cashTotal,
        etfTotal: etfCost,
        stockTotal: stockCost,
        managedFundTotal: mfCost,
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
      },
      update: {
        cashTotal,
        etfTotal: etfCost,
        stockTotal: stockCost,
        managedFundTotal: mfCost,
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
      },
    });

    return Response.json({ success: true, snapshot });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to record month" }, { status: 500 });
  }
}
