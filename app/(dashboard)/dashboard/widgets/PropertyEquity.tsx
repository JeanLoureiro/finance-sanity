"use client";

import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Card, CardContent } from "@/components/ui/card";

interface PropertyEquityProps {
  propertyEquity: number;
  propertyCount: number;
}

export function PropertyEquity({ propertyEquity, propertyCount }: PropertyEquityProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="pt-5 pb-5 flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Property equity</span>
        <span className="text-[22px] font-semibold tracking-tight tabular-nums leading-none">
          <CurrencyAmount value={propertyEquity} />
        </span>
        <span className="text-sm text-muted-foreground">
          {propertyCount} {propertyCount === 1 ? "property" : "properties"}
        </span>
      </CardContent>
    </Card>
  );
}
