"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { queryKeys } from "@/lib/queryKeys";
import { mortgageBalance, nper } from "@/lib/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, PlusCircle, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type Property = {
  id: string; name: string; purchaseDate: string; isPrimaryResidence: boolean;
  purchaseValue: string | number; currentValue: string | number; netRentProfit: string | number;
  mortgageStartDate: string | null; mortgageAnnualRate: string | number | null;
  mortgageMonthlyPayment: string | number | null; mortgageStartBalance: string | number | null;
  equityLoanStartDate: string | null; equityLoanAnnualRate: string | number | null;
  equityLoanStartBalance: string | number | null; equityLoanMonthlyPayment: string | number | null;
};

type PropertyIncomeEntry = {
  id: string; propertyId: string; date: string; grossRent: number; frequency: string; notes: string | null;
};

const INCOME_FREQUENCIES: { value: string; label: string; annualFactor: number }[] = [
  { value: "weekly",      label: "Weekly",      annualFactor: 52 },
  { value: "fortnightly", label: "Fortnightly",  annualFactor: 26 },
  { value: "monthly",     label: "Monthly",      annualFactor: 12 },
  { value: "quarterly",   label: "Quarterly",    annualFactor: 4  },
  { value: "annually",    label: "Annually",     annualFactor: 1  },
];

function toMonthly(amount: number, frequency: string): number {
  const f = INCOME_FREQUENCIES.find((x) => x.value === frequency);
  return amount * ((f?.annualFactor ?? 12) / 12);
}

type PropertyExpenseEntry = {
  id: string; propertyId: string; date: string; category: string; amount: number; notes: string | null;
};

const EXPENSE_LABELS: Record<string, string> = {
  management_fee: "Management Fee",
  council_rates: "Council Rates",
  water: "Water",
  insurance: "Insurance",
  repairs: "Repairs",
  other: "Other",
};

