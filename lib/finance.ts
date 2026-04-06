/**
 * Financial functions — JavaScript equivalents of Excel PMT, PV, FV, NPER, CUMIPMT.
 * Used for: FIRE projections, mortgage amortisation, loan payoff dates.
 *
 * Conventions match Excel:
 *  - pv (present value) is typically negative for loans
 *  - pmt is negative when paying out
 *  - Returns are positive for what you receive
 */

/**
 * Future Value of an annuity.
 * Excel: FV(rate, nper, pmt, [pv], [type])
 * type: 0 = payments at end of period, 1 = beginning
 */
export function fv(
  rate: number,
  nper: number,
  pmt: number,
  pv = 0,
  type = 0
): number {
  if (rate === 0) return -(pv + pmt * nper);
  const pvFactor = Math.pow(1 + rate, nper);
  const pmtFactor = ((1 + rate * type) * (pvFactor - 1)) / rate;
  return -(pv * pvFactor + pmt * pmtFactor);
}

/**
 * Present Value of an annuity.
 * Excel: PV(rate, nper, pmt, [fv], [type])
 */
export function pv(
  rate: number,
  nper: number,
  pmt: number,
  fvValue = 0,
  type = 0
): number {
  if (rate === 0) return -(pmt * nper + fvValue);
  const pvFactor = Math.pow(1 + rate, nper);
  const pmtFactor = ((1 + rate * type) * (pvFactor - 1)) / rate;
  return -(pmt * pmtFactor + fvValue) / pvFactor;
}

/**
 * Payment for a loan.
 * Excel: PMT(rate, nper, pv, [fv], [type])
 */
export function pmt(
  rate: number,
  nper: number,
  pvValue: number,
  fvValue = 0,
  type = 0
): number {
  if (rate === 0) return -(pvValue + fvValue) / nper;
  const pvFactor = Math.pow(1 + rate, nper);
  const pmtFactor = ((1 + rate * type) * (pvFactor - 1)) / rate;
  return -(pvValue * pvFactor + fvValue) / pmtFactor;
}

/**
 * Number of periods to reach a future value.
 * Excel: NPER(rate, pmt, pv, [fv], [type])
 */
export function nper(
  rate: number,
  pmtValue: number,
  pvValue: number,
  fvValue = 0,
  type = 0
): number {
  if (rate === 0) return -(pvValue + fvValue) / pmtValue;
  const r1 = pmtValue * (1 + rate * type);
  return (
    Math.log((r1 - fvValue * rate) / (r1 + pvValue * rate)) / Math.log(1 + rate)
  );
}

/**
 * Cumulative interest paid between two periods.
 * Excel: CUMIPMT(rate, nper, pv, start_period, end_period, type)
 * Returns negative value (interest is a cost).
 */
export function cumipmt(
  rate: number,
  nperTotal: number,
  pvValue: number,
  startPeriod: number,
  endPeriod: number,
  type = 0
): number {
  if (rate <= 0 || nperTotal <= 0 || pvValue <= 0) return 0;
  if (startPeriod < 1 || endPeriod < startPeriod || endPeriod > nperTotal) return 0;

  const pmtValue = pmt(rate, nperTotal, pvValue, 0, type);
  let interest = 0;
  let balance = pvValue;

  for (let per = 1; per <= endPeriod; per++) {
    const ipmt = type === 1 ? (per === 1 ? 0 : balance * rate) : balance * rate;
    if (per >= startPeriod) interest += ipmt;
    balance = balance + pmtValue + ipmt;
  }

  return interest;
}

/**
 * Compute current mortgage balance given start balance, rate, payment, and start date.
 * Returns the remaining balance as a positive number.
 */
export function mortgageBalance(
  startBalance: number,
  annualRate: number,
  monthlyPayment: number,
  startDate: Date,
  asOfDate: Date = new Date()
): number {
  const monthRate = annualRate / 12;
  const monthsElapsed =
    (asOfDate.getFullYear() - startDate.getFullYear()) * 12 +
    (asOfDate.getMonth() - startDate.getMonth());

  if (monthsElapsed <= 0) return startBalance;

  let balance = startBalance;
  for (let i = 0; i < monthsElapsed; i++) {
    const interest = balance * monthRate;
    const principal = monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
  }
  return balance;
}

/**
 * End of month date (like Excel EOMONTH(date, 0))
 */
export function eomonth(date: Date, monthOffset = 0): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + monthOffset + 1, 0);
  return d;
}
