"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Delta } from "@/components/ui/delta";
import { Sparkline } from "@/components/ui/sparkline";
import { AllocationBar, type AllocationSegment } from "@/components/ui/allocation-bar";
import dynamic from "next/dynamic";
import { Download, Plus } from "lucide-react";

const AllocationChart = dynamic(
  () => import("./Charts").then((module) => ({ default: module.AllocationChart })),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-64 w-full" />,
  }
);

const HistoryCharts = dynamic(
  () => import("./Charts").then((module) => ({ default: module.HistoryCharts })),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-72 w-full" />,
  }
);

type NWData = {
  cashTotal: number;
  superTotal: number;
  propertyTotal: number;
  mortgageTotal: number;
  loansTotal: number;
  liabilitiesTotal: number;
  etfHoldings: { id: string; ticker: string; name: string | null; unitsHeld: number; costBasis: number; targetAllocation: number }[];
  stockHoldings: { id: string; ticker: string; unitsHeld: number; costBasis: number }[];
  cryptoHoldings: { id: string; ticker: string; unitsHeld: number; costBasis: number }[];
  allocationSettings: { etf: number; stock: number; crypto: number; cash: number; mf: number };
  history: { date: string; netWorth: number; cashTotal: number; etfTotal: number; stockTotal: number; cryptoTotal: number; managedFundTotal: number; superTotal: number; propertyValue: number; liabilitiesTotal: number; savingsRate: number | null }[];
  properties: { id: string; name: string; currentValue: number; currentMortgageBalance: number; mortgageRemainingBalance: number; equityLoanBalance: number; equity: number }[];
  superAccounts: { id: string; name: string; balance: number }[];
};