function toDateInput(iso: string | null | undefined) {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function computePropertyStats(p: Property) {
  const currentValue = Number(p.currentValue);
  const capitalGain = currentValue - Number(p.purchaseValue);

  let mortgageRemainingBalance = 0;
  let mortgagePayoffDate: Date | null = null;
  if (p.mortgageStartDate && p.mortgageAnnualRate && p.mortgageMonthlyPayment && p.mortgageStartBalance) {
    const annualRate = Number(p.mortgageAnnualRate);
    const monthlyPayment = Number(p.mortgageMonthlyPayment);
    mortgageRemainingBalance = mortgageBalance(Number(p.mortgageStartBalance), annualRate, monthlyPayment, new Date(p.mortgageStartDate));
    const monthsLeft = Math.ceil(nper(annualRate / 12, -monthlyPayment, mortgageRemainingBalance, 0));
    if (monthsLeft > 0 && monthsLeft < 600) {
      const payoff = new Date();
      payoff.setMonth(payoff.getMonth() + monthsLeft);
      mortgagePayoffDate = payoff;
    }
  }

  let equityLoanBalance = 0;
  let equityLoanPayoffDate: Date | null = null;
  let equityLoanIsIO = true;
  if (p.equityLoanStartBalance && Number(p.equityLoanStartBalance) > 0) {
    const elRate = Number(p.equityLoanAnnualRate ?? 0);
    const elPayment = Number(p.equityLoanMonthlyPayment ?? 0);
    const elStartBalance = Number(p.equityLoanStartBalance);
    if (elPayment > 0 && p.equityLoanStartDate) {
      // P&I: amortize
      equityLoanIsIO = false;
      equityLoanBalance = mortgageBalance(elStartBalance, elRate, elPayment, new Date(p.equityLoanStartDate));
      const monthsLeft = Math.ceil(nper(elRate / 12, -elPayment, equityLoanBalance, 0));
      if (monthsLeft > 0 && monthsLeft < 600) {
        const payoff = new Date();
        payoff.setMonth(payoff.getMonth() + monthsLeft);
        equityLoanPayoffDate = payoff;
      }
    } else {
      // Interest-only: balance stays flat
      equityLoanBalance = elStartBalance;
    }
  }

  const equity = currentValue - mortgageRemainingBalance - equityLoanBalance;
  const totalDebt = mortgageRemainingBalance + equityLoanBalance;
  const paidOff = currentValue > 0 ? (equity / currentValue) * 100 : 0;
  return { currentValue, capitalGain, mortgageRemainingBalance, mortgagePayoffDate, equityLoanBalance, equityLoanPayoffDate, equityLoanIsIO, equity, totalDebt, paidOff };
}

function PropertyForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: {
  defaultValues: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const { register, handleSubmit } = useForm({ defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input placeholder="Property name / address" {...register("name")} />
      <div className="flex gap-2 items-end">
        <div className="flex-1"><label className="text-xs text-muted-foreground">Purchase date</label><Input type="date" {...register("purchaseDate")} /></div>
        <div className="flex items-center gap-2 pb-2"><input type="checkbox" className="h-4 w-4" {...register("isPrimaryResidence")} /><label className="text-sm">Primary residence</label></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1"><label className="text-xs text-muted-foreground">Purchase price ($)</label><Input type="number" {...register("purchaseValue")} /></div>
        <div className="flex-1"><label className="text-xs text-muted-foreground">Current value ($)</label><Input type="number" {...register("currentValue")} /></div>
      </div>
      <p className="text-xs font-medium text-muted-foreground pt-1">Mortgage (leave blank if none)</p>
      <div className="flex gap-2">
        <div className="flex-1"><label className="text-xs text-muted-foreground">Mortgage start date</label><Input type="date" {...register("mortgageStartDate")} /></div>
        <div className="flex-1"><label className="text-xs text-muted-foreground">Annual rate (e.g. 0.065)</label><Input type="number" {...register("mortgageAnnualRate")} /></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1"><label className="text-xs text-muted-foreground">Starting balance ($)</label><Input type="number" {...register("mortgageStartBalance")} /></div>
        <div className="flex-1"><label className="text-xs text-muted-foreground">Monthly payment ($)</label><Input type="number" {...register("mortgageMonthlyPayment")} /></div>
      </div>
      <p className="text-xs font-medium text-muted-foreground pt-1">Equity loan / LOC (leave blank if none)</p>
      <div className="flex gap-2">
        <div className="flex-1"><label className="text-xs text-muted-foreground">Loan start date</label><Input type="date" {...register("equityLoanStartDate")} /></div>
        <div className="flex-1"><label className="text-xs text-muted-foreground">Annual rate (e.g. 0.065)</label><Input type="number" {...register("equityLoanAnnualRate")} /></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1"><label className="text-xs text-muted-foreground">Drawn balance ($)</label><Input type="number" {...register("equityLoanStartBalance")} /></div>
        <div className="flex-1"><label className="text-xs text-muted-foreground">Monthly payment ($, blank = IO)</label><Input type="number" {...register("equityLoanMonthlyPayment")} /></div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>{submitLabel}</Button>
    </form>
  );
}

function RentalPanel({ property }: { property: Property }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [incomeDate, setIncomeDate] = useState(today());
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeFrequency, setIncomeFrequency] = useState("weekly");
  const [incomeNotes, setIncomeNotes] = useState("");
  const [expenseDate, setExpenseDate] = useState(today());
  const [expenseCategory, setExpenseCategory] = useState("management_fee");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  const { data: incomeEntries = [] } = useQuery<PropertyIncomeEntry[]>({
    queryKey: queryKeys.properties.income(property.id),
    queryFn: async () => { const r = await fetch(`/api/property/${property.id}/income`); if (!r.ok) throw new Error("Failed to load income"); return r.json(); },
    enabled: open,
  });

  const { data: expenseEntries = [] } = useQuery<PropertyExpenseEntry[]>({
    queryKey: queryKeys.properties.expenses(property.id),
    queryFn: async () => { const r = await fetch(`/api/property/${property.id}/expenses`); if (!r.ok) throw new Error("Failed to load expenses"); return r.json(); },
    enabled: open,
  });

  const addIncome = useMutation({
    mutationFn: (data: object) =>
      fetch(`/api/property/${property.id}/income`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.properties.income(property.id) }); setIncomeAmount(""); setIncomeNotes(""); setIncomeFrequency("weekly"); },
  });

  const delIncome = useMutation({
    mutationFn: (entryId: string) => fetch(`/api/property/${property.id}/income/${entryId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.income(property.id) }),
  });

  const addExpense = useMutation({
    mutationFn: (data: object) =>
      fetch(`/api/property/${property.id}/expenses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.properties.expenses(property.id) }); setExpenseAmount(""); setExpenseNotes(""); },
  });

  const delExpense = useMutation({
    mutationFn: (entryId: string) => fetch(`/api/property/${property.id}/expenses/${entryId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.expenses(property.id) }),
  });

  const totalMonthlyIncome = incomeEntries?.reduce((s, e) => s + toMonthly(Number(e.grossRent), e.frequency), 0) || 0;
  const totalExpenses = expenseEntries?.reduce((s, e) => s + Number(e.amount), 0) || 0;
  const monthlyExpenses = totalExpenses / 12;
  const netMonthly = totalMonthlyIncome - monthlyExpenses;

  return (
    <div className="mt-4 border-t pt-3">
      <button
        className="flex items-center gap-2 text-sm font-medium w-full text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Rental Income &amp; Expenses
        {(incomeEntries.length > 0 || expenseEntries.length > 0) && (
          <span className={`ml-auto text-xs font-medium ${netMonthly >= 0 ? "text-green-600" : "text-red-600"}`}>
            Net: <CurrencyAmount value={netMonthly} showSign />/mo
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-5">
          {/* Income */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Rental Income</p>
            {incomeEntries.length > 0 && (
              <table className="w-full text-sm mb-2">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-1">Date</th>
                    <th className="text-left py-1 pl-2">Freq</th>
                    <th className="text-right py-1">Amount</th>
                    <th className="text-right py-1">≈ /mo</th>
                    <th className="text-left py-1 pl-3">Notes</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {incomeEntries.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-1.5">{toDateInput(e.date)}</td>
                      <td className="py-1.5 pl-2 text-muted-foreground capitalize">{e.frequency}</td>
                      <td className="py-1.5 text-right font-medium"><CurrencyAmount value={Number(e.grossRent)} /></td>
                      <td className="py-1.5 text-right text-muted-foreground"><CurrencyAmount value={toMonthly(Number(e.grossRent), e.frequency)} /></td>
                      <td className="py-1.5 pl-3 text-muted-foreground">{e.notes || "—"}</td>
                      <td className="py-1.5 text-right">
                        <Button size="sm" variant="ghost" onClick={() => delIncome.mutate(e.id)}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {incomeEntries.length === 0 && <p className="text-xs text-muted-foreground italic mb-2">No income recorded.</p>}
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Date</label>
                <Input type="date" className="h-8 w-36" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Frequency</label>
                <select className="h-8 rounded-md border border-input bg-background px-2 text-sm" value={incomeFrequency} onChange={(e) => setIncomeFrequency(e.target.value)}>
                  {INCOME_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Amount ($)</label>
                <Input type="number" className="h-8 w-28" placeholder="e.g. 500" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-28">
                <label className="text-xs text-muted-foreground">Notes (optional)</label>
                <Input className="h-8" placeholder="e.g. Jan rent" value={incomeNotes} onChange={(e) => setIncomeNotes(e.target.value)} />
              </div>
              <Button size="sm" disabled={!incomeAmount || !incomeDate || addIncome.isPending}
                onClick={() => addIncome.mutate({ date: incomeDate, grossRent: parseFloat(incomeAmount), frequency: incomeFrequency, notes: incomeNotes || null })}>
                {addIncome.isPending ? "Adding…" : "Add Income"}
              </Button>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Expenses</p>
            {expenseEntries.length > 0 && (
              <table className="w-full text-sm mb-2">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-1">Date</th>
                    <th className="text-left py-1 pl-2">Category</th>
                    <th className="text-right py-1">Amount</th>
                    <th className="text-left py-1 pl-3">Notes</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {expenseEntries.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-1.5">{toDateInput(e.date)}</td>
                      <td className="py-1.5 pl-2">{EXPENSE_LABELS[e.category] ?? e.category}</td>
                      <td className="py-1.5 text-right font-medium"><CurrencyAmount value={Number(e.amount)} /></td>
                      <td className="py-1.5 pl-3 text-muted-foreground">{e.notes || "—"}</td>
                      <td className="py-1.5 text-right">
                        <Button size="sm" variant="ghost" onClick={() => delExpense.mutate(e.id)}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {expenseEntries.length === 0 && <p className="text-xs text-muted-foreground italic mb-2">No expenses recorded.</p>}
            <div className="flex gap-2 flex-wrap items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Date</label>
                <Input type="date" className="h-8 w-36" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Category</label>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                >
                  {Object.entries(EXPENSE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Amount ($)</label>
                <Input type="number" className="h-8 w-28" placeholder="e.g. 500" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-28">
                <label className="text-xs text-muted-foreground">Notes (optional)</label>
                <Input className="h-8" placeholder="e.g. Q1 rates" value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} />
              </div>
              <Button size="sm" disabled={!expenseAmount || !expenseDate || addExpense.isPending}
                onClick={() => addExpense.mutate({ date: expenseDate, category: expenseCategory, amount: parseFloat(expenseAmount), notes: expenseNotes || null })}>
                {addExpense.isPending ? "Adding…" : "Add Expense"}
              </Button>
            </div>
          </div>

          {/* Summary */}
          {(incomeEntries.length > 0 || expenseEntries.length > 0) && (
            <div className="flex gap-6 pt-1 border-t text-sm flex-wrap">
              <div><p className="text-xs text-muted-foreground">Gross rent /mo</p><p className="font-medium"><CurrencyAmount value={totalMonthlyIncome} /></p></div>
              <div><p className="text-xs text-muted-foreground">Gross rent /yr</p><p className="font-medium"><CurrencyAmount value={totalMonthlyIncome * 12} /></p></div>
              <div><p className="text-xs text-muted-foreground">Expenses /yr</p><p className="font-medium"><CurrencyAmount value={totalExpenses} /></p></div>
              <div><p className="text-xs text-muted-foreground">Net /mo</p><p className={`font-bold ${netMonthly >= 0 ? "text-green-600" : "text-red-600"}`}><CurrencyAmount value={netMonthly} showSign /></p></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PropertyPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: queryKeys.properties.all(),
    queryFn: () => fetch("/api/property").then((r) => r.json()),
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/property/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.all() }),
  });

  const add = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/property", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.properties.all() }); setAddOpen(false); },
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      fetch(`/api/property/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.properties.all() }); setEditId(null); },
  });

  const totalPropertyValue = properties.reduce((s, p) => s + Number(p.currentValue), 0);
  const totalEquity = properties.reduce((s, p) => s + computePropertyStats(p).equity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Property</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-1" /> Add Property
              </Button>
            }
          />
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Property</DialogTitle></DialogHeader>
            <PropertyForm
              defaultValues={{ name: "", purchaseDate: "", isPrimaryResidence: false, purchaseValue: 0, currentValue: 0, netRentProfit: 0, mortgageStartDate: "", mortgageAnnualRate: 0, mortgageMonthlyPayment: 0, mortgageStartBalance: 0, equityLoanStartDate: "", equityLoanAnnualRate: 0, equityLoanStartBalance: 0, equityLoanMonthlyPayment: 0 }}
              onSubmit={(d) => add.mutate(d)}
              isPending={add.isPending}
              submitLabel="Add Property"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Property Value</p><p className="text-2xl font-bold"><CurrencyAmount value={totalPropertyValue} /></p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Equity</p><p className="text-2xl font-bold"><CurrencyAmount value={totalEquity} /></p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => {
            const stats = computePropertyStats(p);
            return (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        {p.isPrimaryResidence && <Badge variant="secondary">Primary Residence</Badge>}
                        {!p.isPrimaryResidence && <Badge variant="outline">Investment</Badge>}
                        <span className="text-sm text-muted-foreground">Purchased {new Date(p.purchaseDate).toLocaleDateString("en-AU")}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Dialog open={editId === p.id} onOpenChange={(open) => setEditId(open ? p.id : null)}>
                        <DialogTrigger
                          render={
                            <Button size="sm" variant="ghost">
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          }
                        />
                        <DialogContent className="max-w-lg">
                          <DialogHeader><DialogTitle>Edit — {p.name}</DialogTitle></DialogHeader>
                          <PropertyForm
                            defaultValues={{
                              name: p.name,
                              purchaseDate: toDateInput(p.purchaseDate),
                              isPrimaryResidence: p.isPrimaryResidence,
                              purchaseValue: Number(p.purchaseValue),
                              currentValue: Number(p.currentValue),
                              netRentProfit: Number(p.netRentProfit),
                              mortgageStartDate: toDateInput(p.mortgageStartDate),
                              mortgageAnnualRate: p.mortgageAnnualRate !== null ? Number(p.mortgageAnnualRate) : 0,
                              mortgageMonthlyPayment: p.mortgageMonthlyPayment !== null ? Number(p.mortgageMonthlyPayment) : 0,
                              mortgageStartBalance: p.mortgageStartBalance !== null ? Number(p.mortgageStartBalance) : 0,
                              equityLoanStartDate: toDateInput(p.equityLoanStartDate),
                              equityLoanAnnualRate: p.equityLoanAnnualRate !== null ? Number(p.equityLoanAnnualRate) : 0,
                              equityLoanStartBalance: p.equityLoanStartBalance !== null ? Number(p.equityLoanStartBalance) : 0,
                              equityLoanMonthlyPayment: p.equityLoanMonthlyPayment !== null ? Number(p.equityLoanMonthlyPayment) : 0,
                            }}
                            onSubmit={(d) => update.mutate({ id: p.id, ...d })}
                            isPending={update.isPending}
                            submitLabel="Save Changes"
                          />
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div><p className="text-muted-foreground">Current value</p><p className="font-bold text-lg"><CurrencyAmount value={stats.currentValue} /></p></div>
                    <div><p className="text-muted-foreground">Equity</p><p className="font-bold text-lg"><CurrencyAmount value={stats.equity} /></p></div>
                    <div>
                      <p className="text-muted-foreground">Capital gain</p>
                      <p className={`font-bold text-lg ${stats.capitalGain >= 0 ? "text-green-600" : "text-red-600"}`}><CurrencyAmount value={stats.capitalGain} showSign /></p>
                    </div>
                  </div>

                  {stats.mortgageRemainingBalance > 0 && (
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Main mortgage: <CurrencyAmount value={stats.mortgageRemainingBalance} /></span>
                        {stats.mortgagePayoffDate && <span>Payoff: {stats.mortgagePayoffDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>}
                      </div>
                      {stats.equityLoanBalance > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Equity loan ({stats.equityLoanIsIO ? "IO" : "P&I"}): <CurrencyAmount value={stats.equityLoanBalance} /></span>
                          {!stats.equityLoanIsIO && stats.equityLoanPayoffDate && <span>Payoff: {stats.equityLoanPayoffDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>}
                          {stats.equityLoanIsIO && p.equityLoanAnnualRate && <span>{(Number(p.equityLoanAnnualRate) * 100).toFixed(2)}% p.a. — interest only</span>}
                        </div>
                      )}
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, stats.paidOff)}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{stats.paidOff.toFixed(1)}% equity</p>
                    </div>
                  )}

                  {stats.equityLoanBalance > 0 && stats.mortgageRemainingBalance === 0 && (
                    <div className="mb-3 text-xs text-muted-foreground">
                      <span>Equity loan ({stats.equityLoanIsIO ? "IO" : "P&I"}): <CurrencyAmount value={stats.equityLoanBalance} /></span>
                      {stats.equityLoanIsIO && p.equityLoanAnnualRate && <span className="ml-2">{(Number(p.equityLoanAnnualRate) * 100).toFixed(2)}% p.a. — interest only</span>}
                      {!stats.equityLoanIsIO && stats.equityLoanPayoffDate && <span className="ml-2">Payoff: {stats.equityLoanPayoffDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>}
                    </div>
                  )}

                  {!p.isPrimaryResidence && <RentalPanel property={p} />}
                </CardContent>
              </Card>
            );
          })}
          {properties.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No properties yet. Add one above.</CardContent></Card>}
        </div>
      )}
    </div>
  );
}
