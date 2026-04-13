"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { queryKeys } from "@/lib/queryKeys";
import { mortgageBalance, nper } from "@/lib/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, PlusCircle, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

type Loan = {
  id: string; name: string; startDate: string; interestFrequency: number;
  annualRate: string | number; regularPayment: string | number; startingBalance: string | number;
  adminFee: string | number;
};

type ExtraPayment = {
  id: string; loanId: string; date: string; amount: number; note: string | null;
};

function toDateInput(iso: string) {
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; }
}

function formatDateDisplay(iso: string) {
  try {
    const date = new Date(iso);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function mortgageBalanceWithExtras(
  startBalance: number,
  annualRate: number,
  monthlyPayment: number,
  adminFee: number,
  startDate: Date,
  extraPayments: ExtraPayment[],
  asOfDate: Date = new Date()
): number {
  const dailyRate = annualRate / 365;
  const monthsElapsed =
    (asOfDate.getFullYear() - startDate.getFullYear()) * 12 +
    (asOfDate.getMonth() - startDate.getMonth());

  if (monthsElapsed <= 0) return startBalance;

  let balance = startBalance;
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < monthsElapsed; i++) {
    // Calculate days in this month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Calculate interest for the month (daily interest × days in month)
    const interest = balance * dailyRate * daysInMonth;
    balance = balance + interest + adminFee - monthlyPayment;

    // Apply extra payments that fall in this calendar month
    const periodYear = startDate.getFullYear() + Math.floor((startDate.getMonth() + i + 1) / 12);
    const periodMonth = (startDate.getMonth() + i + 1) % 12;
    for (const ep of extraPayments) {
      const d = new Date(ep.date);
      if (d.getFullYear() === periodYear && d.getMonth() === periodMonth) {
        balance = balance - ep.amount;
      }
    }
    
    balance = Math.max(0, balance);
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return balance;
}

function computeLoanStats(loan: Loan, extraPayments: ExtraPayment[]) {
  const annualRate = Number(loan.annualRate);
  const monthlyPayment = Number(loan.regularPayment);
  const startBalance = Number(loan.startingBalance);
  const startDate = new Date(loan.startDate);

  const currentBalance = mortgageBalanceWithExtras(
    startBalance, annualRate, monthlyPayment, Number(loan.adminFee), startDate, extraPayments
  );

  // Months left from today ignoring future extra payments (conservative estimate)
  const periodicRate = annualRate / loan.interestFrequency;
  const monthsLeft = currentBalance <= 0
    ? 0
    : periodicRate > 0
      ? Math.ceil(nper(periodicRate, -monthlyPayment, currentBalance, 0))
      : currentBalance / monthlyPayment;

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + Math.max(0, monthsLeft));

  const totalPaid = startBalance - currentBalance + extraPayments.reduce((s, e) => s + e.amount, 0);
  const pctPaid = startBalance > 0 ? Math.min(100, (totalPaid / startBalance) * 100) : 0;

  const monthlyInterest = currentBalance > 0 ? currentBalance * (annualRate / loan.interestFrequency) : 0;

  return { currentBalance, monthsLeft, payoffDate, totalPaid, pctPaid, monthlyInterest };
}

function LoanForm({
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
      <Input placeholder="Loan name (e.g. Car loan, HECS)" {...register("name")} />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Start date</label>
          <Input type="date" {...register("startDate")} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Compounds per year (12 for monthly)</label>
          <Input type="number" {...register("interestFrequency")} />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Starting balance ($)</label>
          <Input type="number" {...register("startingBalance")} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Annual rate (e.g. 0.065)</label>
          <Input type="number" {...register("annualRate")} />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Regular payment per period ($)</label>
          <Input type="number" {...register("regularPayment")} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Admin fee per month ($)</label>
          <Input type="number" step="0.01" {...register("adminFee")} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>{submitLabel}</Button>
    </form>
  );
}

function ExtraPaymentsPanel({ loan }: { loan: Loan }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  const { data: payments = [] } = useQuery<ExtraPayment[]>({
    queryKey: queryKeys.loans.payments(loan.id),
    queryFn: async () => {
      const r = await fetch(`/api/loans/${loan.id}/payments`);
      if (!r.ok) throw new Error("Failed to load payments");
      return r.json();
    },
  });

  const addPayment = useMutation({
    mutationFn: (data: object) =>
      fetch(`/api/loans/${loan.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.loans.payments(loan.id) });
      qc.invalidateQueries({ queryKey: ["loans", "all-payments"] });
      setAmount(""); setNote("");
    },
  });

  const delPayment = useMutation({
    mutationFn: (paymentId: string) =>
      fetch(`/api/loans/${loan.id}/payments/${paymentId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.loans.payments(loan.id) });
      qc.invalidateQueries({ queryKey: ["loans", "all-payments"] });
    },
  });

  const totalExtra = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="mt-4 border-t pt-3">
      <button
        className="flex items-center gap-2 text-sm font-medium w-full text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Extra Payments
        {payments.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {payments.length} payment{payments.length !== 1 ? "s" : ""} · <CurrencyAmount value={totalExtra} /> total
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* List */}
          {payments.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-1">Date</th>
                  <th className="text-right py-1">Amount</th>
                  <th className="text-left py-1 pl-3">Note</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-1.5">{formatDateDisplay(p.date)}</td>
                    <td className="py-1.5 text-right font-medium"><CurrencyAmount value={p.amount} /></td>
                    <td className="py-1.5 pl-3 text-muted-foreground">{p.note || "—"}</td>
                    <td className="py-1.5 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDeletePaymentId(p.id)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {payments.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No extra payments recorded.</p>
          )}

          {/* Add form */}
          <div className="flex gap-2 flex-wrap items-end pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <Input type="date" className="h-8 w-36" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Amount ($)</label>
              <Input
                type="number"
                className="h-8 w-32"
                placeholder="e.g. 2000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-32">
              <label className="text-xs text-muted-foreground">Note (optional)</label>
              <Input
                className="h-8"
                placeholder="e.g. Tax return"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              disabled={!amount || !date || addPayment.isPending}
              onClick={() => addPayment.mutate({ date, amount: parseFloat(amount), note: note || null })}
            >
              {addPayment.isPending ? "Adding…" : "Add Payment"}
            </Button>
          </div>
        </div>
      )}
      <ConfirmDeleteDialog
        open={deletePaymentId !== null}
        onOpenChange={(open) => { if (!open) setDeletePaymentId(null); }}
        onConfirm={() => { if (deletePaymentId) { delPayment.mutate(deletePaymentId); setDeletePaymentId(null); } }}
        title="Delete extra payment?"
        isPending={delPayment.isPending}
      />
    </div>
  );
}

