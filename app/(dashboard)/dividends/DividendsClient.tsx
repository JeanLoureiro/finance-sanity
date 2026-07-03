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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

type Dividend = {
  id: string; paymentDate: string; ticker: string; holdingType: string;
  reinvested: boolean; netAmount: string | number; priceAtDividend: string | number | null;
};

const HOLDING_TYPES = ["ETF", "Stock", "ManagedFund", "Crypto"] as const;

export default function DividendsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedFY, setSelectedFY] = useState(currentFY());
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => <Skeleton key={index} className="h-20" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dividends</h1>
        <div className="flex gap-2">
          <Select value={String(selectedFY)} onValueChange={(v) => setSelectedFY(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {allFYs.map((fy) => <SelectItem key={fy} value={String(fy)}>{getFYLabel(fy)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setAddOpen(true)} disabled={addOpen}>
            <PlusCircle className="h-4 w-4 mr-1" /> Add Dividend
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{getFYLabel(selectedFY)} Total</p><p className="text-2xl font-bold"><CurrencyAmount value={fyTotal} /></p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Reinvested (DRP)</p><p className="text-2xl font-bold"><CurrencyAmount value={fyReinvested} /></p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Cash received</p><p className="text-2xl font-bold"><CurrencyAmount value={fyTotal - fyReinvested} /></p></CardContent></Card>
      </div>

      {(
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
                    <td className="py-2"><Button size="sm" variant="ghost" onClick={() => setDeleteId(d.id)}><Trash2 className="h-3 w-3" /></Button></td>
                  </tr>
                ))}
                {addOpen && (
                  <tr className="border-t bg-fs-accent-50">
                    <td colSpan={6} className="px-4 py-3">
                      <form onSubmit={handleSubmit((d) => add.mutate(d))} className="flex flex-wrap gap-2 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Payment date</label>
                          <Input type="date" className="w-36 h-8 text-sm" {...register("paymentDate")} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Ticker</label>
                          <Input placeholder="e.g. A200.AX" className="w-28 h-8 text-sm" {...register("ticker")} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Type</label>
                          <Select defaultValue="ETF" onValueChange={(v) => v && setValue("holdingType", v)}>
                            <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>{HOLDING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Net amount ($)</label>
                          <Input type="number" placeholder="0" className="w-28 h-8 text-sm" {...register("netAmount")} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Price at div.</label>
                          <Input type="number" placeholder="0" className="w-28 h-8 text-sm" {...register("priceAtDividend")} />
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <label className="text-xs text-muted-foreground">DRP</label>
                          <input type="checkbox" className="h-4 w-4 mt-2" {...register("reinvested")} />
                        </div>
                        <div className="flex gap-2 items-end">
                          <Button type="submit" size="sm" disabled={add.isPending}>Add</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => { setAddOpen(false); reset(); }}><X className="h-3 w-3" /></Button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
                {fyDividends.length === 0 && !addOpen && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No dividends for {getFYLabel(selectedFY)}</td></tr>}
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
      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { del.mutate(deleteId); setDeleteId(null); } }}
        title="Delete dividend entry?"
        isPending={del.isPending}
      />
    </div>
  );
}
