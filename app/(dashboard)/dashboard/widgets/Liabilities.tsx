"use client";

import { Sparkline } from "@/components/ui/sparkline";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Delta } from "@/components/ui/delta";
import { Card, CardContent } from "@/components/ui/card";

interface LiabilitiesProps {
  liabilitiesTotal: number;
  historyLiabilities: number[];
}

export function Liabilities({ liabilitiesTotal, historyLiabilities }: LiabilitiesProps) {
  const trendDelta = historyLiabilities.length >= 2
    ? -(historyLiabilities.at(-1)! - historyLiabilities.at(-2)!)
    : 0;
  const trendPercent = historyLiabilities.length >= 2 && historyLiabilities.at(-2)! > 0
    ? (-(historyLiabilities.at(-1)! - historyLiabilities.at(-2)!) / historyLiabilities.at(-2)!) * 100
    : 0;

  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="pt-5 pb-5 flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">Liabilities</span>
        <span className="text-[22px] font-semibold tracking-tight tabular-nums leading-none text-loss">
          <CurrencyAmount value={liabilitiesTotal} />
        </span>
        {historyLiabilities.length >= 2 && (
          <>
            <Delta
              value={trendDelta}
              percent={trendPercent}
              showIcon
            />
            <div className="mt-2">
              <Sparkline
                data={historyLiabilities}
                width={200}
                height={28}
                color="var(--fs-loss)"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
