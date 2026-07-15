"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { pmt, nper, amortizationSchedule, type OneOffPayment } from "@/lib/finance";
import { PAYMENT_FREQUENCIES, freqToPPY } from "./PropertyClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Kpi } from "@/components/ui/kpi";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, PlusCircle, Trash2 } from "lucide-react";

const RepaymentChart = dynamic(() => import("./RepaymentChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[328px] w-full" />,
});

const fmtFull = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value);

interface CalculatorProperty {
  id: string;
  name: string;
  mortgageStartDate: string | null;
  mortgageAnnualRate: string | number | null;
  mortgageMonthlyPayment: string | number | null;
  mortgageStartBalance: string | number | null;
  mortgageCurrentBalance: string | number | null;
  mortgagePaymentFrequency: string;
}

interface RepaymentCalculatorProps {
  properties: CalculatorProperty[];
}

interface OneOffPaymentEntry {
  id: string;
  year: number;
  amount: number;
}

export default function RepaymentCalculator({ properties }: RepaymentCalculatorProps) {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("custom");
  const [loanAmount, setLoanAmount] = useState(600000);
  const [interestRatePct, setInterestRatePct] = useState(6);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [frequency, setFrequency] = useState<string>("monthly");
  const [extraPayment, setExtraPayment] = useState(0);
  const [oneOffPayments, setOneOffPayments] = useState<OneOffPaymentEntry[]>([]);
  const [newOneOffYear, setNewOneOffYear] = useState(1);
  const [newOneOffAmount, setNewOneOffAmount] = useState(10000);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  function addOneOffPayment() {
    if (newOneOffAmount <= 0 || newOneOffYear < 1) return;
    setOneOffPayments((entries) => [...entries, { id: crypto.randomUUID(), year: newOneOffYear, amount: newOneOffAmount }]);
  }

  function removeOneOffPayment(id: string) {
    setOneOffPayments((entries) => entries.filter((entry) => entry.id !== id));
  }

  const eligibleProperties = properties.filter((p) => p.mortgageStartBalance && Number(p.mortgageStartBalance) > 0);

  function applyProperty(propertyId: string | null) {
    if (!propertyId) return;
    setSelectedPropertyId(propertyId);
    if (propertyId === "custom") return;

    const property = properties.find((p) => p.id === propertyId);
    if (!property) return;

    const balance = property.mortgageCurrentBalance && Number(property.mortgageCurrentBalance) > 0
      ? Number(property.mortgageCurrentBalance)
      : Number(property.mortgageStartBalance ?? 0);
    const annualRate = Number(property.mortgageAnnualRate ?? 0);
    const payment = Number(property.mortgageMonthlyPayment ?? 0);
    const ppy = freqToPPY(property.mortgagePaymentFrequency ?? "monthly");

    if (balance > 0) setLoanAmount(Math.round(balance));
    if (annualRate > 0) setInterestRatePct(Number((annualRate * 100).toFixed(3)));
    setFrequency(property.mortgagePaymentFrequency ?? "monthly");

    if (annualRate > 0 && payment > 0) {
      const periodsLeft = nper(annualRate / ppy, -payment, balance, 0);
      const yearsLeft = Math.round(periodsLeft / ppy);
      if (yearsLeft > 0 && yearsLeft < 60) setLoanTermYears(yearsLeft);
    }
  }

  const annualRate = interestRatePct / 100;

  const comparisonRows = useMemo(() => {
    return PAYMENT_FREQUENCIES.map((f) => {
      const totalPeriods = loanTermYears * f.ppy;
      const periodicPayment = loanAmount > 0 && annualRate > 0 && totalPeriods > 0
        ? -pmt(annualRate / f.ppy, totalPeriods, loanAmount)
        : 0;
      const totalCost = periodicPayment * totalPeriods;
      const totalInterest = totalCost - loanAmount;
      return { ...f, periodicPayment, totalInterest, totalCost };
    });
  }, [loanAmount, annualRate, loanTermYears]);

  const monthlyRow = comparisonRows.find((r) => r.value === "monthly");
  const selectedRow = comparisonRows.find((r) => r.value === frequency) ?? comparisonRows[0];

  const selectedPpy = freqToPPY(frequency);
  const totalPeriods = loanTermYears * selectedPpy;

  const oneOffPaymentPeriods = useMemo<OneOffPayment[]>(() => {
    return oneOffPayments.map((entry) => ({
      period: Math.min(totalPeriods, Math.max(1, Math.round((entry.year - 1) * selectedPpy + 1))),
      amount: entry.amount,
    }));
  }, [oneOffPayments, selectedPpy, totalPeriods]);

  const schedule = useMemo(() => {
    if (loanAmount <= 0 || annualRate <= 0 || totalPeriods <= 0) return [];
    return amortizationSchedule(loanAmount, annualRate, totalPeriods, selectedPpy, Math.max(0, extraPayment), oneOffPaymentPeriods);
  }, [loanAmount, annualRate, totalPeriods, selectedPpy, extraPayment, oneOffPaymentPeriods]);

  const scheduleTotalInterest = useMemo(() => schedule.reduce((sum, row) => sum + row.interest, 0), [schedule]);
  const payoffYears = schedule.length / selectedPpy;
  const interestSaved = selectedRow.totalInterest - scheduleTotalInterest;
  const timeSavedYears = loanTermYears - payoffYears;

  const yearlyRows = useMemo(() => {
    const rows: { year: number; openingBalance: number; principal: number; interest: number; closingBalance: number; isCrossover: boolean }[] = [];
    let crossoverFound = false;
    for (let year = 1; year <= loanTermYears; year++) {
      const periodsInYear = schedule.filter((row) => Math.ceil(row.period / selectedPpy) === year);
      if (periodsInYear.length === 0) continue;
      const openingBalance = year === 1 ? loanAmount : rows[rows.length - 1].closingBalance;
      const principal = periodsInYear.reduce((sum, row) => sum + row.principal, 0);
      const interest = periodsInYear.reduce((sum, row) => sum + row.interest, 0);
      const closingBalance = periodsInYear[periodsInYear.length - 1].balance;
      const isCrossover = !crossoverFound && principal > interest;
      if (isCrossover) crossoverFound = true;
      rows.push({ year, openingBalance, principal, interest, closingBalance, isCrossover });
    }
    return rows;
  }, [schedule, selectedPpy, loanTermYears, loanAmount]);

  const chartRows = useMemo(() => {
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    return yearlyRows.map((row) => {
      cumulativePrincipal += row.principal;
      cumulativeInterest += row.interest;
      return { year: row.year, cumulativePrincipal, cumulativeInterest };
    });
  }, [yearlyRows]);

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          className="flex items-center gap-2 w-full text-left"
          onClick={() => setCalculatorOpen((open) => !open)}
        >
          {calculatorOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          <CardTitle className="text-base">Repayment Calculator</CardTitle>
        </button>
      </CardHeader>
      {calculatorOpen && (
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Property</Label>
            <Select value={selectedPropertyId} onValueChange={applyProperty}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(propertyId: string) => propertyId === "custom" || !propertyId
                    ? "Custom (no property)"
                    : (properties.find((p) => p.id === propertyId)?.name ?? "Custom (no property)")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom (no property)</SelectItem>
                {eligibleProperties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Loan amount</Label>
            <CurrencyInput value={loanAmount} onValueChange={setLoanAmount} />
          </div>
          <div className="space-y-1.5">
            <Label>Interest rate (%)</Label>
            <Input type="number" value={interestRatePct} onChange={(e) => setInterestRatePct(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Loan term (years)</Label>
            <Input type="number" value={loanTermYears} onChange={(e) => setLoanTermYears(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Repayment frequency</Label>
            <Segmented
              options={PAYMENT_FREQUENCIES.map((f) => ({ label: f.label, value: f.value }))}
              value={frequency}
              onChange={setFrequency}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Extra payment per period</Label>
            <CurrencyInput value={extraPayment} onValueChange={(v) => setExtraPayment(Math.max(0, v))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>One-off extra payments</Label>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">In year</span>
              <Input
                type="number"
                min={1}
                max={loanTermYears}
                className="w-24"
                value={newOneOffYear}
                onChange={(e) => setNewOneOffYear(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Amount</span>
              <CurrencyInput className="w-32" value={newOneOffAmount} onValueChange={setNewOneOffAmount} />
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addOneOffPayment}>
              <PlusCircle className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {oneOffPayments.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {oneOffPayments.map((entry) => (
                <li key={entry.id} className="flex items-center gap-1.5 rounded-full bg-fs-accent-subtle px-3 py-1 text-sm">
                  <span>Year {entry.year}: <CurrencyAmount value={entry.amount} /></span>
                  <button type="button" onClick={() => removeOneOffPayment(entry.id)} aria-label="Remove one-off payment">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Kpi
          label={`${selectedRow.label} repayment`}
          value={<CurrencyAmount value={selectedRow.periodicPayment + extraPayment} />}
          sub={
            extraPayment > 0 || oneOffPayments.length > 0 ? (
              <>Payoff in {payoffYears.toFixed(1)} yrs ({timeSavedYears.toFixed(1)} yrs earlier) · Interest saved <CurrencyAmount value={interestSaved} /></>
            ) : (
              <>Total interest <CurrencyAmount value={selectedRow.totalInterest} /> · Total cost <CurrencyAmount value={selectedRow.totalCost} /></>
            )
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm fs-table">
            <thead>
              <tr>
                <th className="text-left px-3 py-2">Frequency</th>
                <th className="text-right px-3 py-2">Repayment</th>
                <th className="text-right px-3 py-2">Total interest</th>
                <th className="text-right px-3 py-2">vs Monthly</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => {
                const delta = monthlyRow ? row.totalInterest - monthlyRow.totalInterest : 0;
                return (
                  <tr key={row.value} className={`border-b last:border-0 ${row.value === frequency ? "bg-fs-accent-subtle font-medium" : ""}`}>
                    <td className="px-3 py-1.5">{row.label}</td>
                    <td className="px-3 py-1.5 text-right"><CurrencyAmount value={row.periodicPayment} /></td>
                    <td className="px-3 py-1.5 text-right"><CurrencyAmount value={row.totalInterest} /></td>
                    <td className={`px-3 py-1.5 text-right ${row.value === "monthly" ? "text-muted-foreground" : delta < 0 ? "text-gain" : delta > 0 ? "text-loss" : ""}`}>
                      {row.value === "monthly" ? "—" : `${delta <= 0 ? "" : "+"}${fmtFull(delta)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {chartRows.length > 0 && <RepaymentChart rows={chartRows} />}

        {yearlyRows.length > 0 && (
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setScheduleOpen((open) => !open)}
            >
              {scheduleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Amortization schedule — {selectedRow.label.toLowerCase()} repayments
            </button>
            {scheduleOpen && (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm fs-table">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2">Year</th>
                      <th className="text-right px-3 py-2">Opening balance</th>
                      <th className="text-right px-3 py-2">Principal ({selectedPpy} {selectedRow.label.toLowerCase()} pmts)</th>
                      <th className="text-right px-3 py-2">Interest ({selectedPpy} {selectedRow.label.toLowerCase()} pmts)</th>
                      <th className="text-right px-3 py-2">Closing balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyRows.map((row) => (
                      <tr key={row.year} className={`border-b last:border-0 ${row.isCrossover ? "bg-gain-soft font-medium" : ""}`}>
                        <td className="px-3 py-1.5">
                          {row.year}
                          {row.isCrossover && <span className="ml-2 text-xs text-gain">Principal overtakes interest</span>}
                        </td>
                        <td className="px-3 py-1.5 text-right"><CurrencyAmount value={row.openingBalance} /></td>
                        <td className="px-3 py-1.5 text-right"><CurrencyAmount value={row.principal} /></td>
                        <td className="px-3 py-1.5 text-right"><CurrencyAmount value={row.interest} /></td>
                        <td className="px-3 py-1.5 text-right"><CurrencyAmount value={row.closingBalance} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
      )}
    </Card>
  );
}
