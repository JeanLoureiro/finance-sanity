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
import { Trash2, PlusCircle } from "lucide-react";
import { useState } from "react";

type Loan = {
  id: string; name: string; startDate: string; interestFrequency: number;
  annualRate: string | number; regularPayment: string | number; startingBalance: string | number;
};

function computeLoanStats(loan: Loan) {
  const annualRate = Number(loan.annualRate);
  const monthlyPayment = Number(loan.regularPayment);
  const startBalance = Number(loan.startingBalance);
  const currentBalance = mortgageBalance(startBalance, annualRate, monthlyPayment, new Date(loan.startDate));
  const periodicRate = annualRate / loan.interestFrequency;
  const monthsLeft = periodicRate > 0 ? Math.ceil(nper(periodicRate, -monthlyPayment, currentBalance, 0)) : currentBalance / monthlyPayment;
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + Math.max(0, monthsLeft));
  const totalPaid = startBalance - currentBalance;
  const pctPaid = startBalance > 0 ? (totalPaid / startBalance) * 100 : 0;
  return { currentBalance, monthsLeft, payoffDate, totalPaid, pctPaid };
}

export default function LoansPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: loans = [], isLoading } = useQuery<Loan[]>({
    queryKey: queryKeys.loans.all(),
    queryFn: () => fetch("/api/loans").then((r) => r.json()),
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/loans/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.loans.all() }),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: "", startDate: "", interestFrequency: 12, annualRate: 0, regularPayment: 0, startingBalance: 0 },
  });

  const add = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.loans.all() }); reset(); setAddOpen(false); },
  });

  const totalDebt = loans.reduce((s, l) => s + computeLoanStats(l).currentBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Loans & Liabilities</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Loan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Loan</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-3">
              <Input placeholder="Loan name (e.g. Car loan, HECS)" {...register("name")} />
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs text-muted-foreground">Start date</label><Input type="date" {...register("startDate")} /></div>
                <div className="flex-1"><label className="text-xs text-muted-foreground">Compounds per year</label><Input type="number" defaultValue={12} {...register("interestFrequency")} /></div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs text-muted-foreground">Starting balance ($)</label><Input type="number" step="100" {...register("startingBalance")} /></div>
                <div className="flex-1"><label className="text-xs text-muted-foreground">Annual rate (e.g. 0.065)</label><Input type="number" step="0.001" {...register("annualRate")} /></div>
              </div>
              <div><label className="text-xs text-muted-foreground">Regular payment per period ($)</label><Input type="number" step="10" {...register("regularPayment")} /></div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Add Loan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Outstanding Debt</p><p className="text-2xl font-bold text-red-600"><CurrencyAmount value={totalDebt} /></p></CardContent></Card>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const stats = computeLoanStats(loan);
            return (
              <Card key={loan.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{loan.name}</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(loan.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                    <div><p className="text-muted-foreground">Remaining</p><p className="font-bold"><CurrencyAmount value={stats.currentBalance} /></p></div>
                    <div><p className="text-muted-foreground">Rate</p><p className="font-bold">{(Number(loan.annualRate) * 100).toFixed(2)}% p.a.</p></div>
                    <div><p className="text-muted-foreground">Payment</p><p className="font-bold"><CurrencyAmount value={Number(loan.regularPayment)} /></p></div>
                    <div><p className="text-muted-foreground">Payoff</p><p className="font-bold">{stats.monthsLeft > 0 ? stats.payoffDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" }) : "Paid off"}</p></div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, stats.pctPaid)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.pctPaid.toFixed(1)}% paid · <CurrencyAmount value={stats.totalPaid} /> of <CurrencyAmount value={Number(loan.startingBalance)} />
                  </p>
                </CardContent>
              </Card>
            );
          })}
          {loans.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No loans. Add one above.</CardContent></Card>}
        </div>
      )}
    </div>
  );
}
