"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, PlusCircle, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

type BankAccount = {
  id: string;
  name: string;
  currency: string;
  balance: number;
  bsb: string | null;
  accountNumber: string | null;
};
type HistorySnapshot = { date: string; cashTotal: number };

type EditState = {
  name: string;
  currency: string;
  balance: string;
  bsb: string;
  accountNumber: string;
};

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), "MMM yy"); } catch { return dateStr; }
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 }).format(v);

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", currency: "AUD", balance: "", bsb: "", accountNumber: "" });

  // Add form state
  const [addName, setAddName] = useState("");
  const [addCurrency, setAddCurrency] = useState("AUD");
  const [addBalance, setAddBalance] = useState("");
  const [addBsb, setAddBsb] = useState("");
  const [addAccountNumber, setAddAccountNumber] = useState("");

  const { data: accounts = [], isLoading } = useQuery<BankAccount[]>({
    queryKey: queryKeys.cash.accounts(),
    queryFn: () => fetch("/api/cash").then((r) => r.json()),
  });

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });

  const { data: history = [] } = useQuery<HistorySnapshot[]>({
    queryKey: queryKeys.history.list(),
    queryFn: () => fetch("/api/history").then((r) => r.json()),
    staleTime: 60 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: (data: object) =>
      fetch("/api/cash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cash.accounts() });
      setAddName(""); setAddCurrency("AUD"); setAddBalance(""); setAddBsb(""); setAddAccountNumber("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; currency?: string; balance?: number; bsb?: string | null; accountNumber?: string | null }) =>
      fetch(`/api/cash/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.cash.accounts() }); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/cash/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cash.accounts() }),
  });

  function startEdit(acc: BankAccount) {
    setEditingId(acc.id);
    setEditState({
      name: acc.name,
      currency: acc.currency,
      balance: String(acc.balance),
      bsb: acc.bsb ?? "",
      accountNumber: acc.accountNumber ?? "",
    });
  }

  function saveEdit(id: string) {
    updateMutation.mutate({
      id,
      name: editState.name,
      currency: editState.currency,
      balance: parseFloat(editState.balance) || 0,
      bsb: editState.bsb || null,
      accountNumber: editState.accountNumber || null,
    });
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const target = Number(settings?.cashSavingsTarget ?? 40000);
  const pctOfTarget = target > 0 ? Math.min(totalBalance / target, 1) : 0;

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
                  <th className="text-left px-4 py-2 font-medium">BSB</th>
                  <th className="text-left px-4 py-2 font-medium">Account No.</th>
                  <th className="text-left px-4 py-2 font-medium">Currency</th>
                  <th className="text-right px-4 py-2 font-medium">Balance</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <>
                    <tr key={acc.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{acc.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{acc.bsb || <span className="italic text-xs">—</span>}</td>
                      <td className="px-4 py-2 text-muted-foreground">{acc.accountNumber || <span className="italic text-xs">—</span>}</td>
                      <td className="px-4 py-2"><Badge variant="outline">{acc.currency}</Badge></td>
                      <td className="px-4 py-2 text-right font-medium"><CurrencyAmount value={acc.balance} /></td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(acc)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(acc.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {editingId === acc.id && (
                      <tr key={`${acc.id}-edit`} className="border-b bg-muted/20">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex flex-wrap gap-2 items-end">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-muted-foreground">Name</label>
                              <Input
                                className="h-8 w-40"
                                value={editState.name}
                                onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-muted-foreground">BSB</label>
                              <Input
                                className="h-8 w-28"
                                placeholder="e.g. 063000"
                                value={editState.bsb}
                                onChange={(e) => setEditState((s) => ({ ...s, bsb: e.target.value }))}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-muted-foreground">Account Number</label>
                              <Input
                                className="h-8 w-36"
                                placeholder="e.g. 12345678"
                                value={editState.accountNumber}
                                onChange={(e) => setEditState((s) => ({ ...s, accountNumber: e.target.value }))}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-muted-foreground">Currency</label>
                              <Input
                                className="h-8 w-20"
                                value={editState.currency}
                                onChange={(e) => setEditState((s) => ({ ...s, currency: e.target.value }))}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-muted-foreground">Balance ($)</label>
                              <Input
                                type="number"
                                className="h-8 w-32 text-right"
                                value={editState.balance}
                                onChange={(e) => setEditState((s) => ({ ...s, balance: e.target.value }))}
                              />
                            </div>
                            <Button size="sm" onClick={() => saveEdit(acc.id)} disabled={updateMutation.isPending}>
                              <Check className="h-3.5 w-3.5 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5 mr-1" /> Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {accounts.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No accounts yet</td></tr>
                )}
                {accounts.length > 0 && (
                  <tr className="bg-muted/50 font-semibold">
                    <td className="px-4 py-2" colSpan={4}>Total</td>
                    <td className="px-4 py-2 text-right"><CurrencyAmount value={totalBalance} /></td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Cash history chart */}
      {history.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cash Balance History</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history} margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="cashHistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={65} />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} labelFormatter={(l) => formatDate(String(l))} />
                <Area type="monotone" dataKey="cashTotal" stroke="#0891b2" fill="url(#cashHistGrad)" name="Cash" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Add account form */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Account</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-36">
              <label className="text-xs text-muted-foreground">Account name</label>
              <Input
                placeholder="e.g. CBA Everyday"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">BSB</label>
              <Input
                className="w-28"
                placeholder="e.g. 063000"
                value={addBsb}
                onChange={(e) => setAddBsb(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Account Number</label>
              <Input
                className="w-36"
                placeholder="e.g. 12345678"
                value={addAccountNumber}
                onChange={(e) => setAddAccountNumber(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Currency</label>
              <Input
                className="w-20"
                placeholder="AUD"
                value={addCurrency}
                onChange={(e) => setAddCurrency(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Balance ($)</label>
              <Input
                type="number"
                className="w-36 text-right"
                placeholder="0.00"
                value={addBalance}
                onChange={(e) => setAddBalance(e.target.value)}
              />
            </div>
            <Button
              disabled={!addName.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate({
                name: addName.trim(),
                currency: addCurrency || "AUD",
                balance: parseFloat(addBalance) || 0,
                bsb: addBsb || null,
                accountNumber: addAccountNumber || null,
              })}
            >
              {addMutation.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
