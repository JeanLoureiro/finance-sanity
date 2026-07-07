"use client";
import { Sparkline } from "@/components/ui/sparkline";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Delta } from "@/components/ui/delta";

interface NetWorthHeroProps {
  netWorth: number;
  monthDelta: number;
  monthDeltaPercent: number;
  historyNetWorth: number[];
}

export function NetWorthHero({ netWorth, monthDelta, monthDeltaPercent, historyNetWorth }: NetWorthHeroProps) {
  return (
    <div
      className="rounded-xl overflow-hidden p-5 flex flex-col justify-between min-h-[140px] h-full text-white"
      style={{ background: "linear-gradient(135deg, var(--fs-surface-hero-from), var(--fs-surface-hero-to))" }}
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
          Total Net Worth
        </span>
        <span
          className="text-[28px] font-semibold tracking-tight tabular-nums leading-none"
          style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif" }}
        >
          <CurrencyAmount value={netWorth} />
        </span>
        <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
          {monthDelta !== 0 && (
            <Delta value={monthDelta} percent={monthDeltaPercent} showIcon />
          )}
          {monthDelta !== 0 && <span>this month</span>}
        </div>
      </div>
      {historyNetWorth.length >= 2 && (
        <div className="mt-2">
          <Sparkline
            data={historyNetWorth}
            fullWidth
            width={280}
            height={32}
            color="rgba(255,255,255,0.6)"
            strokeWidth={1.25}
          />
        </div>
      )}
    </div>
  );
}
