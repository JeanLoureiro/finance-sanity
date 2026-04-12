import { prisma } from "@/lib/prisma";
import { fv, pv, nper } from "@/lib/finance";
import { mortgageBalance } from "@/lib/finance";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";

export type FIRERow = {
  year: number;
  age: number;
  investNW: number;
  superBal: number;
  nwTarget: number;         // PV needed this year to sustain spend until preservation
  surplus: number;          // investNW - nwTarget
  phase: "accumulation" | "drawdown" | "super-access";
  isPreSuperFIRE: boolean;
};

export type FIREResult = {
  // Inputs
  currentNW: number;
  currentSuper: number;
  yearlySpend: number;
  annualSavings: number;
  superContrib: number;
  marketReturn: number;
  inflationRate: number;
  withdrawalRate: number;
  netRate: number;
  currentAge: number;
  yearOfBirth: number;
  preservationAge: number;

  // Key targets
  preSuperFIRETarget: number;   // NW needed to sustain spend until preservation (E54 equivalent)
  superFIRETarget: number;      // Super balance for self-sustaining (yearlySpend / withdrawalRate)
  superAtFIRE: number;          // Projected super balance at pre-super FIRE date
  superNeeded: number;          // Additional super needed after FIRE (E63)

  // Timeline
  yearsToPreSuperFIRE: number;
  yearsOfSuperContrib: number;
  yearsToFIRE: number;
  preSuperFIREYear: number | null;
  superFIREYear: number | null;
  alreadyFIRE: boolean;

  // Projection
  rows: FIRERow[];
};

