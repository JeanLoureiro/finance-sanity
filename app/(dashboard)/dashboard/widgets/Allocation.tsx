"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AllocationBar, type AllocationSegment } from "@/components/ui/allocation-bar";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/ui/currency-amount";

interface AllocationProps {
  allocationSegments: AllocationSegment[];
  totalAssets: number;
}

export function Allocation({ allocationSegments, totalAssets }: AllocationProps) {
  if (allocationSegments.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Allocation</span>
          <Badge variant="outline" className="text-xs tabular-nums">
            <CurrencyAmount value={totalAssets} compact />
          </Badge>
        </div>
        <AllocationBar segments={allocationSegments} height={10} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {allocationSegments.map((segment) => (
            <div key={segment.name} className="flex items-center gap-1.5 text-xs">
              <span className="size-2 rounded-full flex-shrink-0" style={{ background: segment.color }} />
              <span className="text-muted-foreground">{segment.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {totalAssets > 0 ? `${((segment.value / totalAssets) * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
