"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, PlusCircle } from "lucide-react";
import { useState } from "react";

type OtherAsset = {
  id: string; description: string; purchaseDate: string; units: string | number;
  currency: string; unitPurchasePrice: string | number; liveUnitPrice: string | number | null; soldUnits: string | number;
};

export default function OtherAssetsPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: assets = [], isLoading } = useQuery<OtherAsset[]>({
    queryKey: queryKeys.otherAssets(),
    queryFn: () => fetch("/api/other-assets").then((r) => r.json()),
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/other-assets/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.otherAssets() }),
  });

  const updatePrice = useMutation({
    mutationFn: ({ id, liveUnitPrice }: { id: string; liveUnitPrice: number }) =>
      fetch(`/api/other-assets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ liveUnitPrice }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.otherAssets() }),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { description: "", purchaseDate: "", units: 1, currency: "AUD", unitPurchasePrice: 0, liveUnitPrice: 0, soldUnits: 0 },
  });

  const add = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/other-assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.otherAssets() }); reset(); setAddOpen(false); },
  });

  const enriched = assets.map((a) => {
    const heldUnits = Number(a.units) - Number(a.soldUnits);
    const costBasis = Number(a.unitPurchasePrice) * Number(a.units);
    const livePrice = a.liveUnitPrice !== null ? Number(a.liveUnitPrice) : Number(a.unitPurchasePrice);
    const liveValue = livePrice * heldUnits;
    return { ...a, heldUnits, costBasis, livePrice, liveValue, gain: liveValue - costBasis };
  });

  const totalValue = enriched.reduce((s, a) => s + a.liveValue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Other Assets</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Other Asset</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-3">
              <Input placeholder="Description (e.g. Vintage watch, Gold)" {...register("description")} />
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs text-muted-foreground">Purchase date</label><Input type="date" {...register("purchaseDate")} /></div>
                <div className="flex-1"><label className="text-xs text-muted-foreground">Currency</label><Input placeholder="AUD" {...register("currency")} /></div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs text-muted-foreground">Units / quantity</label><Input type="number" step="0.01" {...register("units")} /></div>
                <div className="flex-1"><label className="text-xs text-muted-foreground">Purchase price per unit</label><Input type="number" step="0.01" {...register("unitPurchasePrice")} /></div>
              </div>
              <div><label className="text-xs text-muted-foreground">Current price per unit (optional)</label><Input type="number" step="0.01" {...register("liveUnitPrice")} /></div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Add Asset</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Other Assets</p><p className="text-2xl font-bold"><CurrencyAmount value={totalValue} /></p></CardContent></Card>

      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-left py-3 px-4">Purchased</th>
                <th className="text-right py-3 px-4">Units</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">Value</th>
                <th className="text-right py-3 px-4">Gain</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <div className="font-medium">{a.description}</div>
                    {a.currency !== "AUD" && <Badge variant="outline" className="text-xs">{a.currency}</Badge>}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(a.purchaseDate).toLocaleDateString("en-AU")}</td>
                  <td className="py-3 px-4 text-right">{a.heldUnits}</td>
                  <td className="py-3 px-4 text-right">
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={a.livePrice}
                      className="w-28 text-right h-7 text-sm"
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== a.livePrice) updatePrice.mutate({ id: a.id, liveUnitPrice: val });
                      }}
                    />
                  </td>
                  <td className="py-3 px-4 text-right font-medium"><CurrencyAmount value={a.liveValue} /></td>
                  <td className={`py-3 px-4 text-right ${a.gain >= 0 ? "text-green-600" : "text-red-600"}`}><CurrencyAmount value={a.gain} showSign /></td>
                  <td className="py-3 px-4"><Button size="sm" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-3 w-3" /></Button></td>
                </tr>
              ))}
              {assets.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No other assets. Add one above.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