export default function LoansPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteLoanId, setDeleteLoanId] = useState<string | null>(null);

  const { data: loans = [], isLoading } = useQuery<Loan[]>({
    queryKey: queryKeys.loans.all(),
    queryFn: () => fetch("/api/loans").then((r) => r.json()),
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/loans/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.loans.all() }),
  });

  const add = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.loans.all() }); setAddOpen(false); },
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      fetch(`/api/loans/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.loans.all() }); setEditId(null); },
  });

  // Pre-fetch extra payments for all loans so stats are accurate on load
  const allPayments = useQuery<Record<string, ExtraPayment[]>>({
    queryKey: ["loans", "all-payments", loans.map((l) => l.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        loans.map(async (l) => {
          const r = await fetch(`/api/loans/${l.id}/payments`);
          const p: ExtraPayment[] = r.ok ? await r.json() : [];
          return [l.id, p] as const;
        })
      );
      return Object.fromEntries(results);
    },
    enabled: loans.length > 0,
  });

  const totalDebt = loans.reduce((s, l) => {
    const extras = allPayments.data?.[l.id] ?? [];
    return s + computeLoanStats(l, extras).currentBalance;
  }, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="space-y-4">
          {[...Array(2)].map((_, index) => <Skeleton key={index} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Loans & Liabilities</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <PlusCircle className="h-4 w-4 mr-1" /> Add Loan
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Loan</DialogTitle></DialogHeader>
            <LoanForm
              defaultValues={{ name: "", startDate: "", interestFrequency: 12, annualRate: 0, regularPayment: 0, startingBalance: 0, adminFee: 0 }}
              onSubmit={(d) => add.mutate(d)}
              isPending={add.isPending}
              submitLabel="Add Loan"
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Total Outstanding Debt</p>
          <p className="text-2xl font-bold text-red-600"><CurrencyAmount value={totalDebt} /></p>
        </CardContent>
      </Card>

      <div className="space-y-4">
          {loans.map((loan) => {
            const extras = allPayments.data?.[loan.id] ?? [];
            const stats = computeLoanStats(loan, extras);
            return (
              <Card key={loan.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{loan.name}</CardTitle>
                    <div className="flex gap-1">
                      <Dialog open={editId === loan.id} onOpenChange={(open) => setEditId(open ? loan.id : null)}>
                        <DialogTrigger render={<Button size="sm" variant="ghost" />}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Edit — {loan.name}</DialogTitle></DialogHeader>
                          <LoanForm
                            defaultValues={{
                              name: loan.name,
                              startDate: toDateInput(loan.startDate),
                              interestFrequency: loan.interestFrequency,
                              annualRate: Number(loan.annualRate),
                              regularPayment: Number(loan.regularPayment),
                              startingBalance: Number(loan.startingBalance),
                              adminFee: Number(loan.adminFee),
                            }}
                            onSubmit={(d) => update.mutate({ id: loan.id, ...d })}
                            isPending={update.isPending}
                            submitLabel="Save Changes"
                          />
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteLoanId(loan.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div><p className="text-muted-foreground">Remaining</p><p className="font-bold"><CurrencyAmount value={stats.currentBalance} /></p></div>
                    <div><p className="text-muted-foreground">Rate</p><p className="font-bold">{(Number(loan.annualRate) * 100).toFixed(2)}% p.a.</p></div>
                    <div><p className="text-muted-foreground">Payment</p><p className="font-bold"><CurrencyAmount value={Number(loan.regularPayment)} /></p></div>
                    <div><p className="text-muted-foreground">Payoff</p><p className="font-bold">{stats.monthsLeft > 0 ? stats.payoffDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" }) : "Paid off"}</p></div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Interest this period: <span className="font-medium text-foreground"><CurrencyAmount value={stats.monthlyInterest} /></span>
                    {Number(loan.adminFee) > 0 && (
                      <> · Admin fee/mo: <span className="font-medium text-foreground"><CurrencyAmount value={Number(loan.adminFee)} /></span> · Total monthly cost: <span className="font-medium text-foreground"><CurrencyAmount value={stats.monthlyInterest + Number(loan.adminFee)} /></span></>
                    )}
                  </p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, stats.pctPaid)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.pctPaid.toFixed(1)}% paid · <CurrencyAmount value={stats.totalPaid} /> of <CurrencyAmount value={Number(loan.startingBalance)} />
                  </p>
                  <ExtraPaymentsPanel loan={loan} />
                </CardContent>
              </Card>
            );
          })}
          {loans.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No loans. Add one above.</CardContent></Card>
          )}
        </div>
      <ConfirmDeleteDialog
        open={deleteLoanId !== null}
        onOpenChange={(open) => { if (!open) setDeleteLoanId(null); }}
        onConfirm={() => { if (deleteLoanId) { del.mutate(deleteLoanId); setDeleteLoanId(null); } }}
        title="Delete loan?"
        description="This will permanently delete the loan and all its extra payment history. This cannot be undone."
        isPending={del.isPending}
      />
    </div>
  );
}
