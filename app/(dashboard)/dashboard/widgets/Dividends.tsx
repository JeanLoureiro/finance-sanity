"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Delta } from "@/components/ui/delta";
import { getFiscalYear } from "@/lib/australianFY";

export function Dividends() {
  const { data, isLoading } = useQuery<{
    id: string;
    paymentDate: string;
    ticker: string;
    holdingType: string;
    netAmount: number;
  }[]>({
    queryKey: queryKeys.dividends.all(),
    queryFn: () => fetch("/api/dividends").then((r) => r.json()),
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
  const fyDividends = data.filter((d) => getFiscalYear(new Date(d.paymentDate)) === currentFY);
  const total = fyDividends.reduce((sum, d) => sum + Number(d.netAmount), 0);

  const prevFY = currentFY - 1;
  const prevFYDividends = data.filter((d) => getFiscalYear(new Date(d.paymentDate)) === prevFY);
  const prevTotal = prevFYDividends.reduce((sum, d) => sum + Number(d.netAmount), 0);
  const delta = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex flex-col gap-2">
        <div className="text-sm font-semibold">Dividends</div>
        <div className="text-sm text-muted-foreground">FY{currentFY - 1}-{String(currentFY).slice(2)} received</div>
        <div className="text-[22px] font-semibold tracking-tight tabular-nums leading-none">
          <CurrencyAmount value={total} />
        </div>
        <div className="text-sm text-muted-foreground">
          {fyDividends.length} holdings · <Delta value={delta} percent={delta} showIcon />
        </div>
      </CardContent>
    </Card>
  );
}
