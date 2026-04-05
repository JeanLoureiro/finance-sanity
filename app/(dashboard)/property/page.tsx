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
import { Trash2, PlusCircle } from "lucide-react";
import { useState } from "react";

type Property = {
  id: string; name: string; purchaseDate: string; isPrimaryResidence: boolean;
  purchaseValue: string | number; currentValue: string | number; netRentProfit: string | number;
  mortgageStartDate: string | null; mortgageAnnualRate: string | number | null;
  mortgageMonthlyPayment: string | number | null; mortgageStartBalance: string | number | null;
};

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
  const equity = currentValue - mortgageRemainingBalance;
  const paidOff = currentValue > 0 ? (equity / currentValue) * 100 : 0;
  return { currentValue, capitalGain, mortgageRemainingBalance, mortgagePayoffDate, equity, paidOff };
}

export default function PropertyPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: queryKeys.properties.all(),
    queryFn: () => fetch("/api/property").then((r) => r.json()),
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/property/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.all() }),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: "", purchaseDate: "", isPrimaryResidence: false, purchaseValue: 0, currentValue: 0, netRentProfit: 0, mortgageStartDate: "", mortgageAnnualRate: 0, mortgageMonthlyPayment: 0, mortgageStartBalance: 0 },
  });

  const add = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/property", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.properties.all() }); reset(); setAddOpen(false); },
  });

  const totalPropertyValue = properties.reduce((s, p) => s + Number(p.currentValue), 0);
  const totalEquity = properties.reduce((s, p) => s + computePropertyStats(p).equity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Property</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Property</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Property</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-3">
              <Input placeholder="Property name / address" {...register("name")} />
              <div className="flex gap-2 items-end">
                <div className="flex-1"><label className="text-xs text-muted-foreground">Purchase date</label><Input type="date" {...register("purchaseDate")} /></div>
                <div className="flex items-center gap-2 pb-2"><input type="checkbox" className="h-4 w-4" {...register("isPrimaryResidence")} /><label className="text-sm">Primary residence</label></div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs text-muted-foreground">Purchase price ($)</label><Input type="number" step="1000" {...register("purchaseValue")} /></div>
                <div className="flex-1"><label className="text-xs text-muted-foreground">Current value ($)</label><Input type="number" step="1000" {...register("currentValue")} /></div>
              </div>
              <p className="text-xs font-medium text-muted-foreground pt-1">Mortgage (leave blank if none)</p>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs text-muted-foreground">Mortgage start date</label><Input type="date" {...register("mortgageStartDate")} /></div>
                <div className="flex-1"><label className="text-xs text-muted-foreground">Annual rate (e.g. 0.065)</label><Input type="number" step="0.001" {...register("mortgageAnnualRate")} /></div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs text-muted-foreground">Starting balance ($)</label><Input type="number" step="1000" {...register("mortgageStartBalance")} /></div>
                <div className="flex-1"><label className="text-xs text-muted-foreground">Monthly payment ($)</label><Input type="number" step="100" {...register("mortgageMonthlyPayment")} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Add Property</Button>
            </form>
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
                        <span className="text-sm text-muted-foreground">Purchased {new Date(p.purchaseDate).toLocaleDateString("en-AU")}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
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
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Mortgage remaining: <CurrencyAmount value={stats.mortgageRemainingBalance} /></span>
                        {stats.mortgagePayoffDate && <span>Payoff: {stats.mortgagePayoffDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" })}</span>}
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, stats.paidOff)}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{stats.paidOff.toFixed(1)}% equity</p>
                    </div>
                  )}
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
