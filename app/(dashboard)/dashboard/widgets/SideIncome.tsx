"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { getFiscalYear } from "@/lib/australianFY";

export function SideIncome() {
  const { data, isLoading } = useQuery<{
    id: string;
    date: string;
    sideIncome: number;
    rentalIncome: number;
  }[]>({
    queryKey: queryKeys.sideIncome.all(),
    queryFn: () => fetch("/api/side-income").then((r) => r.json()),
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

  const currentFY = getFiscalYear(new Date());
  const fyEntries = data.filter((d) => getFiscalYear(new Date(d.date)) === currentFY);
  const total = fyEntries.reduce((sum, d) => sum + d.sideIncome + d.rentalIncome, 0);

  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex flex-col gap-2">
        <div className="text-sm font-semibold">Side income</div>
        <div className="text-sm text-muted-foreground">FY{currentFY - 1}-{String(currentFY).slice(2)}</div>
        <div className="text-[22px] font-semibold tracking-tight tabular-nums leading-none">
          <CurrencyAmount value={total} />
        </div>
        <div className="text-sm text-muted-foreground">
          {fyEntries.length} entries
        </div>
      </CardContent>
    </Card>
  );
}
