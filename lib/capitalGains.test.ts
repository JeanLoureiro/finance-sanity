import { describe, it, expect } from "vitest";
import { computeFIFO, summariseCGTByFY, type Trade } from "./capitalGains";

const SHORT_RATE = 0.32;
const LONG_RATE = 0.16; // 50% AUS discount applied

function d(dateStr: string): Date {
  return new Date(dateStr);
}

describe("computeFIFO — BUY only", () => {
  it("records cumulative units and cost basis after a single BUY", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "A200", date: d("2024-01-15"), units: 100, price: 100, brokerage: 9.50, direction: "BUY" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    expect(rows).toHaveLength(1);
    expect(rows[0].cumulativeUnits).toBe(100);
    expect(rows[0].costBasis).toBeCloseTo(100 * 100 + 9.50);
    expect(rows[0].capitalGain).toBeNull();
    expect(rows[0].isLongTerm).toBeNull();
  });

  it("accumulates multiple BUYs correctly", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "A200", date: d("2024-01-15"), units: 100, price: 100, brokerage: 9.50, direction: "BUY" },
      { id: "2", ticker: "A200", date: d("2024-06-15"), units: 50,  price: 110, brokerage: 9.50, direction: "BUY" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    expect(rows).toHaveLength(2);
    expect(rows[1].cumulativeUnits).toBe(150);
    expect(rows[1].avgCostPerUnit).toBeCloseTo((100 * 100 + 9.50 + 50 * 110 + 9.50) / 150, 2);
  });
});

describe("computeFIFO — short-term SELL (≤12 months)", () => {
  it("computes capital gain correctly", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "A200", date: d("2024-01-15"), units: 100, price: 100, brokerage: 9.50, direction: "BUY" },
      { id: "2", ticker: "A200", date: d("2024-06-15"), units: 100, price: 120, brokerage: 9.50, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const sell = rows[1];
    // Cost of sold: (100 + 9.50/100) * 100 = 100*100 + 9.50 = 10009.50 (lot cost per unit * units)
    // Sale proceeds: 100*120 - 9.50 = 11990.50
    // Gain = 11990.50 - 10009.50 = 1981
    expect(sell.direction).toBe("SELL");
    expect(sell.capitalGain).toBeCloseTo(1981, 0);
    expect(sell.isLongTerm).toBe(false);
    expect(sell.taxOnGain).toBeCloseTo(1981 * SHORT_RATE, 0);
  });

  it("records zero remaining units after full sell", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "BTC", date: d("2024-01-01"), units: 1, price: 40000, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "BTC", date: d("2024-03-01"), units: 1, price: 60000, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    expect(rows[1].cumulativeUnits).toBe(0);
    expect(rows[1].costBasis).toBe(0);
  });
});

describe("computeFIFO — long-term SELL (>12 months)", () => {
  it("flags isLongTerm=true for assets held over 365 days", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "A200", date: d("2023-01-01"), units: 100, price: 100, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "A200", date: d("2024-02-01"), units: 100, price: 150, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const sell = rows[1];
    expect(sell.isLongTerm).toBe(true);
    // Gain = 100*150 - 100*100 = 5000; tax at longRate
    expect(sell.capitalGain).toBeCloseTo(5000, 0);
    expect(sell.taxOnGain).toBeCloseTo(5000 * LONG_RATE, 0);
  });

  it("uses long-term rate (half of short-term, 50% AUS discount)", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "QLTY", date: d("2022-06-01"), units: 50, price: 200, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "QLTY", date: d("2024-01-01"), units: 50, price: 300, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const sell = rows[1];
    const gain = sell.capitalGain!;
    expect(sell.taxOnGain).toBeCloseTo(gain * LONG_RATE, 2);
    expect(sell.taxOnGain).toBeCloseTo(gain * SHORT_RATE * 0.5, 2);
  });
});

describe("computeFIFO — partial sell and multiple lots", () => {
  it("partially depletes first lot on partial sell", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "A200", date: d("2023-01-01"), units: 100, price: 100, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "A200", date: d("2023-06-01"), units: 100, price: 110, brokerage: 0, direction: "BUY" },
      { id: "3", ticker: "A200", date: d("2024-01-02"), units: 50,  price: 130, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const sell = rows[2];
    // FIFO: 50 units from first lot (price 100). Gain = 50*(130-100) = 1500
    expect(sell.capitalGain).toBeCloseTo(1500, 0);
    // Held > 12 months (Jan 1 2023 → Jan 2 2024 = 366 days)
    expect(sell.isLongTerm).toBe(true);
    expect(sell.cumulativeUnits).toBe(150); // 200 - 50
  });

  it("spans across multiple lots on large sell", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "A200", date: d("2023-01-01"), units: 50, price: 100, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "A200", date: d("2023-03-01"), units: 50, price: 110, brokerage: 0, direction: "BUY" },
      { id: "3", ticker: "A200", date: d("2023-06-01"), units: 100, price: 130, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const sell = rows[2];
    // Cost: 50*100 + 50*110 = 10500; proceeds: 100*130 = 13000; gain = 2500
    expect(sell.capitalGain).toBeCloseTo(2500, 0);
    expect(sell.cumulativeUnits).toBe(0);
  });
});

