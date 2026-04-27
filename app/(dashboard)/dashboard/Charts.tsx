"use client";

import { memo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AllocationItem = { name: string; value: number; target: number };
type HistoryItem = {
  date: string;
  cashTotal: number;
  etfTotal: number;
  stockTotal: number;
  cryptoTotal: number;
  managedFundTotal: number;
  superTotal: number;
  propertyValue: number;
  savingsRate: number | null;
};

// Approximate the Sanctum oklch category tokens as hex for Recharts (which cannot use CSS variables)
const COLORS = [
  "#4060c8", // cat-etf      oklch(0.55 0.080 250)
  "#3a7a48", // cat-property oklch(0.55 0.060 140)
  "#8040a0", // cat-super    oklch(0.55 0.075 320)
  "#6050b8", // cat-stock    oklch(0.50 0.080 280)
  "#3888b0", // cat-cash     oklch(0.62 0.060 200)
  "#b07020", // cat-crypto   oklch(0.65 0.090 60)
  "#2a7080", // cat-mf       oklch(0.50 0.060 180)
];

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), "MMM yy"); } catch { return dateStr; }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 }).format(value);

export const AllocationChart = memo(function AllocationChart({ allocationData, totalInvestable }: { allocationData: AllocationItem[]; totalInvestable: number }) {
  return (
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
              {allocationData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-4">
          {allocationData.map((allocationItem, index) => {
            const actual = totalInvestable > 0 ? allocationItem.value / totalInvestable : 0;
            const delta = actual - allocationItem.target;
            const hasTarget = allocationItem.target > 0;
            const isOverTarget = hasTarget && delta > 0.05;
            const isUnderTarget = hasTarget && delta < -0.05;

            return (
              <div key={allocationItem.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                    <span className="font-medium">{allocationItem.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{(actual * 100).toFixed(1)}%</span>
                    {hasTarget && (
                      <Badge
                        variant={isOverTarget || isUnderTarget ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        {delta > 0 ? "+" : ""}{(delta * 100).toFixed(1)}% vs target
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="relative h-2 rounded-full bg-muted overflow-visible">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(actual * 100, 100)}%`,
                      background: COLORS[index % COLORS.length],
                    }}
                  />
                  {hasTarget && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-foreground/40"
                      style={{ left: `${Math.min(allocationItem.target * 100, 100)}%` }}
                      title={`Target: ${(allocationItem.target * 100).toFixed(0)}%`}
                    />
                  )}
                </div>

                {hasTarget && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{isOverTarget ? "Overweight" : isUnderTarget ? "Underweight" : "On target"}</span>
                    <span>Target: {(allocationItem.target * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export const HistoryCharts = memo(function HistoryCharts({ history }: { history: HistoryItem[] }) {
  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-base">Net Worth History</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={history} margin={{ left: 10, right: 10 }}>
              <defs>
                {[
                  ["etfGrad",    "#4060c8"],
                  ["stockGrad",  "#6050b8"],
                  ["cryptoGrad", "#b07020"],
                  ["mfGrad",     "#2a7080"],
                  ["cashGrad",   "#3888b0"],
                  ["superGrad",  "#8040a0"],
                  ["propGrad",   "#3a7a48"],
                ].map(([gradientId, color]) => (
                  <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={65} />
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} labelFormatter={(label) => formatDate(String(label))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="etfTotal"          stackId="a" stroke="#4060c8" fill="url(#etfGrad)"    name="ETFs"          strokeWidth={1.5} />
              <Area type="monotone" dataKey="stockTotal"        stackId="a" stroke="#6050b8" fill="url(#stockGrad)"  name="Stocks"        strokeWidth={1.5} />
              <Area type="monotone" dataKey="cryptoTotal"       stackId="a" stroke="#b07020" fill="url(#cryptoGrad)" name="Crypto"        strokeWidth={1.5} />
              <Area type="monotone" dataKey="managedFundTotal"  stackId="a" stroke="#2a7080" fill="url(#mfGrad)"     name="Managed Funds" strokeWidth={1.5} />
              <Area type="monotone" dataKey="cashTotal"         stackId="a" stroke="#3888b0" fill="url(#cashGrad)"   name="Cash"          strokeWidth={1.5} />
              <Area type="monotone" dataKey="superTotal"        stackId="a" stroke="#8040a0" fill="url(#superGrad)"  name="Super"         strokeWidth={1.5} />
              <Area type="monotone" dataKey="propertyValue"     stackId="a" stroke="#3a7a48" fill="url(#propGrad)"   name="Property"      strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {history.some((historyItem) => historyItem.savingsRate != null) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Savings Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
                  tick={{ fontSize: 11 }}
                  width={45}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, "Savings Rate"]}
                  labelFormatter={(label) => formatDate(String(label))}
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
  );
});
