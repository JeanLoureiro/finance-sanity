"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { format } from "date-fns";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#ef4444", "#0891b2", "#64748b"];

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
  properties: { id: string; name: string; currentValue: number; currentMortgageBalance: number; equity: number }[];
  superAccounts: { id: string; name: string; balance: number }[];
};

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), "MMM yy"); } catch { return dateStr; }
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 }).format(v);

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
          <Card>
            <CardHeader><CardTitle className="text-base">Asset Allocation</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {allocationData.map((d, i) => {
                  const actual = totalInvestable > 0 ? d.value / totalInvestable : 0;
                  const delta = actual - d.target;
                  return (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="w-20">{d.name}</span>
                      <span className="text-muted-foreground">{(actual * 100).toFixed(1)}% / {(d.target * 100).toFixed(0)}% target</span>
                      <Badge variant={Math.abs(delta) < 0.05 ? "outline" : "destructive"} className="ml-auto text-xs">
                        {delta > 0 ? "+" : ""}{(delta * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* History charts */}
      {data.history.length > 1 && (
        <>
          {/* NW growth + stacked asset breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Net Worth History</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.history} margin={{ left: 10, right: 10 }}>
                  <defs>
                    {[
                      ["etfGrad", "#2563eb"],
                      ["stockGrad", "#16a34a"],
                      ["cryptoGrad", "#d97706"],
                      ["mfGrad", "#9333ea"],
                      ["cashGrad", "#0891b2"],
                      ["superGrad", "#64748b"],
                      ["propGrad", "#ea580c"],
                    ].map(([id, color]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={65} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} labelFormatter={(l) => formatDate(String(l))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="etfTotal" stackId="a" stroke="#2563eb" fill="url(#etfGrad)" name="ETFs" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="stockTotal" stackId="a" stroke="#16a34a" fill="url(#stockGrad)" name="Stocks" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="cryptoTotal" stackId="a" stroke="#d97706" fill="url(#cryptoGrad)" name="Crypto" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="managedFundTotal" stackId="a" stroke="#9333ea" fill="url(#mfGrad)" name="Managed Funds" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="cashTotal" stackId="a" stroke="#0891b2" fill="url(#cashGrad)" name="Cash" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="superTotal" stackId="a" stroke="#64748b" fill="url(#superGrad)" name="Super" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="propertyValue" stackId="a" stroke="#ea580c" fill="url(#propGrad)" name="Property" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Savings rate trend */}
          {data.history.some((h) => h.savingsRate != null) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Savings Rate Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.history} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`}
                      tick={{ fontSize: 11 }}
                      width={45}
                      domain={[0, "auto"]}
                    />
                    <Tooltip
                      formatter={(v) => [`${(Number(v) * 100).toFixed(1)}%`, "Savings Rate"]}
                      labelFormatter={(l) => formatDate(String(l))}
                    />
                    <Line
                      type="monotone"
                      dataKey="savingsRate"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Savings Rate"
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
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