export default function NetWorthClient() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<NWData>({
    queryKey: queryKeys.dashboard(),
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
    staleTime: 30 * 1000,
  });

  const etfTickers = data?.etfHoldings.map((h) => h.ticker) ?? [];
  const { data: etfPrices } = useQuery({
    queryKey: queryKeys.prices.stocks(etfTickers),
    queryFn: () => fetch(`/api/prices/stocks?tickers=${etfTickers.join(",")}`).then((r) => r.json()),
    enabled: etfTickers.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const recordMutation = useMutation({
    mutationFn: () => fetch("/api/history/record", { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboard() });
      qc.invalidateQueries({ queryKey: queryKeys.history.list() });
    },
  });

  // ── Computed values (all hooks before any early return) ────────────
  const etfLiveValue = useMemo(() => (data?.etfHoldings ?? []).reduce((sum, holding) => {
    const price = (etfPrices as Record<string, { price: number | null }>)?.[holding.ticker]?.price;
    return sum + (price != null ? price * holding.unitsHeld : holding.costBasis);
  }, 0), [data?.etfHoldings, etfPrices]);

  const stockValue = useMemo(() => (data?.stockHoldings ?? []).reduce((sum, holding) => sum + holding.costBasis, 0), [data?.stockHoldings]);
  const cryptoValue = useMemo(() => (data?.cryptoHoldings ?? []).reduce((sum, holding) => sum + holding.costBasis, 0), [data?.cryptoHoldings]);

  const totalInvestable = useMemo(() => etfLiveValue + stockValue + cryptoValue + (data?.cashTotal ?? 0), [etfLiveValue, stockValue, cryptoValue, data?.cashTotal]);
  const totalAssets = useMemo(() => totalInvestable + (data?.superTotal ?? 0) + (data?.propertyTotal ?? 0), [totalInvestable, data?.superTotal, data?.propertyTotal]);
  const netWorth = useMemo(() => totalAssets - (data?.liabilitiesTotal ?? 0), [totalAssets, data?.liabilitiesTotal]);
  const propertyEquity = useMemo(() => (data?.properties ?? []).reduce((sum, property) => sum + property.equity, 0), [data?.properties]);

  // Month-over-month delta from history snapshots
  const { monthDelta, monthDeltaPercent } = useMemo(() => {
    const latestSnapshot = data?.history.at(-1);
    const previousSnapshot = data?.history.at(-2);
    const delta = latestSnapshot && previousSnapshot
      ? latestSnapshot.netWorth - previousSnapshot.netWorth
      : 0;
    const deltaPercent = previousSnapshot && previousSnapshot.netWorth > 0
      ? (delta / previousSnapshot.netWorth) * 100
      : 0;
    return { monthDelta: delta, monthDeltaPercent: deltaPercent };
  }, [data?.history]);

  // Sparkline data from history (last 12 points)
  const historyNetWorth = useMemo(() => (data?.history ?? []).slice(-12).map((item) => item.netWorth), [data?.history]);
  const historyInvestable = useMemo(() => (data?.history ?? []).slice(-12).map(
    (item) => item.etfTotal + item.stockTotal + item.cryptoTotal + item.cashTotal
  ), [data?.history]);
  const historyLiabilities = useMemo(() => (data?.history ?? []).slice(-12).map((item) => item.liabilitiesTotal), [data?.history]);

  // Allocation for the bar + donut
  const allocationData = useMemo(() => [
    { name: "ETFs",    value: etfLiveValue, target: data?.allocationSettings.etf ?? 0 },
    { name: "Stocks",  value: stockValue,   target: data?.allocationSettings.stock ?? 0 },
    { name: "Crypto",  value: cryptoValue,  target: data?.allocationSettings.crypto ?? 0 },
    { name: "Cash",    value: data?.cashTotal ?? 0, target: data?.allocationSettings.cash ?? 0 },
  ].filter((item) => item.value > 0), [etfLiveValue, stockValue, cryptoValue, data?.cashTotal, data?.allocationSettings]);

  const allocationSegments: AllocationSegment[] = useMemo(() => [
    { name: "ETFs",     value: etfLiveValue,               color: "var(--fs-cat-etf)" },
    { name: "Property", value: data?.propertyTotal ?? 0,   color: "var(--fs-cat-property)" },
    { name: "Super",    value: data?.superTotal ?? 0,       color: "var(--fs-cat-super)" },
    { name: "Stocks",   value: stockValue,                  color: "var(--fs-cat-stock)" },
    { name: "Cash",     value: data?.cashTotal ?? 0,        color: "var(--fs-cat-cash)" },
    { name: "Crypto",   value: cryptoValue,                 color: "var(--fs-cat-crypto)" },
  ].filter((segment) => segment.value > 0), [etfLiveValue, data?.propertyTotal, data?.superTotal, stockValue, data?.cashTotal, cryptoValue]);

  const assetRows = useMemo(() => [
    { label: "ETFs",               value: etfLiveValue,               color: "var(--fs-cat-etf)",      histKey: "etfTotal" },
    { label: "Stocks",             value: stockValue,                  color: "var(--fs-cat-stock)",    histKey: "stockTotal" },
    { label: "Crypto",             value: cryptoValue,                 color: "var(--fs-cat-crypto)",   histKey: "cryptoTotal" },
    { label: "Cash Savings",       value: data?.cashTotal ?? 0,        color: "var(--fs-cat-cash)",     histKey: "cashTotal" },
    { label: "Super / Retirement", value: data?.superTotal ?? 0,       color: "var(--fs-cat-super)",    histKey: "superTotal" },
    { label: "Property",           value: data?.propertyTotal ?? 0,    color: "var(--fs-cat-property)", histKey: "propertyValue" },
    { label: "Liabilities",        value: -(data?.liabilitiesTotal ?? 0), color: "var(--fs-loss)",      histKey: "liabilitiesTotal" },
  ], [etfLiveValue, stockValue, cryptoValue, data?.cashTotal, data?.superTotal, data?.propertyTotal, data?.liabilitiesTotal]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-36 col-span-1 sm:col-span-2 lg:col-span-2" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!data || (data as { error?: string }).error) {
    return <p className="text-muted-foreground">No data yet. Complete setup in Settings first.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm">
            <Download className="size-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => recordMutation.mutate()}
            disabled={recordMutation.isPending}
          >
            <Plus className="size-3.5" />
            {recordMutation.isPending ? "Recording…" : "Record snapshot"}
          </Button>
        </div>
      </div>

      {/* ── Hero KPI strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 items-stretch">
        {/* Hero card — inverted */}
        <div
          className="rounded-xl p-5 flex flex-col justify-between min-h-[140px]"
          style={{ background: "var(--fs-surface-inv)", color: "var(--fs-ink-on-inv)", contentVisibility: "auto" }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-sm" style={{ color: "oklch(from var(--fs-ink-on-inv) l c h / 0.6)" }}>
              Total Net Worth
            </span>
            <span 
              className="text-[28px] font-semibold tracking-tight tabular-nums leading-none"
              style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif" }}
            >
              <CurrencyAmount value={netWorth} />
            </span>
            <div className="flex items-center gap-2 text-sm" style={{ color: "oklch(from var(--fs-ink-on-inv) l c h / 0.7)" }}>
              {monthDelta !== 0 && (
                <Delta value={monthDelta} percent={monthDeltaPercent} showIcon />
              )}
              {monthDelta !== 0 && <span>this month</span>}
            </div>
          </div>
          {historyNetWorth.length >= 2 && (
            <div className="mt-3">
              <Sparkline
                data={historyNetWorth}
                width={280}
                height={32}
                color="var(--fs-ink-on-inv)"
                strokeWidth={1.25}
              />
            </div>
          )}
        </div>

        {/* Investable */}
        <Card className="flex flex-col justify-between">
          <CardContent className="pt-4 pb-4 flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Investable assets</span>
            <span className="text-[22px] font-semibold tracking-tight tabular-nums leading-none">
              <CurrencyAmount value={totalInvestable} />
            </span>
            <span className="text-sm text-muted-foreground">
              {totalAssets > 0 ? `${((totalInvestable / totalAssets) * 100).toFixed(0)}% of total assets` : "—"}
            </span>
            {historyInvestable.length >= 2 && (
              <div className="mt-2">
                <Sparkline
                  data={historyInvestable}
                  width={200}
                  height={28}
                  color="var(--fs-cat-etf)"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property equity */}
        <Card className="flex flex-col justify-between">
          <CardContent className="pt-4 pb-4 flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Property equity</span>
            <span className="text-[22px] font-semibold tracking-tight tabular-nums leading-none">
              <CurrencyAmount value={propertyEquity} />
            </span>
            <span className="text-sm text-muted-foreground">
              {data.properties.length} {data.properties.length === 1 ? "property" : "properties"}
            </span>
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card className="flex flex-col justify-between">
          <CardContent className="pt-4 pb-4 flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Liabilities</span>
            <span className="text-[22px] font-semibold tracking-tight tabular-nums leading-none text-loss">
              <CurrencyAmount value={data.liabilitiesTotal} />
            </span>
            {historyLiabilities.length >= 2 && (
              <>
                <Delta
                  value={-(historyLiabilities.at(-1)! - historyLiabilities.at(-2)!)}
                  percent={
                    historyLiabilities.at(-2)! > 0
                      ? (-(historyLiabilities.at(-1)! - historyLiabilities.at(-2)!) / historyLiabilities.at(-2)!) * 100
                      : 0
                  }
                  showIcon
                />
                <div className="mt-2">
                  <Sparkline
                    data={historyLiabilities}
                    width={200}
                    height={28}
                    color="var(--fs-loss)"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── History chart + Allocation ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {data.history.length > 1 && (
          <HistoryCharts history={data.history} />
        )}

        <div className="flex flex-col gap-4">
          {/* Allocation bar */}
          {allocationSegments.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Allocation</span>
                  <Badge variant="outline" className="text-xs tabular-nums">
                    <CurrencyAmount value={totalAssets} compact />
                  </Badge>
                </div>
                <AllocationBar segments={allocationSegments} height={10} />
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {allocationSegments.map((segment) => (
                    <div key={segment.name} className="flex items-center gap-1.5 text-xs">
                      <span className="size-2 rounded-full flex-shrink-0" style={{ background: segment.color }} />
                      <span className="text-muted-foreground">{segment.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {totalAssets > 0 ? `${((segment.value / totalAssets) * 100).toFixed(1)}%` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {allocationData.length > 0 && (
            <AllocationChart allocationData={allocationData} totalInvestable={totalInvestable} />
          )}
        </div>
      </div>

      {/* ── Asset breakdown table ─────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[15px] font-semibold">Asset breakdown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">% of total</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">12m trend</th>
              </tr>
            </thead>
            <tbody>
              {assetRows.filter((row) => row.value !== 0).map((row) => {
                const sparkData = data.history.slice(-9).map(
                  (item) => Math.abs(item[row.histKey as keyof typeof item] as number)
                );
                return (
                  <tr key={row.label} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="size-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                        <span>{row.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">
                      <CurrencyAmount value={row.value} showSign={row.value < 0} />
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground tabular-nums">
                      {totalAssets > 0 ? `${((Math.abs(row.value) / totalAssets) * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right hidden sm:table-cell">
                      {sparkData.length >= 2 && (
                        <Sparkline
                          data={sparkData}
                          width={80}
                          height={20}
                          color={row.color}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Properties table ─────────────────────────────────────── */}
      {data.properties.length > 0 && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="text-[15px] font-semibold">Properties</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Property</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Mortgage</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Equity</th>
                </tr>
              </thead>
              <tbody>
                {data.properties.map((property) => {
                  const lvr = property.currentValue > 0
                    ? (property.currentMortgageBalance / property.currentValue) * 100
                    : 0;
                  return (
                    <tr key={property.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium">{property.name}</div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        <CurrencyAmount value={property.currentValue} />
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-loss">
                        <CurrencyAmount value={property.currentMortgageBalance} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-medium tabular-nums">
                            <CurrencyAmount value={property.equity} />
                          </span>
                          {lvr > 0 && (
                            <Badge variant={lvr > 70 ? "warn" : "outline"} className="text-xs tabular-nums">
                              {lvr.toFixed(0)}% LVR
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
