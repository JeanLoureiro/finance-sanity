"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HistorySnapshot = { date: string; cashTotal: number };

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), "MMM yy"); } catch { return dateStr; }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 }).format(value);

export default function CashChart({ history }: { history: HistorySnapshot[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Cash Balance History</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={history} margin={{ left: 10, right: 10 }}>
            <defs>
              <linearGradient id="cashHistGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={65} />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} labelFormatter={(label) => formatDate(String(label))} />
            <Area type="monotone" dataKey="cashTotal" stroke="#0891b2" fill="url(#cashHistGrad)" name="Cash" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
