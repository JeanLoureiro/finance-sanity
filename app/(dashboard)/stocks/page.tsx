"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount, PercentChange } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle, History } from "lucide-react";
import { useState } from "react";

type Purchase = { id: string; date: string; units: number; price: number; brokerage: number; direction: string };
type StockHolding = { id: string; ticker: string; name: string | null; targetAllocation: number; purchases: Purchase[] };
type PriceMap = Record<string, { price: number | null; name: string | null }>;

function PurchaseHistory({ holdingId }: { holdingId: string }) {
  const qc = useQueryClient();
  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: queryKeys.holdings.purchases("stocks", holdingId),
    queryFn: () => fetch(`/api/stocks/${holdingId}/purchases`).then((r) => r.json()),
  });
  const del = useMutation({
    mutationFn: (pid: string) =>
      fetch(`/api/stocks/${holdingId}/purchases/${pid}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.holdings.all("stocks") });
      qc.invalidateQueries({ queryKey: queryKeys.holdings.purchases("stocks", holdingId) });
    },
  });
  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-semibold">Purchase History</h4>
      <table className="w-full text-xs">
        <thead><tr className="border-b">{["Date", "Dir", "Units", "Price", "Brokerage", ""].map((h) => <th key={h} className="text-left py-1 pr-3">{h}</th>)}</tr></thead>
        <tbody>
          {purchases.map((p) => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="py-1 pr-3">{new Date(p.date).toLocaleDateString("en-AU")}</td>
              <td className="py-1 pr-3"><Badge variant={p.direction === "BUY" ? "default" : "destructive"}>{p.direction}</Badge></td>
              <td className="py-1 pr-3">{Number(p.units).toFixed(4)}</td>
              <td className="py-1 pr-3"><CurrencyAmount value={p.price} /></td>
              <td className="py-1 pr-3"><CurrencyAmount value={p.brokerage} /></td>
              <td><Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button></td>
            </tr>
          ))}
          {purchases.length === 0 && <tr><td colSpan={6} className="py-3 text-muted-foreground">No transactions yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function AddPurchaseForm({ holdingId }: { holdingId: string }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { date: "", units: 0, price: 0, brokerage: 0, direction: "BUY" as const },
  });
  const add = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(`/api/stocks/${holdingId}/purchases`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.holdings.all("stocks") });
      qc.invalidateQueries({ queryKey: queryKeys.holdings.purchases("stocks", holdingId) });
      reset();
    },
  });
  return (
    <form onSubmit={handleSubmit((d) => add.mutate(d))} className="mt-4 space-y-3">
      <h4 className="text-sm font-semibold">Add Transaction</h4>
      <div className="flex flex-wrap gap-2">
        <Input type="date" className="w-36 text-sm" {...register("date")} />
        <Select defaultValue="BUY" onValueChange={(v) => setValue("direction", v as "BUY")}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="BUY">BUY</SelectItem>
            <SelectItem value="SELL">SELL</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" placeholder="Units" className="w-28" {...register("units")} />
        <Input type="number" placeholder="Price $" className="w-28" {...register("price")} />
        <Input type="number" placeholder="Brokerage $" className="w-28" {...register("brokerage")} />
        <Button type="submit" size="sm" disabled={add.isPending}>{add.isPending ? "Adding…" : "Add"}</Button>
      </div>
    </form>
  );
}

export default function StocksPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: holdings = [], isLoading } = useQuery<StockHolding[]>({
    queryKey: queryKeys.holdings.all("stocks"),
    queryFn: () => fetch("/api/stocks").then((r) => r.json()),
  });

  const tickers = holdings.map((h) => h.ticker).filter(Boolean);
  const { data: prices } = useQuery<PriceMap>({
    queryKey: queryKeys.prices.stocks(tickers),
    queryFn: () => fetch(`/api/prices/stocks?tickers=${tickers.join(",")}`).then((r) => r.json()),
    enabled: tickers.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const delHolding = useMutation({
    mutationFn: (id: string) => fetch(`/api/stocks/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.holdings.all("stocks") }),
  });

  const { register: regH, handleSubmit: handleH, reset: resetH } = useForm({
    defaultValues: { ticker: "", name: "", currency: "AUD", targetAllocation: 0, sector: "" },
  });

  const addHolding = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/stocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.holdings.all("stocks") }); resetH(); setAddOpen(false); },
  });

  const enriched = holdings.map((h) => {
    const buyUnits = h.purchases.filter((p) => p.direction === "BUY").reduce((s, p) => s + Number(p.units), 0);
    const sellUnits = h.purchases.filter((p) => p.direction === "SELL").reduce((s, p) => s + Number(p.units), 0);
    const heldUnits = buyUnits - sellUnits;
    const costBasis = h.purchases.filter((p) => p.direction === "BUY").reduce((s, p) => s + Number(p.units) * Number(p.price) + Number(p.brokerage), 0);
    const livePrice = prices?.[h.ticker]?.price ?? null;
    const liveValue = livePrice !== null ? livePrice * heldUnits : null;
    const totalReturn = liveValue !== null ? liveValue - costBasis : null;
    const totalReturnPct = liveValue !== null && costBasis > 0 ? totalReturn! / costBasis : null;
    return { ...h, heldUnits, costBasis, livePrice, liveValue, totalReturn, totalReturnPct };
  });

  const portfolioValue = enriched.reduce((s, h) => s + (h.liveValue ?? h.costBasis), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stocks</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger>
            <Button size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add Stock</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Stock Holding</DialogTitle></DialogHeader>
            <form onSubmit={handleH((d) => addHolding.mutate(d))} className="space-y-3">
              <Input placeholder="Ticker (e.g. CBA.AX or AAPL)" {...regH("ticker")} />
              <Input placeholder="Name (optional)" {...regH("name")} />
              <div className="flex gap-2">
                <Input type="number" placeholder="Target alloc. (0–1)" {...regH("targetAllocation")} />
                <Input placeholder="Sector (optional)" {...regH("sector")} />
              </div>
              <Button type="submit" className="w-full" disabled={addHolding.isPending}>Add Stock</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Portfolio Value</p>
          <p className="text-2xl font-bold"><CurrencyAmount value={portfolioValue} /></p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Holdings</p>
          <p className="text-2xl font-bold">{holdings.length}</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (
        <div className="space-y-4">
          {enriched.map((h) => (
            <Card key={h.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{h.ticker}</span>
                      {h.name && <span className="text-sm text-muted-foreground">{h.name}</span>}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                      <div><p className="text-muted-foreground">Units held</p><p className="font-medium">{h.heldUnits.toFixed(4)}</p></div>
                      <div><p className="text-muted-foreground">Live price</p><p className="font-medium">{h.livePrice ? <CurrencyAmount value={h.livePrice} /> : "—"}</p></div>
                      <div><p className="text-muted-foreground">Live value</p><p className="font-medium">{h.liveValue ? <CurrencyAmount value={h.liveValue} /> : <CurrencyAmount value={h.costBasis} />}</p></div>
                      <div><p className="text-muted-foreground">Total return</p>
                        <p className="font-medium">
                          {h.totalReturn !== null ? (
                            <><CurrencyAmount value={h.totalReturn} showSign /> <PercentChange value={h.totalReturnPct} /></>
                          ) : "—"}
                        </p>
                      </div>
                    </div>
                    {portfolioValue > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Alloc: {((h.liveValue ?? h.costBasis) / portfolioValue * 100).toFixed(1)}%
                        {h.targetAllocation > 0 && <> · Target: {(h.targetAllocation * 100).toFixed(0)}%</>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger>
                        <Button size="sm" variant="outline"><History className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>{h.ticker} — Transactions</DialogTitle></DialogHeader>
                        <PurchaseHistory holdingId={h.id} />
                        <AddPurchaseForm holdingId={h.id} />
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="ghost" onClick={() => delHolding.mutate(h.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {holdings.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No stock holdings yet. Add one above.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
