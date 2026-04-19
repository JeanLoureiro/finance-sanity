/**
 * FIFO Capital Gains engine.
 * Reproduces the logic of the Capital Gains sheet (rows 2-600).
 *
 * Australian CGT rules:
 * - Assets held > 12 months qualify for 50% discount
 * - The longTermTaxRate passed in should already reflect this
 *   (e.g. short=0.32, long=0.16 = half of short rate)
 */

export interface Trade {
  id: string;
  ticker: string;
  date: Date;
  units: number;    // always positive
  price: number;
  brokerage: number;
  direction: "BUY" | "SELL";
}

export interface CGTRow extends Trade {
  cumulativeUnits: number;
  costBasis: number;           // running total cost of remaining units
  avgCostPerUnit: number;
  capitalGain: number | null;  // null for BUY rows
  isLongTerm: boolean | null;
  taxOnGain: number | null;
}

interface Lot {
  units: number;
  price: number;
  date: Date;
  brokerage: number;
}

export function computeFIFO(
  trades: Trade[],
  shortTermRate: number,
  longTermRate: number
): CGTRow[] {
  // Sort all trades by date ascending, then BUY before SELL on same date
  const sorted = [...trades].sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    if (diff !== 0) return diff;
    if (a.direction === "BUY" && b.direction === "SELL") return -1;
    if (a.direction === "SELL" && b.direction === "BUY") return 1;
    return 0;
  });

  // Per-ticker FIFO lot queue
  const lotQueues = new Map<string, Lot[]>();
  const results: CGTRow[] = [];

  for (const trade of sorted) {
    if (!lotQueues.has(trade.ticker)) {
      lotQueues.set(trade.ticker, []);
    }
    const queue = lotQueues.get(trade.ticker)!;

    if (trade.direction === "BUY") {
      queue.push({
        units: trade.units,
        price: trade.price,
        date: trade.date,
        brokerage: trade.brokerage,
      });

      const totalUnits = queue.reduce((s, l) => s + l.units, 0);
      const totalCost = queue.reduce((s, l) => s + l.units * l.price + l.brokerage, 0);

      results.push({
        ...trade,
        cumulativeUnits: totalUnits,
        costBasis: totalCost,
        avgCostPerUnit: totalUnits > 0 ? totalCost / totalUnits : 0,
        capitalGain: null,
        isLongTerm: null,
        taxOnGain: null,
      });
    } else {
      // SELL — dequeue FIFO lots
      let unitsToSell = trade.units;
      let totalCostOfSold = 0;
      let isLongTerm = false;

      while (unitsToSell > 0 && queue.length > 0) {
        const lot = queue[0];
        const soldFromLot = Math.min(unitsToSell, lot.units);

        const lotCostPerUnit = lot.price + lot.brokerage / lot.units;
        totalCostOfSold += soldFromLot * lotCostPerUnit;

        // Check if this lot was held > 12 months
        const heldMs = trade.date.getTime() - lot.date.getTime();
        const heldDays = heldMs / (1000 * 60 * 60 * 24);
        if (heldDays > 365) isLongTerm = true;

        lot.units -= soldFromLot;
        if (lot.units <= 0) queue.shift();

        unitsToSell -= soldFromLot;
      }

      const saleProceeds = trade.units * trade.price - trade.brokerage;
      const capitalGain = saleProceeds - totalCostOfSold;
      const taxOnGain = capitalGain > 0
        ? capitalGain * (isLongTerm ? longTermRate : shortTermRate)
        : 0;

      const totalUnits = queue.reduce((s, l) => s + l.units, 0);
      const totalCost = queue.reduce((s, l) => s + l.units * l.price + l.brokerage, 0);

      results.push({
        ...trade,
        cumulativeUnits: totalUnits,
        costBasis: totalCost,
        avgCostPerUnit: totalUnits > 0 ? totalCost / totalUnits : 0,
        capitalGain,
        isLongTerm,
        taxOnGain,
      });
    }
  }

  return results;
}

export interface CGTSummary {
  fy: number;
  shortTermGain: number;
  longTermGain: number;
  totalGain: number;
  estimatedTax: number;
}

export function summariseCGTByFY(rows: CGTRow[]): CGTSummary[] {
  const fyMap = new Map<number, CGTSummary>();

  for (const row of rows) {
    if (row.capitalGain === null || row.capitalGain === undefined) continue;

    // AUS FY: July → next year
    const fy =
      row.date.getMonth() >= 6 ? row.date.getFullYear() + 1 : row.date.getFullYear();

    if (!fyMap.has(fy)) {
      fyMap.set(fy, {
        fy,
        shortTermGain: 0,
        longTermGain: 0,
        totalGain: 0,
        estimatedTax: 0,
      });
    }

    const summary = fyMap.get(fy)!;
    if (row.isLongTerm) {
      summary.longTermGain += row.capitalGain;
    } else {
      summary.shortTermGain += row.capitalGain;
    }
    summary.totalGain += row.capitalGain;
    summary.estimatedTax += row.taxOnGain ?? 0;
  }

  return Array.from(fyMap.values()).sort((a, b) => a.fy - b.fy);
}
