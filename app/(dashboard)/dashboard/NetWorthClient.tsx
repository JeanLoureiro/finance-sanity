"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Plus, LayoutGrid } from "lucide-react";
import { DashboardGrid } from "./DashboardGrid";
import { reconcileLayout, compactLayout, WIDGET_REGISTRY, type DashboardWidgetPref } from "@/lib/dashboardWidgets";

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
  const [isEditMode, setIsEditMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const { data, isLoading } = useQuery<NWData>({
    queryKey: queryKeys.dashboard(),
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
    staleTime: 30 * 1000,
  });

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
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

  const allocationSegments = useMemo(() => [
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

  // Widget layout from settings or default
  const layout = useMemo(() => {
    const savedLayout = settings?.dashboardWidgets as DashboardWidgetPref[] | null | undefined;
    const featureFlags = {
      useCapitalGains: settings?.useCapitalGains,
      useFIRE: settings?.useFIRE,
      useSuper: settings?.useSuper,
      useDividends: settings?.useDividends,
      useSideIncome: settings?.useSideIncome,
      useProperty: settings?.useProperty,
      useLiabilities: settings?.useLiabilities,
      useManagedFunds: settings?.useManagedFunds,
      useOtherAssets: settings?.useOtherAssets,
      useCrypto: settings?.useCrypto,
    };
    return reconcileLayout(savedLayout, featureFlags);
  }, [settings]);

  const canEdit = settings?.role === "OWNER" || settings?.role === "WRITE";

  const toggleEditMode = () => {
    // Leaving edit mode: compact the layout so inserts don't leave empty rows.
    if (isEditMode) {
      handleLayoutChange(compactLayout(layout));
    }
    setIsEditMode(!isEditMode);
  };

  const handleLayoutChange = (newLayout: DashboardWidgetPref[]) => {
    const previousData = qc.getQueryData(queryKeys.settings());
    qc.setQueryData(queryKeys.settings(), (previous: Record<string, unknown>) => ({
      ...previous,
      dashboardWidgets: newLayout,
    }));

    abortControllerRef.current = new AbortController();
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboardWidgets: newLayout }),
      signal: abortControllerRef.current.signal,
    }).catch(() => {
      qc.setQueryData(queryKeys.settings(), previousData);
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-36 col-span-1 sm:col-span-2 lg:col-span-2" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          {canEdit && (
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={toggleEditMode}
            >
              <LayoutGrid className="size-3.5" />
              {isEditMode ? "Done editing" : "Edit dashboard"}
            </Button>
          )}
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

      {/* ── Edit mode: Widget catalogue ─────────────────────────────── */}
      {isEditMode && canEdit && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm font-medium mb-3">Add widgets</p>
          <div className="flex flex-wrap gap-2">
            {layout.filter((l) => !l.visible).map((hidden) => (
              <Button
                key={hidden.key}
                variant="outline"
                size="sm"
                onClick={() => {
                  const newLayout = layout.map((item) =>
                    item.key === hidden.key ? { ...item, visible: true } : item
                  );
                  const previousData = qc.getQueryData(queryKeys.settings());
                  qc.setQueryData(queryKeys.settings(), (previous: Record<string, unknown>) => ({
                    ...previous,
                    dashboardWidgets: newLayout,
                  }));

                  abortControllerRef.current = new AbortController();
                  fetch("/api/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dashboardWidgets: newLayout }),
                    signal: abortControllerRef.current.signal,
                  }).catch(() => {
                    qc.setQueryData(queryKeys.settings(), previousData);
                  });
                }}
              >
                {WIDGET_REGISTRY.find((w) => w.key === hidden.key)?.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ── Dashboard Grid ─────────────────────────────────────────── */}
      <DashboardGrid
        layout={layout}
        isEditMode={isEditMode}
        onLayoutChange={handleLayoutChange}
        netWorth={netWorth}
        monthDelta={monthDelta}
        monthDeltaPercent={monthDeltaPercent}
        historyNetWorth={historyNetWorth}
        historyInvestable={historyInvestable}
        historyLiabilities={historyLiabilities}
        totalInvestable={totalInvestable}
        totalAssets={totalAssets}
        propertyEquity={propertyEquity}
        propertyCount={data.properties.length}
        liabilitiesTotal={data.liabilitiesTotal}
        history={data.history}
        allocationSegments={allocationSegments}
        allocationData={allocationData}
        assetRows={assetRows}
        properties={data.properties}
      />
    </div>
  );
}
