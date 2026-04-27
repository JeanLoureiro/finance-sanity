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
              <ReferenceLine x={preSuperFIREYear} stroke="#3a7a48" strokeDasharray="4 2" label={{ value: "Pre-FIRE", fontSize: 10, fill: "#3a7a48" }} />
            )}
            {/* nwTarget: muted/slate  investNW: Sanctum accent (clay amber)  superBal: muted-foreground */}
            <Area type="monotone" dataKey="nwTarget" stroke="#9a9288" fill="#9a9288" fillOpacity={0.12} strokeWidth={1} name="NW Target" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="investNW" stroke="#b07020" strokeWidth={2} dot={false} name="Investable NW" />
            <Line type="monotone" dataKey="superBal" stroke="#7a7068" strokeWidth={2} dot={false} name="Super Balance" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
