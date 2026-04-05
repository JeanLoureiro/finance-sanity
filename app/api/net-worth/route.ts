import { prisma } from "@/lib/prisma";
import { mortgageBalance } from "@/lib/finance";

export async function GET() {
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
        monthlySnapshots: { orderBy: { snapshotDate: "asc" } },
      },
    });

    if (!settings) {
      return Response.json({ error: "No settings found" }, { status: 404 });
    }

    // Cash total
    const cashTotal = settings.bankAccounts.reduce(
      (s, a) => s + Number(a.balance),
      0
    );

    // Investment totals — sum of (units held × latest price placeholder)
    // Live prices are fetched client-side; here we return unit counts and cost bases
    const etfUnits = settings.etfHoldings.map((h) => ({
      id: h.id,
      ticker: h.ticker,
      name: h.name,
      targetAllocation: Number(h.targetAllocation),
      unitsHeld: h.purchases
        .filter((p) => p.direction === "BUY")
        .reduce((s, p) => s + Number(p.units), 0) -
        h.purchases
          .filter((p) => p.direction === "SELL")
          .reduce((s, p) => s + Number(p.units), 0),
      costBasis: h.purchases
        .filter((p) => p.direction === "BUY")
        .reduce((s, p) => s + Number(p.units) * Number(p.price) + Number(p.brokerage), 0),
    }));

    const stockUnits = settings.stockHoldings.map((h) => ({
      id: h.id,
      ticker: h.ticker,
      name: h.name,
      targetAllocation: Number(h.targetAllocation),
      unitsHeld: h.purchases
        .filter((p) => p.direction === "BUY")
        .reduce((s, p) => s + Number(p.units), 0) -
        h.purchases
          .filter((p) => p.direction === "SELL")
          .reduce((s, p) => s + Number(p.units), 0),
      costBasis: h.purchases
        .filter((p) => p.direction === "BUY")
        .reduce((s, p) => s + Number(p.units) * Number(p.price) + Number(p.brokerage), 0),
    }));

    const cryptoUnits = settings.cryptoHoldings.map((h) => ({
      id: h.id,
      ticker: h.ticker,
      name: h.name,
      targetAllocation: Number(h.targetAllocation),
      unitsHeld: h.purchases
        .filter((p) => p.direction === "BUY")
        .reduce((s, p) => s + Number(p.units), 0) -
        h.purchases
          .filter((p) => p.direction === "SELL")
          .reduce((s, p) => s + Number(p.units), 0),
      costBasis: h.purchases
        .filter((p) => p.direction === "BUY")
        .reduce((s, p) => s + Number(p.units) * Number(p.price) + Number(p.brokerage), 0),
    }));

    // Super total
    const superTotal = settings.superAccounts.reduce(
      (s, a) => s + Number(a.balance),
      0
    );

    // Property & mortgage
    const propertyData = settings.properties.map((p) => {
      const currentMortgage =
        p.mortgageStartDate && p.mortgageStartBalance && p.mortgageAnnualRate && p.mortgageMonthlyPayment
          ? mortgageBalance(
              Number(p.mortgageStartBalance),
              Number(p.mortgageAnnualRate),
              Number(p.mortgageMonthlyPayment),
              new Date(p.mortgageStartDate)
            )
          : 0;
      return {
        id: p.id,
        name: p.name,
        purchaseValue: Number(p.purchaseValue),
        currentValue: Number(p.currentValue),
        netRentProfit: Number(p.netRentProfit),
        gain: Number(p.currentValue) - Number(p.purchaseValue) + Number(p.netRentProfit),
        currentMortgageBalance: currentMortgage,
        equity: Number(p.currentValue) - currentMortgage,
      };
    });

    const propertyTotal = propertyData.reduce((s, p) => s + p.currentValue, 0);
    const mortgageTotal = propertyData.reduce((s, p) => s + p.currentMortgageBalance, 0);

    // Loans
    const loansTotal = settings.loans.reduce(
      (s, l) => s + Number(l.startingBalance),
      0
    );

    // Asset allocation
    const allocationSettings = {
      etf: Number(settings.etfAllocation),
      stock: Number(settings.stockAllocation),
      crypto: Number(settings.cryptoAllocation),
      cash: Number(settings.cashAllocation),
      mf: Number(settings.mfAllocation),
    };

    // History snapshots for chart
    const history = settings.monthlySnapshots.map((s) => ({
      date: s.snapshotDate,
      netWorth: Number(s.netWorth),
      cashTotal: Number(s.cashTotal),
      etfTotal: Number(s.etfTotal),
      stockTotal: Number(s.stockTotal),
      managedFundTotal: Number(s.managedFundTotal),
      cryptoTotal: Number(s.cryptoTotal),
      superTotal: Number(s.superTotal),
      propertyValue: Number(s.propertyValue),
      liabilitiesTotal: Number(s.liabilitiesTotal),
      savingsRate: s.savingsRate ? Number(s.savingsRate) : null,
    }));

    return Response.json({
      cashTotal,
      superTotal,
      propertyTotal,
      mortgageTotal,
      loansTotal,
      liabilitiesTotal: mortgageTotal + loansTotal,
      etfHoldings: etfUnits,
      stockHoldings: stockUnits,
      cryptoHoldings: cryptoUnits,
      allocationSettings,
      history,
      properties: propertyData,
      // superAccounts for display
      superAccounts: settings.superAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        provider: a.provider,
        balance: Number(a.balance),
      })),
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to compute net worth" }, { status: 500 });
  }
}
