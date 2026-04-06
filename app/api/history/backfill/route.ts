/**
 * POST /api/history/backfill
 * Body: { csv: string }
 *
 * CSV format (header required):
 *   date,cashTotal,etfTotal,stockTotal,cryptoTotal,superTotal,propertyValue,mortgageBalance,netWorth
 *
 * date: YYYY-MM-DD — snapped to end-of-month automatically
 * All monetary values: plain numbers (no $ symbols, no commas)
 *
 * Upserts MonthlySnapshot rows — safe to re-run.
 * Returns: { imported: number, errors: string[] }
 */

import { prisma } from "@/lib/prisma";

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

/** Returns last day of month for YYYY-MM-DD input (snapped to EOM). */
function endOfMonth(dateStr: string): Date {
  const [yr, mo] = dateStr.split("-").map(Number);
  // new Date(UTC, year, mo, 0): day 0 of month `mo` = last day of month `mo-1` (0-indexed).
  // Since JS months are 0-indexed, month `mo` (1-indexed) → index `mo`.
  // Day 0 of index `mo` = last day of index `mo-1` = last day of our month.
  return new Date(Date.UTC(yr, mo, 0));
}

export async function POST(request: Request) {
  try {
    const { csv } = await request.json() as { csv: string };
    if (!csv || typeof csv !== "string") {
      return Response.json({ error: "Missing csv field" }, { status: 400 });
    }

    const settings = await prisma.userSettings.findFirst();
    if (!settings) {
      return Response.json({ error: "No settings found" }, { status: 404 });
    }

    const rows = parseCSV(csv);
    if (rows.length === 0) {
      return Response.json({ error: "No data rows found" }, { status: 400 });
    }

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowLabel = `Row ${i + 2}`;

      if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
        errors.push(`${rowLabel}: invalid or missing date (expected YYYY-MM-DD)`);
        continue;
      }

      const n = (key: string) => {
        const val = parseFloat(row[key] || "0");
        return isNaN(val) ? 0 : val;
      };

      const cashTotal = n("cashtotal");
      const etfTotal = n("etftotal");
      const stockTotal = n("stocktotal");
      const managedFundTotal = n("managedFundTotal") || n("mftotal");
      const cryptoTotal = n("cryptototal");
      const otherAssetsTotal = n("otherassetstotal");
      const superTotal = n("supertotal");
      const propertyValue = n("propertyvalue");
      const mortgageBalance = n("mortgagebalance");
      const liabilitiesTotal = n("liabilitiestotal") || mortgageBalance;
      const totalAssets = cashTotal + etfTotal + stockTotal + managedFundTotal +
        cryptoTotal + otherAssetsTotal + superTotal + propertyValue;
      const netWorth = n("networth") || totalAssets - liabilitiesTotal;

      const snapshotDate = endOfMonth(row.date);

      try {
        await prisma.monthlySnapshot.upsert({
          where: { settingsId_snapshotDate: { settingsId: settings.id, snapshotDate } },
          create: {
            settingsId: settings.id, snapshotDate,
            cashTotal, etfTotal, stockTotal, managedFundTotal, cryptoTotal,
            otherAssetsTotal, superTotal, propertyValue,
            propertyEquity: propertyValue - mortgageBalance,
            mortgageBalance, liabilitiesTotal, totalAssets, netWorth,
          },
          update: {
            cashTotal, etfTotal, stockTotal, managedFundTotal, cryptoTotal,
            otherAssetsTotal, superTotal, propertyValue,
            propertyEquity: propertyValue - mortgageBalance,
            mortgageBalance, liabilitiesTotal, totalAssets, netWorth,
          },
        });
        imported++;
      } catch (err) {
        errors.push(`${rowLabel} (${row.date}): ${err instanceof Error ? err.message : "database error"}`);
      }
    }

    return Response.json({ imported, errors, total: rows.length });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to backfill history" }, { status: 500 });
  }
}
