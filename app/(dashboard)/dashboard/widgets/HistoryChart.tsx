"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const HistoryCharts = dynamic(
  () => import("../Charts").then((module) => ({ default: module.HistoryCharts })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full" />,
  }
);

interface HistoryChartProps {
  history: { date: string; netWorth: number; cashTotal: number; etfTotal: number; stockTotal: number; cryptoTotal: number; managedFundTotal: number; superTotal: number; propertyValue: number; liabilitiesTotal: number; savingsRate: number | null }[];
}

export function HistoryChart({ history }: HistoryChartProps) {
  if (history.length <= 1) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <HistoryCharts history={history} />
      </CardContent>
    </Card>
  );
}
