"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { queryKeys } from "@/lib/queryKeys";
import { getFiscalYear, getFYLabel, currentFY } from "@/lib/australianFY";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";
import { useState } from "react";

type Dividend = {
  id: string; paymentDate: string; ticker: string; holdingType: string;
  reinvested: boolean; netAmount: string | number; priceAtDividend: string | number | null;
};

const HOLDING_TYPES = ["ETF", "Stock", "ManagedFund", "Crypto"] as const;

export default function DividendsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedFY, setSelectedFY] = useState(currentFY());

  const { data: dividends = [], isLoading } = useQuery<Dividend[]>({
    queryKey: queryKeys.dividends.all(),
    queryFn: () => fetch("/api/dividends").then((r) => r.json()),
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/dividends/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dividends.all() }),
  });

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { paymentDate: "", ticker: "", holdingType: "ETF", reinvested: false, netAmount: 0, priceAtDividend: 0 },
  });

  const add = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/dividends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.dividends.all() }); reset(); setAddOpen(false); },
  });

  const fyDividends = dividends.filter((d) => getFiscalYear(new Date(d.paymentDate)) === selectedFY);
  const fyTotal = fyDividends.reduce((s, d) => s + Number(d.netAmount), 0);
  const fyReinvested = fyDividends.filter((d) => d.reinvested).reduce((s, d) => s + Number(d.netAmount), 0);
  const allFYs = [...new Set(dividends.map((d) => getFiscalYear(new Date(d.paymentDate))))].sort((a, b) => b - a);
  if (!allFYs.includes(selectedFY)) allFYs.unshift(selectedFY);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dividends</h1>
        <div className="flex gap-2">
          <Select value={String(selectedFY)} onValueChange={(v) => setSelectedFY(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {allFYs.map((fy) => <SelectItem key={fy} value={String(fy)}>{getFYLabel(fy)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger>
              <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Dividend</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Dividend</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-sm font-medium">Payment date</label><Input type="date" {...register("paymentDate")} /></div>
                  <div className="flex-1"><label className="text-sm font-medium">Ticker</label><Input placeholder="e.g. A200.AX" {...register("ticker")} /></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Holding type</label>
                    <Select defaultValue="ETF" onValueChange={(v) => v && setValue("holdingType", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{HOLDING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1"><label className="text-sm font-medium">Net amount ($)</label><Input type="number" step="0.01" {...register("netAmount")} /></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-sm font-medium">Price at div. (optional)</label><Input type="number" step="0.01" {...register("priceAtDividend")} /></div>
                  <div className="flex items-end gap-2 pb-1"><label className="text-sm font-medium">DRP</label><input type="checkbox" className="h-4 w-4" {...register("reinvested")} /></div>
                </div>
                <Button type="submit" className="w-full" disabled={add.isPending}>Add Dividend</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{getFYLabel(selectedFY)} Total</p><p className="text-2xl font-bold"><CurrencyAmount value={fyTotal} /></p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Reinvested (DRP)</p><p className="text-2xl font-bold"><CurrencyAmount value={fyReinvested} /></p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Cash received</p><p className="text-2xl font-bold"><CurrencyAmount value={fyTotal - fyReinvested} /></p></CardContent></Card>
      </div>

      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <Card>
          <CardHeader><CardTitle>{getFYLabel(selectedFY)} Dividends</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-left py-2 pr-3">Ticker</th>
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-right py-2 pr-3">Amount</th>
                  <th className="text-left py-2 pr-3">DRP</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {fyDividends.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 pr-3">{new Date(d.paymentDate).toLocaleDateString("en-AU")}</td>
                    <td className="py-2 pr-3 font-medium">{d.ticker}</td>
                    <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{d.holdingType}</Badge></td>
                    <td className="py-2 pr-3 text-right font-medium"><CurrencyAmount value={Number(d.netAmount)} /></td>
                    <td className="py-2 pr-3">{d.reinvested ? <Badge className="text-xs">DRP</Badge> : null}</td>
                    <td className="py-2"><Button size="sm" variant="ghost" onClick={() => del.mutate(d.id)}><Trash2 className="h-3 w-3" /></Button></td>
                  </tr>
                ))}
                {fyDividends.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No dividends for {getFYLabel(selectedFY)}</td></tr>}
              </tbody>
              {fyDividends.length > 0 && (
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td colSpan={3} className="py-2">Total</td>
                    <td className="py-2 text-right"><CurrencyAmount value={fyTotal} /></td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
