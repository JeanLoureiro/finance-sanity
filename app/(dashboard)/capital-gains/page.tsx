"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { currentFY, getFYLabel } from "@/lib/australianFY";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { format } from "date-fns";

type CGTRow = {
  id: string;
  ticker: string;
  assetType: string;
  date: string;
  direction: "BUY" | "SELL";
  units: number;
  price: number;
  brokerage: number;
  cumulativeUnits: number;
  costBasis: number;
  avgCostPerUnit: number;
  capitalGain: number | null;
  isLongTerm: boolean | null;
  taxOnGain: number | null;
};

type CGTSummary = {
  fy: number;
  shortTermGain: number;
  longTermGain: number;
  totalGain: number;
  estimatedTax: number;
};

type CGTData = {
  rows: CGTRow[];
  summaries: CGTSummary[];
  availableFYs: number[];
  rates: { shortRate: number; longRate: number };
};

const fmt = (v: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(v);

function GainBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={value > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
      {value > 0 ? "+" : ""}{fmt(value)}
    </span>
  );
}

export default function CapitalGainsPage() {
  const thisFY = currentFY();
  const [selectedFY, setSelectedFY] = useState(thisFY);
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = useQuery<CGTData>({
    queryKey: queryKeys.capitalGains.all(),
    queryFn: () => fetch("/api/capital-gains").then((r) => r.json()),
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || (data as { error?: string }).error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Capital Gains</h1>
        <p className="text-muted-foreground">No trading data yet. Add purchases and sales in ETFs, Stocks, Crypto, or Managed Funds.</p>
      </div>
    );
  }

  const { rows, summaries, availableFYs, rates } = data;

  // FY tabs — always show current FY even if no data yet
  const fyOptions = availableFYs.includes(thisFY) ? availableFYs : [...availableFYs, thisFY].sort();

  const summary = summaries.find((s) => s.fy === selectedFY) ?? {
    fy: selectedFY, shortTermGain: 0, longTermGain: 0, totalGain: 0, estimatedTax: 0,
  };

  const fyRows = rows.filter((r) => {
    const date = new Date(r.date);
    const rowFY = date.getMonth() >= 6 ? date.getFullYear() + 1 : date.getFullYear();
    return rowFY === selectedFY;
  });

  const sellRows = fyRows.filter((r) => r.direction === "SELL");
  const displayRows = showAll ? fyRows : sellRows;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Capital Gains</h1>
        <p className="text-sm text-muted-foreground">
          Short-term rate: {(rates.shortRate * 100).toFixed(0)}% &nbsp;·&nbsp;
          Long-term rate: {(rates.longRate * 100).toFixed(0)}% (AUS 50% CGT discount applied)
        </p>
      </div>

      {/* FY selector */}
      {fyOptions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {fyOptions.map((fy) => (
            <button
              key={fy}
              onClick={() => setSelectedFY(fy)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedFY === fy
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {getFYLabel(fy)}
            </button>
          ))}
        </div>
      )}

      {/* FY summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Short-term Gain</p>
            <p className={`text-2xl font-bold mt-1 ${summary.shortTermGain < 0 ? "text-red-500" : summary.shortTermGain > 0 ? "text-green-600" : ""}`}>
              <CurrencyAmount value={summary.shortTermGain} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">Held ≤ 12 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Long-term Gain</p>
            <p className={`text-2xl font-bold mt-1 ${summary.longTermGain < 0 ? "text-red-500" : summary.longTermGain > 0 ? "text-green-600" : ""}`}>
              <CurrencyAmount value={summary.longTermGain} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">Held &gt; 12 months · 50% discount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Net Gain</p>
            <p className={`text-2xl font-bold mt-1 ${summary.totalGain < 0 ? "text-red-500" : summary.totalGain > 0 ? "text-green-600" : ""}`}>
              <CurrencyAmount value={summary.totalGain} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Estimated Tax</p>
            <p className="text-2xl font-bold mt-1 text-orange-600">
              <CurrencyAmount value={summary.estimatedTax} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">{getFYLabel(selectedFY)}</p>
          </CardContent>
        </Card>
      </div>

      {/* All-FY summary table */}
      {summaries.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Summary by Financial Year</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-2">FY</th>
                  <th className="text-right px-4 py-2">ST Gain</th>
                  <th className="text-right px-4 py-2">LT Gain</th>
                  <th className="text-right px-4 py-2">Net Gain</th>
                  <th className="text-right px-4 py-2">Est. Tax</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr
                    key={s.fy}
                    className={`border-b last:border-0 cursor-pointer hover:bg-muted/30 ${s.fy === selectedFY ? "bg-primary/5" : ""}`}
                    onClick={() => setSelectedFY(s.fy)}
                  >
                    <td className="px-4 py-2 font-medium">{getFYLabel(s.fy)}</td>
                    <td className="px-4 py-2 text-right"><GainBadge value={s.shortTermGain} /></td>
                    <td className="px-4 py-2 text-right"><GainBadge value={s.longTermGain} /></td>
                    <td className="px-4 py-2 text-right"><GainBadge value={s.totalGain} /></td>
                    <td className="px-4 py-2 text-right text-orange-600 font-medium">{fmt(s.estimatedTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* FIFO detail table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {getFYLabel(selectedFY)} — FIFO Detail
              {sellRows.length > 0 && <span className="text-muted-foreground font-normal text-sm ml-2">({sellRows.length} sale{sellRows.length !== 1 ? "s" : ""})</span>}
            </CardTitle>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {showAll ? "Show sells only" : "Show all trades"}
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {displayRows.length === 0 ? (
            <p className="px-4 py-6 text-center text-muted-foreground text-sm">
              No {showAll ? "trades" : "sales"} in {getFYLabel(selectedFY)}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Ticker</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Dir</th>
                    <th className="text-right px-3 py-2">Units</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-right px-3 py-2">Brokerage</th>
                    <th className="text-right px-3 py-2">Capital Gain</th>
                    <th className="text-center px-3 py-2">LT?</th>
                    <th className="text-right px-3 py-2">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b last:border-0 ${
                        row.direction === "BUY" ? "text-muted-foreground" : ""
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {format(new Date(row.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-3 py-2 font-medium">{row.ticker}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs">{row.assetType}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={row.direction === "BUY" ? "secondary" : "outline"} className="text-xs">
                          {row.direction}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">{row.units.toLocaleString("en-AU", { maximumFractionDigits: 4 })}</td>
                      <td className="px-3 py-2 text-right">{fmt(row.price)}</td>
                      <td className="px-3 py-2 text-right">{row.brokerage > 0 ? fmt(row.brokerage) : "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {row.capitalGain != null ? <GainBadge value={row.capitalGain} /> : "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.isLongTerm != null ? (
                          row.isLongTerm
                            ? <span className="text-green-600 text-xs font-medium">✓ LT</span>
                            : <span className="text-orange-500 text-xs">ST</span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.taxOnGain != null && row.taxOnGain > 0 ? (
                          <span className="text-orange-600">{fmt(row.taxOnGain)}</span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
