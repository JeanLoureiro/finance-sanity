"use client";

import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fmtCompact = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 }).format(value);

const fmtFull = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value);

export interface RepaymentChartRow {
  year: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
}

interface RepaymentChartProps {
  rows: RepaymentChartRow[];
}

export default function RepaymentChart({ rows }: RepaymentChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Principal vs Interest Paid</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={rows} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} width={65} />
            <Tooltip formatter={(value, name) => [fmtFull(Number(value)), name]} labelFormatter={(label) => `Year ${label}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="cumulativePrincipal" stackId="a" stroke="#3a7a48" fill="#3a7a48" fillOpacity={0.5} strokeWidth={1.5} name="Principal paid" />
            <Area type="monotone" dataKey="cumulativeInterest" stackId="a" stroke="#b07020" fill="#b07020" fillOpacity={0.5} strokeWidth={1.5} name="Interest paid" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
