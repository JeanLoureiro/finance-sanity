"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bankAccountSchema, type BankAccountInput } from "@/lib/schemas";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, PlusCircle } from "lucide-react";
import { useState } from "react";

type BankAccount = { id: string; name: string; currency: string; balance: number };

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function CashPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");

  const { data: accounts = [], isLoading } = useQuery<BankAccount[]>({
    queryKey: queryKeys.cash.accounts(),
    queryFn: () => fetch("/api/cash").then((r) => r.json()),
  });

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: "", currency: "AUD", balance: 0 },
  });

  const addMutation = useMutation({
    mutationFn: (data: BankAccountInput) =>
      fetch("/api/cash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.cash.accounts() }); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, balance }: { id: string; balance: number }) =>
      fetch(`/api/cash/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance }) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.cash.accounts() }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/cash/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cash.accounts() }),
  });

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const target = Number(settings?.cashSavingsTarget ?? 40000);
  const pctOfTarget = target > 0 ? Math.min(totalBalance / target, 1) : 0;
  const monthsToTarget = settings?.bankInterestRate
    ? Math.ceil((target - totalBalance) / (Number(settings.netIncome) * 0.2))
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cash</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Balance" value={<CurrencyAmount value={totalBalance} />} />
        <StatCard label="Savings Target" value={<CurrencyAmount value={target} />} sub={`${(pctOfTarget * 100).toFixed(1)}% reached`} />
        <StatCard label="Net Monthly Income" value={<CurrencyAmount value={settings?.netIncome ?? 0} />} />
        <StatCard label="Emergency Fund Target" value={<CurrencyAmount value={(settings?.emergencyFundMonths ?? 6) * (totalBalance / 12)} />} sub={`${settings?.emergencyFundMonths ?? 6} months of expenses`} />
      </div>

      {/* Progress bar */}
      {target > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to ${target.toLocaleString("en-AU")} target</span>
            <span className="font-medium">{(pctOfTarget * 100).toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${pctOfTarget * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Accounts table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Bank Accounts</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Account</th>
                  <th className="text-left px-4 py-2 font-medium">Currency</th>
                  <th className="text-right px-4 py-2 font-medium">Balance</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2">{acc.name}</td>
                    <td className="px-4 py-2"><Badge variant="outline">{acc.currency}</Badge></td>
                    <td className="px-4 py-2 text-right">
                      {editing === acc.id ? (
                        <div className="flex gap-2 justify-end">
                          <Input
                            type="number"
                            className="w-32 h-7 text-right"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                            autoFocus
                          />
                          <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => updateMutation.mutate({ id: acc.id, balance: Number(editBalance) })}>Save</Button>
                        </div>
                      ) : (
                        <button
                          className="font-medium hover:underline cursor-pointer"
                          onClick={() => { setEditing(acc.id); setEditBalance(String(acc.balance)); }}
                        >
                          <CurrencyAmount value={acc.balance} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(acc.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No accounts yet</td></tr>
                )}
                {/* Total row */}
                {accounts.length > 0 && (
                  <tr className="bg-muted/50 font-semibold">
                    <td className="px-4 py-2">Total</td>
                    <td />
                    <td className="px-4 py-2 text-right"><CurrencyAmount value={totalBalance} /></td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add account form */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-40">
              <Input placeholder="Account name" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <Input className="w-20" placeholder="AUD" defaultValue="AUD" {...register("currency")} />
            <Input type="number" step="0.01" className="w-36" placeholder="Balance" {...register("balance")} />
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding…" : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
