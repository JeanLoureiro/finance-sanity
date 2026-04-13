"use client";

import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FIRERow } from "@/app/api/fire/route";

const fmtCompact = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 }).format(value);

const fmtFull = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value);

type FireChartProps = {
  chartRows: FIRERow[];
  preSuperFIREYear: number | null | undefined;
  yearOfBirth: number;
};

export default function FireChart({ chartRows, preSuperFIREYear, yearOfBirth }: FireChartProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">FIRE Projection</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartRows} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} width={65} />
            <Tooltip
              formatter={(value, name) => [fmtFull(Number(value)), name]}
              labelFormatter={(label) => `${label} (age ${Number(label) - yearOfBirth})`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {preSuperFIREYear && (
              <ReferenceLine x={preSuperFIREYear} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "Pre-FIRE", fontSize: 10, fill: "#22c55e" }} />
            )}
            <Area type="monotone" dataKey="nwTarget" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeWidth={1} name="NW Target" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="investNW" stroke="#2563eb" strokeWidth={2} dot={false} name="Investable NW" />
            <Line type="monotone" dataKey="superBal" stroke="#64748b" strokeWidth={2} dot={false} name="Super Balance" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
