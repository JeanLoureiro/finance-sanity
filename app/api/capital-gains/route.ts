import { prisma } from "@/lib/prisma";
import { computeFIFO, summariseCGTByFY, type Trade } from "@/lib/capitalGains";
import { getFiscalYear } from "@/lib/australianFY";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const fyParam = searchParams.get("fy");
    const fy = fyParam ? parseInt(fyParam) : null;

    const { settingsId } = await getAuthorisedSettings();
  const settings = await prisma.userSettings.findUnique({
    where: { id: settingsId },
      include: {
        etfHoldings: { include: { purchases: true } },
        stockHoldings: { include: { purchases: true } },
        managedFundHoldings: { include: { purchases: true } },
        cryptoHoldings: { include: { purchases: true } },
      },
    });

    if (!settings) return Response.json({ error: "No settings" }, { status: 404 });

    const shortRate = Number(settings.shortTermTaxRate);
    const longRate = Number(settings.longTermTaxRate);

    const trades: Trade[] = [];
    const assetTypeMap = new Map<string, string>();

    for (const h of settings.etfHoldings) {
      for (const p of h.purchases) {
        trades.push({ id: p.id, ticker: h.ticker, date: new Date(p.date), units: Number(p.units), price: Number(p.price), brokerage: Number(p.brokerage), direction: p.direction as "BUY" | "SELL" });
        assetTypeMap.set(p.id, "ETF");
      }
    }
    for (const h of settings.stockHoldings) {
      for (const p of h.purchases) {
        trades.push({ id: p.id, ticker: h.ticker, date: new Date(p.date), units: Number(p.units), price: Number(p.price), brokerage: Number(p.brokerage), direction: p.direction as "BUY" | "SELL" });
        assetTypeMap.set(p.id, "Stock");
      }
    }
    for (const h of settings.managedFundHoldings) {
      for (const p of h.purchases) {
        trades.push({ id: p.id, ticker: h.ticker, date: new Date(p.date), units: Number(p.units), price: Number(p.price), brokerage: Number(p.brokerage), direction: p.direction as "BUY" | "SELL" });
        assetTypeMap.set(p.id, "MF");
      }
    }
    for (const h of settings.cryptoHoldings) {
      for (const p of h.purchases) {
        trades.push({ id: p.id, ticker: h.ticker, date: new Date(p.date), units: Number(p.units), price: Number(p.price), brokerage: Number(p.brokerage), direction: p.direction as "BUY" | "SELL" });
        assetTypeMap.set(p.id, "Crypto");
      }
    }

    const allRows = computeFIFO(trades, shortRate, longRate);
    const summaries = summariseCGTByFY(allRows);
    const availableFYs = [...new Set(allRows.map((r) => getFiscalYear(r.date)))].sort();

    const filteredRows = fy ? allRows.filter((r) => getFiscalYear(r.date) === fy) : allRows;

    return Response.json({
      rows: filteredRows.map((r) => ({
        ...r,
        date: r.date.toISOString(),
        assetType: assetTypeMap.get(r.id) ?? "Unknown",
      })),
      summaries,
      availableFYs,
      rates: { shortRate, longRate },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to compute capital gains" }, { status: 500 });
  }
});
