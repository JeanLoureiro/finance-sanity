import { describe, it, expect } from "vitest";
import { pmt, pv, fv, nper, cumipmt, mortgageBalance, amortizationSchedule } from "./finance";

// All calculations cross-checked against Excel equivalents.

describe("pmt", () => {
  it("computes monthly mortgage repayment", () => {
    // Excel: PMT(0.065/12, 30*12, 450000) ≈ -2844.75
    const result = pmt(0.065 / 12, 30 * 12, 450000);
    expect(result).toBeCloseTo(-2844.75, 0);
  });

  it("returns zero-rate payment correctly", () => {
    // PMT(0, 12, 12000) = -1000
    expect(pmt(0, 12, 12000)).toBeCloseTo(-1000, 5);
  });

  it("handles future value term", () => {
    // Saving $100k over 10 years at 5%: pv=0, fv=-100000 → payment is positive (inflow)
    // PMT(0.05, 10, 0, -100000) ≈ +7950.46
    const result = pmt(0.05, 10, 0, -100000);
    expect(result).toBeCloseTo(7950.46, 0);
  });
});

describe("pv", () => {
  it("computes present value of annuity", () => {
    // Excel: PV(0.05, 10, -1000) ≈ 7721.73
    const result = pv(0.05, 10, -1000);
    expect(result).toBeCloseTo(7721.73, 0);
  });

  it("zero rate: pv = pmt * nper", () => {
    // PV(0, 12, -1000) = 12000
    expect(pv(0, 12, -1000)).toBeCloseTo(12000, 5);
  });

  it("computes pre-super FIRE target (real rate 3.04%, 13 years, $156,786/yr spend)", () => {
    // From spreadsheet: E54 = PV(0.0304, 13, -156785.94, 0) ≈ 1,663,154
    const result = pv(0.0304, 13, -156785.94);
    expect(result).toBeGreaterThan(1_600_000);
    expect(result).toBeLessThan(1_750_000);
  });
});

describe("fv", () => {
  it("computes future value of lump sum", () => {
    // Excel: FV(0.05, 10, 0, -10000) = 16288.95
    const result = fv(0.05, 10, 0, -10000);
    expect(result).toBeCloseTo(16288.95, 0);
  });

  it("computes future value with regular contributions", () => {
    // FV(0.05, 10, -1000, -10000): lump $10k + $1k/yr for 10 yrs at 5%
    // = 10000*1.05^10 + 1000*((1.05^10-1)/0.05) = 16288.95 + 12577.89 = 28866.84
    const result = fv(0.05, 10, -1000, -10000);
    expect(result).toBeCloseTo(28866.84, 0);
  });

  it("zero rate: fv = pv + pmt * nper", () => {
    // FV(0, 10, -1000, -5000) = 15000
    expect(fv(0, 10, -1000, -5000)).toBeCloseTo(15000, 5);
  });

  it("computes super projection at FIRE date", () => {
    // From spreadsheet: FV(0.0304, 10, -29500, -241752) ≈ 664,966
    const result = fv(0.0304, 10, -29500, -241752);
    expect(result).toBeCloseTo(664966, -3); // within $1000
  });
});

describe("nper", () => {
  it("computes years to reach savings target", () => {
    // NPER(0.05, -1000, 0, 10000): save $1k/yr at 5% to reach $10k
    // = ln(1.5) / ln(1.05) ≈ 8.31 years
    const result = nper(0.05, -1000, 0, 10000);
    expect(result).toBeCloseTo(8.31, 1);
  });

  it("zero rate: nper = fv / pmt", () => {
    // NPER(0, -1000, 0, 12000) = 12
    expect(nper(0, -1000, 0, 12000)).toBeCloseTo(12, 5);
  });

  it("computes years to pre-super FIRE", () => {
    // From spreadsheet: NPER(0.0304, 18418.32, 659275, -1098734.303) ≈ 9.95 → ROUNDUP = 10
    const result = nper(0.0304, 18418.32, 659275, -1098734.303);
    expect(Math.ceil(result)).toBe(10);
  });
});

describe("cumipmt", () => {
  it("computes cumulative interest for first year of mortgage", () => {
    // 30-year $450k mortgage at 6.5% — year 1 interest ~$29,130 (positive, cost to borrower)
    const result = cumipmt(0.065 / 12, 30 * 12, 450000, 1, 12);
    expect(result).toBeCloseTo(29130, -2); // within $100
  });

  it("returns 0 for invalid inputs", () => {
    expect(cumipmt(0, 360, 450000, 1, 12)).toBe(0);
    expect(cumipmt(-0.01, 360, 450000, 1, 12)).toBe(0);
  });
});

describe("mortgageBalance", () => {
  it("returns start balance at time zero", () => {
    const start = new Date("2024-01-01");
    expect(mortgageBalance(450000, 0.065, 2844.75, start, start)).toBeCloseTo(450000, 0);
  });

  it("reduces balance over time", () => {
    const start = new Date("2024-01-01");
    const after1yr = new Date("2025-01-01");
    const balance = mortgageBalance(450000, 0.065, 2844.75, start, after1yr);
    // After 1 year, balance should be less than 450k and more than 440k
    expect(balance).toBeLessThan(450000);
    expect(balance).toBeGreaterThan(440000);
  });

  it("pays off to zero eventually", () => {
    const start = new Date("2020-01-01");
    const after31yrs = new Date("2051-01-01");
    const balance = mortgageBalance(450000, 0.065, 2844.75, start, after31yrs);
    expect(balance).toBe(0);
  });

  it("returns start balance for past-dated asOfDate", () => {
    const start = new Date("2025-01-01");
    const before = new Date("2024-06-01");
    expect(mortgageBalance(450000, 0.065, 2844.75, start, before)).toBe(450000);
  });
});