export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
  const settings = await prisma.userSettings.findUnique({
    where: { id: settingsId },
      include: {
        bankAccounts: true,
        etfHoldings: { include: { purchases: true } },
        stockHoldings: { include: { purchases: true } },
        managedFundHoldings: { include: { purchases: true } },
        cryptoHoldings: { include: { purchases: true } },
        superAccounts: true,
        properties: true,
        loans: true,
        monthlySnapshots: { orderBy: { snapshotDate: "asc" } },
      },
    });

    if (!settings) {
      return Response.json({ error: "No settings found" }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();
    const yearOfBirth = settings.yearOfBirth;
    const currentAge = currentYear - yearOfBirth;
    const preservationAge = settings.preservationAge;
    const inflationRate = Number(settings.inflationRate);
    const withdrawalRate = Number(settings.withdrawalRate);
    // Use bankInterestRate as market return proxy when marketReturnRate is 0
    const marketReturn = Number(settings.marketReturnRate) || Number(settings.bankInterestRate);
    const netRate = marketReturn - inflationRate;

    // Current investable NW (exc. property & super) — mirrors E45
    const cashTotal = settings.bankAccounts.reduce((s, a) => s + Number(a.balance), 0);
    const etfCost = settings.etfHoldings.reduce((s, h) =>
      s + h.purchases.filter(p => p.direction === "BUY")
        .reduce((a, p) => a + Number(p.units) * Number(p.price) + Number(p.brokerage), 0), 0);
    const stockCost = settings.stockHoldings.reduce((s, h) =>
      s + h.purchases.filter(p => p.direction === "BUY")
        .reduce((a, p) => a + Number(p.units) * Number(p.price) + Number(p.brokerage), 0), 0);
    const mfCost = settings.managedFundHoldings.reduce((s, h) =>
      s + h.purchases.filter(p => p.direction === "BUY")
        .reduce((a, p) => a + Number(p.units) * Number(p.price) + Number(p.brokerage), 0), 0);
    const cryptoCost = settings.cryptoHoldings.reduce((s, h) =>
      s + h.purchases.filter(p => p.direction === "BUY")
        .reduce((a, p) => a + Number(p.units) * Number(p.price) + Number(p.brokerage), 0), 0);

    const currentNW = cashTotal + etfCost + stockCost + mfCost + cryptoCost;
    const currentSuper = settings.superAccounts.reduce((s, a) => s + Number(a.balance), 0);

    // Annual super contribution: salary * superContribPct
    const superContrib = Number(settings.salary) * Number(settings.superContribPct);

    // Yearly spend & savings: 12-month average from snapshots, fallback to net income
    const recentSnapshots = settings.monthlySnapshots.slice(-12);
    const yearlySpend = recentSnapshots.length > 0
      ? recentSnapshots.reduce((s, snap) => s + (snap.monthlySpend ? Number(snap.monthlySpend) : 0), 0) /
        recentSnapshots.filter(s => s.monthlySpend).length * 12 || Number(settings.netIncome) * 12
      : Number(settings.netIncome) * 12;

    const annualSavings = recentSnapshots.length > 0
      ? recentSnapshots.reduce((s, snap) => s + (snap.monthlySavings ? Number(snap.monthlySavings) : 0), 0) /
        recentSnapshots.filter(s => s.monthlySavings).length * 12 || Number(settings.netIncome) * 12 * 0.2
      : Number(settings.netIncome) * 12 * 0.2;

    const yearsToPreservation = preservationAge - currentAge;

    // Pre-super FIRE target: NW needed to sustain yearlySpend until preservation age (E54)
    const preSuperFIRETarget = netRate !== 0
      ? Math.abs(pv(netRate, yearsToPreservation, -yearlySpend, 0))
      : yearlySpend * yearsToPreservation;

    // Super FIRE target: super balance that self-sustains at withdrawalRate (E60)
    const superFIRETarget = withdrawalRate > 0 ? yearlySpend / withdrawalRate : 0;

    // Years to pre-super FIRE: NPER to reach preSuperFIRETarget from currentNW with annualSavings (E56)
    const yearsToPreSuperFIRERaw = currentNW >= preSuperFIRETarget
      ? 0
      : (netRate !== 0 && annualSavings > 0)
        ? nper(netRate, annualSavings, currentNW, -preSuperFIRETarget)
        : (preSuperFIRETarget - currentNW) / annualSavings;
    const yearsToPreSuperFIRE = Math.max(0, Math.ceil(yearsToPreSuperFIRERaw));
    const preSuperFIREYear = currentNW >= preSuperFIRETarget ? currentYear : currentYear + yearsToPreSuperFIRE;

    // Super at pre-super FIRE date (E61): FV(netRate, yearsToFIRE, -superContrib, -currentSuper)
    const superAtFIRE = Math.abs(fv(netRate, yearsToPreSuperFIRE, -superContrib, -currentSuper));

    // Self-sustaining super balance needed before preservation age (E62)
    const yearsFromFIREToPreserv = yearsToPreservation - yearsToPreSuperFIRE;
    const superSelfSustaining = yearsFromFIREToPreserv > 0 && netRate !== 0
      ? Math.abs(pv(netRate, yearsFromFIREToPreserv, 0, -superFIRETarget))
      : superFIRETarget;

    // Additional super needed (E63)
    const superNeeded = Math.max(0, superSelfSustaining - superAtFIRE);

    // Years to grow super from superAtFIRE to superSelfSustaining (E64)
    const yearsOfSuperContribRaw = superAtFIRE >= superSelfSustaining
      ? 0
      : (netRate !== 0 && superContrib > 0)
        ? nper(netRate, superContrib, superAtFIRE, -superSelfSustaining)
        : (superSelfSustaining - superAtFIRE) / superContrib;
    const yearsOfSuperContrib = Math.max(0, Math.ceil(yearsOfSuperContribRaw));

    const alreadyFIRE = currentNW >= preSuperFIRETarget && currentSuper >= superFIRETarget;
    const yearsToFIRE = alreadyFIRE ? 0 : yearsToPreSuperFIRE + yearsOfSuperContrib;
    const superFIREYear = preSuperFIREYear + yearsOfSuperContrib;

    // Generate year-by-year projection rows
    const rows: FIRERow[] = [];
    let investNW = currentNW;
    let superBal = currentSuper;
    const maxYear = currentYear + Math.max(yearsToFIRE + 10, 20);

    for (let year = currentYear; year <= maxYear; year++) {
      const age = year - yearOfBirth;
      const yearsToPreserv = Math.max(0, preservationAge - age);
      const nwTarget = yearsToPreserv > 0 && netRate !== 0
        ? Math.abs(pv(netRate, yearsToPreserv, -yearlySpend, 0))
        : yearsToPreserv > 0 ? yearlySpend * yearsToPreserv : 0;
      const isPreSuperFIRE = investNW >= nwTarget || year >= preSuperFIREYear;
      const phase: FIRERow["phase"] =
        age >= preservationAge ? "super-access"
        : isPreSuperFIRE ? "drawdown"
        : "accumulation";

      rows.push({
        year,
        age,
        investNW: Math.round(investNW),
        superBal: Math.round(superBal),
        nwTarget: Math.round(nwTarget),
        surplus: Math.round(investNW - nwTarget),
        phase,
        isPreSuperFIRE,
      });

      // Advance balances
      if (!isPreSuperFIRE) {
        investNW = investNW * (1 + netRate) + annualSavings;
      } else if (age < preservationAge) {
        investNW = investNW * (1 + netRate) - yearlySpend;
      } else {
        // Super access: combined
        investNW = investNW * (1 + netRate) - Math.max(0, yearlySpend - superBal * withdrawalRate);
      }

      if (age < preservationAge) {
        superBal = superBal * (1 + netRate) + superContrib;
      }
    }

    const result: FIREResult = {
      currentNW, currentSuper, yearlySpend, annualSavings, superContrib,
      marketReturn, inflationRate, withdrawalRate, netRate,
      currentAge, yearOfBirth, preservationAge,
      preSuperFIRETarget, superFIRETarget, superAtFIRE, superNeeded,
      yearsToPreSuperFIRE, yearsOfSuperContrib, yearsToFIRE,
      preSuperFIREYear, superFIREYear,
      alreadyFIRE,
      rows,
    };

    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to compute FIRE projection" }, { status: 500 });
  }
});
