/**
 * POST /api/import/purchases
 * Body: { csv: string }
 *
 * CSV format (header required):
 *   type,ticker,date,direction,units,price,brokerage
 *
 * type values: ETF | Stock | MF | Crypto
 * direction values: BUY | SELL
 * date: YYYY-MM-DD
 *
 * Finds or creates the holding by ticker+type, then creates purchases.
 * Returns: { imported: number, errors: string[] }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";

type AssetType = "ETF" | "Stock" | "MF" | "Crypto";

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function validateRow(row: Record<string, string>, index: number): string | null {
  const required = ["type", "ticker", "date", "direction", "units", "price"];
  for (const field of required) {
    if (!row[field]) return `Row ${index + 2}: missing field "${field}"`;
  }
  if (!["ETF", "Stock", "MF", "Crypto"].includes(row.type)) {
    return `Row ${index + 2}: type must be ETF, Stock, MF, or Crypto (got "${row.type}")`;
  }
  if (!["BUY", "SELL"].includes(row.direction.toUpperCase())) {
    return `Row ${index + 2}: direction must be BUY or SELL`;
  }
  if (isNaN(parseFloat(row.units)) || parseFloat(row.units) <= 0) {
    return `Row ${index + 2}: units must be a positive number`;
  }
  if (isNaN(parseFloat(row.price)) || parseFloat(row.price) < 0) {
    return `Row ${index + 2}: price must be a non-negative number`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
    return `Row ${index + 2}: date must be YYYY-MM-DD format`;
  }
  return null;
}

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { csv } = await req.json() as { csv: string };
    if (!csv || typeof csv !== "string") {
      return Response.json({ error: "Missing csv field" }, { status: 400 });
    }

    const { settingsId } = await getAuthorisedSettings("WRITE");
    const settings = await prisma.userSettings.findUnique({ where: { id: settingsId } });
    if (!settings) {
      return Response.json({ error: "No settings found" }, { status: 404 });
    }

    const rows = parseCSV(csv);
    if (rows.length === 0) {
      return Response.json({ error: "No data rows found in CSV" }, { status: 400 });
    }

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validationError = validateRow(row, i);
      if (validationError) { errors.push(validationError); continue; }

      const type = row.type as AssetType;
      const ticker = row.ticker.toUpperCase();
      const date = new Date(row.date + "T00:00:00.000Z");
      const direction = row.direction.toUpperCase() as "BUY" | "SELL";
      const units = parseFloat(row.units);
      const price = parseFloat(row.price);
      const brokerage = parseFloat(row.brokerage || "0") || 0;

      try {
        if (type === "ETF") {
          let holding = await prisma.eTFHolding.findFirst({ where: { settingsId: settings.id, ticker } });
          if (!holding) {
            holding = await prisma.eTFHolding.create({ data: { settingsId: settings.id, ticker, name: ticker } });
          }
          await prisma.eTFPurchase.create({ data: { holdingId: holding.id, date, units, price, brokerage, direction } });
        } else if (type === "Stock") {
          let holding = await prisma.stockHolding.findFirst({ where: { settingsId: settings.id, ticker } });
          if (!holding) {
            holding = await prisma.stockHolding.create({ data: { settingsId: settings.id, ticker, name: ticker } });
          }
          await prisma.stockPurchase.create({ data: { holdingId: holding.id, date, units, price, brokerage, direction } });
        } else if (type === "MF") {
          let holding = await prisma.managedFundHolding.findFirst({ where: { settingsId: settings.id, ticker } });
          if (!holding) {
            holding = await prisma.managedFundHolding.create({ data: { settingsId: settings.id, ticker, name: ticker } });
          }
          await prisma.managedFundPurchase.create({ data: { holdingId: holding.id, date, units, price, brokerage, direction } });
        } else if (type === "Crypto") {
          let holding = await prisma.cryptoHolding.findFirst({ where: { settingsId: settings.id, ticker } });
          if (!holding) {
            holding = await prisma.cryptoHolding.create({ data: { settingsId: settings.id, ticker, name: ticker } });
          }
          await prisma.cryptoPurchase.create({ data: { holdingId: holding.id, date, units, price, brokerage, direction } });
        }
        imported++;
      } catch (err) {
        errors.push(`Row ${i + 2}: database error — ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return Response.json({ imported, errors, total: rows.length });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to import purchases" }, { status: 500 });
  }
});
