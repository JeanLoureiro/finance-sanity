"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const AllocationChart = dynamic(
  () => import("./Charts").then((module) => ({ default: module.AllocationChart })),
  { ssr: false, loading: () => <Skeleton className="h-[360px] w-full" /> }
);

const HistoryCharts = dynamic(
  () => import("./Charts").then((module) => ({ default: module.HistoryCharts })),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> }
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

export default function NetWorthPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<NWData>({
    queryKey: queryKeys.netWorth(),
    queryFn: () => fetch("/api/net-worth").then((r) => r.json()),
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
      qc.invalidateQueries({ queryKey: queryKeys.netWorth() });
      qc.invalidateQueries({ queryKey: queryKeys.history.list() });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    );
  }

  if (!data || (data as { error?: string }).error) {
    return <div className="text-muted-foreground">No data yet. Complete setup in Settings first.</div>;
  }

  const etfLiveValue = (data.etfHoldings ?? []).reduce((s, h) => {
    const price = (etfPrices as Record<string, { price: number | null }>)?.[h.ticker]?.price;
    return s + (price != null ? price * h.unitsHeld : h.costBasis);
  }, 0);

  const stockValue = data.stockHoldings.reduce((s, h) => s + h.costBasis, 0);
  const cryptoValue = data.cryptoHoldings.reduce((s, h) => s + h.costBasis, 0);

  const totalInvestable = etfLiveValue + stockValue + cryptoValue + data.cashTotal;
  const totalAssets = totalInvestable + data.superTotal + data.propertyTotal;
  const netWorth = totalAssets - data.liabilitiesTotal;

  const allocationData = [
    { name: "ETFs", value: etfLiveValue, target: data.allocationSettings.etf },
    { name: "Stocks", value: stockValue, target: data.allocationSettings.stock },
    { name: "Crypto", value: cryptoValue, target: data.allocationSettings.crypto },
    { name: "Cash", value: data.cashTotal, target: data.allocationSettings.cash },
  ].filter((d) => d.value > 0);

  const assetRows = [
    { label: "ETFs", value: etfLiveValue },
    { label: "Stocks", value: stockValue },
    { label: "Crypto", value: cryptoValue },
    { label: "Cash Savings", value: data.cashTotal },
    { label: "Super / Retirement", value: data.superTotal },
    { label: "Property", value: data.propertyTotal },
    { label: "Liabilities", value: -data.liabilitiesTotal },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Net Worth</h1>
        <Button
          onClick={() => recordMutation.mutate()}
          disabled={recordMutation.isPending}
          variant="outline"
        >
          {recordMutation.isPending ? "Recording…" : "📅 Record Month"}
        </Button>
      </div>

      {/* Hero */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-2 bg-primary text-primary-foreground">
          <CardContent className="pt-4">
            <p className="text-sm opacity-80">Total Net Worth</p>
            <p className="text-4xl font-bold mt-1"><CurrencyAmount value={netWorth} /></p>
          </CardContent>
        </Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-2xl font-bold"><CurrencyAmount value={totalAssets} /></p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Liabilities</p>
          <p className="text-2xl font-bold text-red-500"><CurrencyAmount value={data.liabilitiesTotal} /></p>
        </CardContent></Card>
      </div>

      {/* Breakdown + allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Asset Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-2">Asset</th>
                  <th className="text-right px-4 py-2">Value</th>
                  <th className="text-right px-4 py-2">% of Assets</th>
                </tr>
              </thead>
              <tbody>
                {assetRows.map(({ label, value }) => (
                  <tr key={label} className={`border-b last:border-0 ${value < 0 ? "text-red-500" : ""}`}>
                    <td className="px-4 py-2">{label}</td>
                    <td className="px-4 py-2 text-right font-medium"><CurrencyAmount value={value} /></td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {totalAssets > 0 ? `${(Math.abs(value) / totalAssets * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {allocationData.length > 0 && (
          <AllocationChart allocationData={allocationData} totalInvestable={totalInvestable} />
        )}
      </div>

      {/* History charts */}
      {data.history.length > 1 && (
        <HistoryCharts history={data.history} />
      )}

      {/* Properties */}
      {data.properties.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Properties</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b"><tr>
                <th className="text-left px-4 py-2">Property</th>
                <th className="text-right px-4 py-2">Value</th>
                <th className="text-right px-4 py-2">Mortgage</th>
                <th className="text-right px-4 py-2">Equity</th>
              </tr></thead>
              <tbody>
                {data.properties.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2 text-right"><CurrencyAmount value={p.currentValue} /></td>
                    <td className="px-4 py-2 text-right text-red-500"><CurrencyAmount value={p.currentMortgageBalance} /></td>
                    <td className="px-4 py-2 text-right font-medium"><CurrencyAmount value={p.equity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
