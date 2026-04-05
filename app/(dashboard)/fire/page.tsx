"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import type { FIREResult, FIRERow } from "@/app/api/fire/route";

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 }).format(v);

const fmtFull = (v: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{fmtCompact(value)}</span>
        <span>{pct.toFixed(1)}% of {fmtCompact(max)}</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PhaseChip({ phase }: { phase: FIRERow["phase"] }) {
  const map = {
    accumulation: "bg-blue-100 text-blue-700",
    drawdown: "bg-orange-100 text-orange-700",
    "super-access": "bg-green-100 text-green-700",
  };
  const label = { accumulation: "Accumulate", drawdown: "Drawdown", "super-access": "Super Access" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[phase]}`}>
      {label[phase]}
    </span>
  );
}

export default function FirePage() {
  const { data, isLoading } = useQuery<FIREResult>({
    queryKey: queryKeys.fire(),
    queryFn: () => fetch("/api/fire").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!data || (data as { error?: string }).error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">FIRE</h1>
        <p className="text-muted-foreground">Complete settings (year of birth, withdrawal rate, market return) to generate FIRE projections.</p>
      </div>
    );
  }

  const {
    yearsToFIRE, preSuperFIREYear, superFIREYear, alreadyFIRE,
    currentNW, currentSuper, preSuperFIRETarget, superFIRETarget,
    yearlySpend, annualSavings, superContrib,
    marketReturn, inflationRate, netRate, withdrawalRate,
    currentAge, preservationAge, yearOfBirth,
    yearsToPreSuperFIRE, yearsOfSuperContrib, superAtFIRE, superNeeded,
    rows,
  } = data;

  const headline = alreadyFIRE
    ? "You're FIRE! ✅"
    : `${yearsToFIRE} Year${yearsToFIRE !== 1 ? "s" : ""} to FIRE`;

  const fireAge = yearOfBirth + (preSuperFIREYear ?? 0) - new Date().getFullYear() + currentAge;

  // Chart data: investNW, nwTarget, superBal — limit to reasonable range
  const chartRows = rows.filter((r) => r.age <= preservationAge + 5);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-2 bg-primary text-primary-foreground">
          <CardContent className="pt-4">
            <p className="text-sm opacity-80">FIRE</p>
            <p className="text-4xl font-bold mt-1">{headline}</p>
            {!alreadyFIRE && (
              <p className="text-sm opacity-80 mt-2">
                Pre-super FIRE {preSuperFIREYear} (age {fireAge}) · Full FIRE {superFIREYear}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pre-Super FIRE in</p>
            <p className="text-3xl font-bold mt-1">{yearsToPreSuperFIRE} yrs</p>
            <p className="text-xs text-muted-foreground mt-1">{preSuperFIREYear} — age {fireAge}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Super self-sustains in</p>
            <p className="text-3xl font-bold mt-1">+{yearsOfSuperContrib} yrs</p>
            <p className="text-xs text-muted-foreground mt-1">{superFIREYear} — age {yearOfBirth + (superFIREYear ?? 0) - new Date().getFullYear() + currentAge}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Pre-Super NW Progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar value={currentNW} max={preSuperFIRETarget} color="bg-blue-500" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Current Investable NW</p>
                <p className="font-semibold"><CurrencyAmount value={currentNW} /></p>
              </div>
              <div>
                <p className="text-muted-foreground">Target (sustain until age {preservationAge})</p>
                <p className="font-semibold"><CurrencyAmount value={preSuperFIRETarget} /></p>
              </div>
              <div>
                <p className="text-muted-foreground">Annual Savings</p>
                <p className="font-semibold"><CurrencyAmount value={annualSavings} /></p>
              </div>
              <div>
                <p className="text-muted-foreground">Yearly Spend</p>
                <p className="font-semibold"><CurrencyAmount value={yearlySpend} /></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Super Progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar value={currentSuper} max={superFIRETarget} color="bg-slate-500" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Current Super</p>
                <p className="font-semibold"><CurrencyAmount value={currentSuper} /></p>
              </div>
              <div>
                <p className="text-muted-foreground">Target ({(withdrawalRate * 100).toFixed(0)}% SWR)</p>
                <p className="font-semibold"><CurrencyAmount value={superFIRETarget} /></p>
              </div>
              <div>
                <p className="text-muted-foreground">Super at FIRE Date</p>
                <p className="font-semibold"><CurrencyAmount value={superAtFIRE} /></p>
              </div>
              <div>
                <p className="text-muted-foreground">Super Still Needed</p>
                <p className="font-semibold"><CurrencyAmount value={superNeeded} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assumptions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Assumptions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              ["Market Return", `${(marketReturn * 100).toFixed(1)}%`],
              ["Inflation", `${(inflationRate * 100).toFixed(1)}%`],
              ["Net Real Rate", `${(netRate * 100).toFixed(2)}%`],
              ["Withdrawal Rate", `${(withdrawalRate * 100).toFixed(0)}% SWR`],
              ["Super Contribution", fmtFull(superContrib) + "/yr"],
              ["Preservation Age", String(preservationAge)],
              ["Current Age", String(currentAge)],
              ["Year of Birth", String(yearOfBirth)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projection chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">FIRE Projection</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartRows} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} width={65} />
              <Tooltip
                formatter={(v, name) => [fmtFull(Number(v)), name]}
                labelFormatter={(l) => `${l} (age ${Number(l) - yearOfBirth})`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {preSuperFIREYear && (
                <ReferenceLine x={preSuperFIREYear} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "Pre-FIRE", fontSize: 10, fill: "#22c55e" }} />
              )}
              <Area type="monotone" dataKey="nwTarget" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeWidth={1} name="NW Target" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="investNW" stroke="#2563eb" strokeWidth={2} dot={false} name="Investable NW" />
              <Line type="monotone" dataKey="superBal" stroke="#64748b" strokeWidth={2} dot={false} name="Super Balance" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Year-by-year table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Year-by-Year Projection</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-3 py-2">Year</th>
                  <th className="text-right px-3 py-2">Age</th>
                  <th className="text-right px-3 py-2">Investable NW</th>
                  <th className="text-right px-3 py-2">NW Target</th>
                  <th className="text-right px-3 py-2">Surplus</th>
                  <th className="text-right px-3 py-2">Super</th>
                  <th className="text-center px-3 py-2">Phase</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.year}
                    className={`border-b last:border-0 ${
                      row.year === preSuperFIREYear
                        ? "bg-green-50 font-semibold"
                        : row.year === superFIREYear
                        ? "bg-emerald-50 font-semibold"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="px-3 py-1.5">{row.year}</td>
                    <td className="px-3 py-1.5 text-right">{row.age}</td>
                    <td className="px-3 py-1.5 text-right">{fmtCompact(row.investNW)}</td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground">{fmtCompact(row.nwTarget)}</td>
                    <td className={`px-3 py-1.5 text-right ${row.surplus >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {row.surplus >= 0 ? "+" : ""}{fmtCompact(row.surplus)}
                    </td>
                    <td className="px-3 py-1.5 text-right">{fmtCompact(row.superBal)}</td>
                    <td className="px-3 py-1.5 text-center"><PhaseChip phase={row.phase} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
