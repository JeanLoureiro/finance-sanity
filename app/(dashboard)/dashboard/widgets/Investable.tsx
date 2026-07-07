"use client";

import { Sparkline } from "@/components/ui/sparkline";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Card, CardContent } from "@/components/ui/card";

interface InvestableProps {
  totalInvestable: number;
  totalAssets: number;
  historyInvestable: number[];
}

export function Investable({ totalInvestable, totalAssets, historyInvestable }: InvestableProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="pt-5 pb-5 flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Investable assets</span>
        <span className="text-[22px] font-semibold tracking-tight tabular-nums leading-none">
          <CurrencyAmount value={totalInvestable} />
        </span>
        <span className="text-sm text-muted-foreground">
          {totalAssets > 0 ? `${((totalInvestable / totalAssets) * 100).toFixed(0)}% of total assets` : "—"}
        </span>
        {historyInvestable.length >= 2 && (
          <div className="mt-2">
            <Sparkline
              data={historyInvestable}
              width={200}
              height={28}
              color="var(--fs-cat-etf)"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
