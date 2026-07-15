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
 * Compute current mortgage/loan balance given start balance, rate, payment, and start date.
 * Returns the remaining balance as a positive number.
 *
 * @param paymentsPerYear  12 = monthly (default), 26 = fortnightly, 52 = weekly
 *                         The periodicPayment amount must match this frequency.
 */
export function mortgageBalance(
  startBalance: number,
  annualRate: number,
  periodicPayment: number,
  startDate: Date,
  asOfDate: Date = new Date(),
  paymentsPerYear: number = 12
): number {
  const periodRate = annualRate / paymentsPerYear;
  const daysPerPeriod = 365.25 / paymentsPerYear;
  const daysElapsed = (asOfDate.getTime() - startDate.getTime()) / 86_400_000;
  const periodsElapsed = Math.floor(daysElapsed / daysPerPeriod);

  if (periodsElapsed <= 0) return startBalance;

  let balance = startBalance;
  for (let i = 0; i < periodsElapsed; i++) {
    const interest = balance * periodRate;
    balance = Math.max(0, balance - (periodicPayment - interest));
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

export interface AmortizationRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface OneOffPayment {
  period: number;
  amount: number;
}

/**
 * Full period-by-period amortization schedule for a fixed-rate, fixed-term loan.
 * An optional recurring extra payment per period, and/or one-off lump-sum
 * payments at specific periods, are applied on top of the scheduled principal —
 * either can pay the loan off before `totalPeriods`.
 */
export function amortizationSchedule(
  loanAmount: number,
  annualRate: number,
  totalPeriods: number,
  paymentsPerYear: number,
  extraPaymentPerPeriod = 0,
  oneOffPayments: OneOffPayment[] = []
): AmortizationRow[] {
  const periodRate = annualRate / paymentsPerYear;
  const scheduledPayment = -pmt(periodRate, totalPeriods, loanAmount);

  const oneOffByPeriod = new Map<number, number>();
  for (const { period, amount } of oneOffPayments) {
    oneOffByPeriod.set(period, (oneOffByPeriod.get(period) ?? 0) + amount);
  }

  const rows: AmortizationRow[] = [];
  let balance = loanAmount;
  for (let period = 1; period <= totalPeriods && balance > 0; period++) {
    const interest = balance * periodRate;
    const oneOff = oneOffByPeriod.get(period) ?? 0;
    const uncappedPrincipal = scheduledPayment - interest + extraPaymentPerPeriod + oneOff;
    const isFinalPeriod = period === totalPeriods || uncappedPrincipal >= balance;
    const principal = isFinalPeriod ? balance : uncappedPrincipal;
    balance = isFinalPeriod ? 0 : balance - principal;
    rows.push({ period, payment: interest + principal, principal, interest, balance });
  }
  return rows;
}
