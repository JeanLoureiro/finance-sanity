"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyAmount } from "@/components/ui/currency-amount";

export function CashAccounts() {
  const { data, isLoading } = useQuery<{
    id: string;
    name: string;
    balance: number;
  }[]>({
    queryKey: queryKeys.cash.accounts(),
    queryFn: () => fetch("/api/cash").then((r) => r.json()),
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

  const total = data.reduce((sum, a) => sum + a.balance, 0);

  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex flex-col gap-2">
        <div className="text-sm font-semibold">Cash accounts</div>
        <div className="text-sm text-muted-foreground">{data.length} accounts</div>
        <div className="text-[22px] font-semibold tracking-tight tabular-nums leading-none">
          <CurrencyAmount value={total} />
        </div>
        <div className="text-sm text-muted-foreground">
          {data.map((a) => a.name).join(", ")}
        </div>
      </CardContent>
    </Card>
  );
}