describe("amortizationSchedule", () => {
  // 30-year $450k mortgage at 6.5% monthly — same worked example as pmt/cumipmt above.
  const schedule = amortizationSchedule(450000, 0.065, 30 * 12, 12);

  it("returns one row per period", () => {
    expect(schedule.length).toBe(30 * 12);
  });

  it("uses the PMT-derived payment for every row", () => {
    expect(schedule[0].payment).toBeCloseTo(2844.75, 0);
    expect(schedule[schedule.length - 1].payment).toBeCloseTo(2844.75, 0);
  });

  it("pays off the full loan amount in principal", () => {
    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBeCloseTo(450000, 0);
  });

  it("reaches a zero closing balance in the final period", () => {
    expect(schedule[schedule.length - 1].balance).toBe(0);
  });

  it("matches cumipmt for first-year interest", () => {
    const firstYearInterest = schedule.slice(0, 12).reduce((sum, row) => sum + row.interest, 0);
    const expected = cumipmt(0.065 / 12, 30 * 12, 450000, 1, 12);
    expect(firstYearInterest).toBeCloseTo(expected, 0);
  });

  it("pays the loan off early with a recurring extra payment", () => {
    const withExtra = amortizationSchedule(450000, 0.065, 30 * 12, 12, 500);
    expect(withExtra.length).toBeLessThan(schedule.length);

    const totalPrincipal = withExtra.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBeCloseTo(450000, 0);
    expect(withExtra[withExtra.length - 1].balance).toBe(0);

    const totalInterestWithExtra = withExtra.reduce((sum, row) => sum + row.interest, 0);
    const totalInterestBaseline = schedule.reduce((sum, row) => sum + row.interest, 0);
    expect(totalInterestWithExtra).toBeLessThan(totalInterestBaseline);
  });

  it("does not overpay the final period when the extra payment exceeds the remaining balance", () => {
    const withHugeExtra = amortizationSchedule(450000, 0.065, 30 * 12, 12, 50000);
    const lastRow = withHugeExtra[withHugeExtra.length - 1];
    expect(lastRow.balance).toBe(0);
    expect(lastRow.principal).toBeGreaterThan(0);
    const totalPrincipal = withHugeExtra.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBeCloseTo(450000, 0);
  });

  it("applies a one-off lump-sum payment at the given period", () => {
    const withLumpSum = amortizationSchedule(450000, 0.065, 30 * 12, 12, 0, [{ period: 12, amount: 20000 }]);
    // The lump sum period should show extra principal beyond the scheduled amount.
    const lumpSumRow = withLumpSum[11];
    const baselineRow = schedule[11];
    expect(lumpSumRow.principal).toBeCloseTo(baselineRow.principal + 20000, 0);

    const totalPrincipal = withLumpSum.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBeCloseTo(450000, 0);
    expect(withLumpSum[withLumpSum.length - 1].balance).toBe(0);
    expect(withLumpSum.length).toBeLessThan(schedule.length);
  });

  it("tracks the one-off portion of principal separately for the lump-sum period only", () => {
    const withLumpSum = amortizationSchedule(450000, 0.065, 30 * 12, 12, 0, [{ period: 12, amount: 20000 }]);
    expect(withLumpSum[11].oneOffPrincipal).toBeCloseTo(20000, 0);
    // Every other period has no one-off contribution.
    const otherPeriods = withLumpSum.filter((_, index) => index !== 11);
    expect(otherPeriods.every((row) => row.oneOffPrincipal === 0)).toBe(true);
  });

  it("does not overpay when a one-off payment exceeds the remaining balance", () => {
    const withHugeLumpSum = amortizationSchedule(450000, 0.065, 30 * 12, 12, 0, [{ period: 12, amount: 500000 }]);
    const lumpSumRow = withHugeLumpSum[11];
    expect(lumpSumRow.balance).toBe(0);
    expect(withHugeLumpSum.length).toBe(12);
    const totalPrincipal = withHugeLumpSum.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBeCloseTo(450000, 0);
    // The one-off portion actually applied should be capped by what was needed to clear the balance.
    expect(lumpSumRow.oneOffPrincipal).toBeCloseTo(lumpSumRow.principal - (schedule[11]?.principal ?? 0), 0);
  });

  it("sums multiple one-off payments landing on the same period", () => {
    const combined = amortizationSchedule(450000, 0.065, 30 * 12, 12, 0, [
      { period: 12, amount: 10000 },
      { period: 12, amount: 5000 },
    ]);
    const single = amortizationSchedule(450000, 0.065, 30 * 12, 12, 0, [{ period: 12, amount: 15000 }]);
    expect(combined[11].balance).toBeCloseTo(single[11].balance, 6);
  });
});
