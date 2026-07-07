"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FIREResult } from "@/app/api/fire/route";

export function FIREProgress() {
  const { data, isLoading } = useQuery<FIREResult>({
    queryKey: queryKeys.fire(),
    queryFn: () => fetch("/api/fire").then((r) => r.json()),
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

  if (!data) return null;

  const { yearsToFIRE, currentAge, preSuperFIREYear, currentNW, preSuperFIRETarget } = data;
  const fireAge = preSuperFIREYear ? preSuperFIREYear - (new Date().getFullYear() - currentAge) : currentAge + yearsToFIRE;
  const progress = preSuperFIRETarget > 0 ? (currentNW / preSuperFIRETarget) * 100 : 0;

  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex flex-col gap-2">
        <div className="text-sm font-semibold">FIRE Progress</div>
        <div className="text-sm text-muted-foreground">
          On track for age <strong className="text-foreground">{fireAge}</strong>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden mt-1">
          <div
            className="h-full bg-fs-accent-600 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="text-sm text-muted-foreground tabular-nums">
          {progress.toFixed(0)}% to target
        </div>
      </CardContent>
    </Card>
  );
}