describe("computeFIFO — capital loss", () => {
  it("records negative capital gain (loss) and zero tax", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "BTC", date: d("2024-01-01"), units: 1, price: 60000, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "BTC", date: d("2024-06-01"), units: 1, price: 40000, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const sell = rows[1];
    expect(sell.capitalGain).toBeCloseTo(-20000, 0);
    expect(sell.taxOnGain).toBe(0); // no tax on losses
  });
});

describe("computeFIFO — multiple tickers", () => {
  it("maintains separate lot queues per ticker", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "A200", date: d("2023-01-01"), units: 100, price: 100, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "BTC",  date: d("2023-01-01"), units: 1,   price: 30000, brokerage: 0, direction: "BUY" },
      { id: "3", ticker: "A200", date: d("2024-02-01"), units: 100, price: 150, brokerage: 0, direction: "SELL" },
      { id: "4", ticker: "BTC",  date: d("2024-02-01"), units: 1,   price: 50000, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const a200Sell = rows.find((r) => r.ticker === "A200" && r.direction === "SELL")!;
    const btcSell  = rows.find((r) => r.ticker === "BTC"  && r.direction === "SELL")!;
    expect(a200Sell.capitalGain).toBeCloseTo(5000, 0);
    expect(btcSell.capitalGain).toBeCloseTo(20000, 0);
  });
});

describe("summariseCGTByFY", () => {
  it("groups gains by Australian financial year (Jul–Jun)", () => {
    const trades: Trade[] = [
      // FY2024 sale (before Jul 2024)
      { id: "1", ticker: "A200", date: d("2023-06-01"), units: 100, price: 100, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "A200", date: d("2024-05-01"), units: 100, price: 120, brokerage: 0, direction: "SELL" },
      // FY2025 sale (after Jul 2024)
      { id: "3", ticker: "BTC",  date: d("2023-01-01"), units: 1,   price: 30000, brokerage: 0, direction: "BUY" },
      { id: "4", ticker: "BTC",  date: d("2024-08-01"), units: 1,   price: 50000, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const summaries = summariseCGTByFY(rows, SHORT_RATE, LONG_RATE);

    const fy2024 = summaries.find((s) => s.fy === 2024);
    const fy2025 = summaries.find((s) => s.fy === 2025);

    expect(fy2024).toBeDefined();
    expect(fy2025).toBeDefined();
    // A200 gain = 2000 (short-term — held < 12 months)
    expect(fy2024!.shortTermGain).toBeCloseTo(2000, 0);
    expect(fy2024!.longTermGain).toBeCloseTo(0, 0);
    // BTC gain = 20000 (long-term — held > 12 months)
    expect(fy2025!.longTermGain).toBeCloseTo(20000, 0);
    expect(fy2025!.estimatedTax).toBeCloseTo(20000 * LONG_RATE, 0);
  });

  it("a July 1 sale is FY of next year", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "A200", date: d("2024-01-01"), units: 10, price: 100, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "A200", date: d("2024-07-01"), units: 10, price: 110, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const summaries = summariseCGTByFY(rows, SHORT_RATE, LONG_RATE);
    // Jul 1 2024 → FY2025 (not FY2024)
    expect(summaries.find((s) => s.fy === 2025)).toBeDefined();
    expect(summaries.find((s) => s.fy === 2024)).toBeUndefined();
  });

  it("sums multiple sells in same FY", () => {
    const trades: Trade[] = [
      { id: "1", ticker: "A200", date: d("2024-01-01"), units: 100, price: 100, brokerage: 0, direction: "BUY" },
      { id: "2", ticker: "A200", date: d("2024-02-01"), units: 50,  price: 120, brokerage: 0, direction: "SELL" },
      { id: "3", ticker: "A200", date: d("2024-04-01"), units: 50,  price: 130, brokerage: 0, direction: "SELL" },
    ];
    const rows = computeFIFO(trades, SHORT_RATE, LONG_RATE);
    const summaries = summariseCGTByFY(rows, SHORT_RATE, LONG_RATE);
    const fy2024 = summaries.find((s) => s.fy === 2024)!;
    // First sell gain: 50*(120-100) = 1000; second sell gain: 50*(130-100) = 1500; total = 2500
    expect(fy2024.totalGain).toBeCloseTo(2500, 0);
  });
});
