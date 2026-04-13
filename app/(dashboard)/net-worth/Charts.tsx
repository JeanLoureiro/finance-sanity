"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
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

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#ef4444", "#0891b2", "#64748b"];

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), "MMM yy"); } catch { return dateStr; }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 }).format(value);

export function AllocationChart({ allocationData, totalInvestable }: { allocationData: AllocationItem[]; totalInvestable: number }) {
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
        <div className="mt-4 space-y-2">
          {allocationData.map((allocationItem, index) => {
            const actual = totalInvestable > 0 ? allocationItem.value / totalInvestable : 0;
            const delta = actual - allocationItem.target;
            return (
              <div key={allocationItem.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="w-20">{allocationItem.name}</span>
                <span className="text-muted-foreground">{(actual * 100).toFixed(1)}% / {(allocationItem.target * 100).toFixed(0)}% target</span>
                <Badge variant={Math.abs(delta) < 0.05 ? "outline" : "destructive"} className="ml-auto text-xs">
                  {delta > 0 ? "+" : ""}{(delta * 100).toFixed(1)}%
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function HistoryCharts({ history }: { history: HistoryItem[] }) {
  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-base">Net Worth History</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={history} margin={{ left: 10, right: 10 }}>
              <defs>
                {[
                  ["etfGrad", "#2563eb"],
                  ["stockGrad", "#16a34a"],
                  ["cryptoGrad", "#d97706"],
                  ["mfGrad", "#9333ea"],
                  ["cashGrad", "#0891b2"],
                  ["superGrad", "#64748b"],
                  ["propGrad", "#ea580c"],
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
}
