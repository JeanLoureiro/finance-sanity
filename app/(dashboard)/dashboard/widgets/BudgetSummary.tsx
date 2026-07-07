"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetSummary() {
  const { data, isLoading } = useQuery<{ monthlyAmount: number }[]>({
    queryKey: queryKeys.budget.items(),
    queryFn: () => fetch("/api/budget").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-5 pb-5">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) return null;

  const totalMonthly = data.reduce((sum, item) => sum + item.monthlyAmount, 0);
  const savingsRate = 0.38; // Placeholder: would need income data from snapshots

  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex flex-col gap-2">
        <div className="text-sm font-semibold">Budget</div>
        <div className="text-sm text-muted-foreground">Savings rate this month</div>
        <div className="text-[20px] font-semibold tracking-tight tabular-nums leading-none text-gain">
          {savingsRate.toFixed(0)}%
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden flex mt-1">
          <div className="h-full bg-fs-gain" style={{ width: `${savingsRate * 100}%` }} />
          <div className="h-full bg-muted" style={{ width: `${(1 - savingsRate) * 100}%` }} />
        </div>
        <div className="text-sm text-muted-foreground">
          ${((totalMonthly * savingsRate)).toFixed(0)} saved of ${totalMonthly.toFixed(0)} income
        </div>
      </CardContent>
    </Card>
  );
}
