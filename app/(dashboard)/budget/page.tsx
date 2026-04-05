"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetItemSchema, type BudgetItemInput } from "@/lib/schemas";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, PlusCircle } from "lucide-react";
import { useEffect } from "react";

type BudgetItem = { id: string; name: string; monthlyAmount: number; category: string };

function computeMonthlyIncome(netIncome: number, frequency: string): number {
  switch (frequency) {
    case "Weekly": return netIncome * 52 / 12;
    case "2-weeks": return netIncome * 26 / 12;
    case "4-weeks": return netIncome * 13 / 12;
    case "Twice Monthly": return netIncome * 2;
    default: return netIncome; // Monthly
  }
}

export default function BudgetPage() {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<BudgetItem[]>({
    queryKey: queryKeys.budget(),
    queryFn: () => fetch("/api/budget").then((r) => r.json()),
  });

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/budget/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget() }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<BudgetItemInput>) =>
      fetch(`/api/budget/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.budget() }),
  });

  const { register: regAdd, handleSubmit: handleAdd, reset: resetAdd } = useForm({
    defaultValues: { name: "", monthlyAmount: 0, category: "Expenses" },
  });

  const addMutation = useMutation({
    mutationFn: (data: BudgetItemInput) =>
      fetch("/api/budget", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.budget() }); resetAdd(); },
  });

  const monthlyIncome = settings
    ? computeMonthlyIncome(Number(settings.netIncome), settings.salaryFrequency)
    : 0;
  const totalExpenses = items.reduce((s, i) => s + i.monthlyAmount, 0);
  const monthlySavings = monthlyIncome - totalExpenses;
  const savingsRate = monthlyIncome > 0 ? monthlySavings / monthlyIncome : 0;
  const emergencyTarget = (settings?.emergencyFundMonths ?? 6) * totalExpenses;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Budget</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Income", value: monthlyIncome },
          { label: "Total Expenses", value: totalExpenses },
          { label: "Monthly Savings", value: monthlySavings, highlight: true },
          { label: "Savings Rate", value: null, pct: savingsRate },
        ].map(({ label, value, pct, highlight }) => (
          <Card key={label} className={highlight && monthlySavings > 0 ? "border-green-500" : ""}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${highlight ? (monthlySavings > 0 ? "text-green-600" : "text-red-500") : ""}`}>
                {pct !== undefined
                  ? `${(pct * 100).toFixed(1)}%`
                  : <CurrencyAmount value={value} />}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Annual Expenses</p>
          <p className="text-xl font-bold"><CurrencyAmount value={totalExpenses * 12} /></p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Emergency Fund Target ({settings?.emergencyFundMonths ?? 6} months)</p>
          <p className="text-xl font-bold"><CurrencyAmount value={emergencyTarget} /></p>
        </CardContent></Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Expense Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b"><tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-right px-4 py-2">Monthly</th>
                <th className="text-right px-4 py-2">% of Income</th>
                <th className="text-right px-4 py-2">Weekly</th>
                <th className="text-right px-4 py-2">Annual</th>
                <th className="w-10" />
              </tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 group">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 text-right">
                      <input
                        className="text-right w-28 bg-transparent border-b border-transparent group-hover:border-border outline-none"
                        type="number"
                        defaultValue={item.monthlyAmount}
                        onBlur={(e) => updateMutation.mutate({ id: item.id, monthlyAmount: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {monthlyIncome > 0 ? `${(item.monthlyAmount / monthlyIncome * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      <CurrencyAmount value={item.monthlyAmount / 4.33} />
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      <CurrencyAmount value={item.monthlyAmount * 12} />
                    </td>
                    <td className="px-2">
                      <Button size="sm" variant="ghost" onClick={() => delMutation.mutate(item.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {items.length > 0 && (
                  <tr className="bg-muted/50 font-semibold text-sm">
                    <td className="px-4 py-2">Total</td>
                    <td className="px-4 py-2 text-right"><CurrencyAmount value={totalExpenses} /></td>
                    <td className="px-4 py-2 text-right">{monthlyIncome > 0 ? `${(totalExpenses / monthlyIncome * 100).toFixed(1)}%` : "—"}</td>
                    <td className="px-4 py-2 text-right"><CurrencyAmount value={totalExpenses / 4.33} /></td>
                    <td className="px-4 py-2 text-right"><CurrencyAmount value={totalExpenses * 12} /></td>
                    <td />
                  </tr>
                )}
                {items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No budget items yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add item */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Item</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd((d) => addMutation.mutate(d))} className="flex gap-3 flex-wrap">
            <Input className="flex-1 min-w-40" placeholder="Expense name (e.g. Groceries)" {...regAdd("name")} />
            <Input type="number" step="0.01" className="w-32" placeholder="$/month" {...regAdd("monthlyAmount")} />
            <Button type="submit" disabled={addMutation.isPending}>{addMutation.isPending ? "Adding…" : "Add"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
