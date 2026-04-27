import { cn } from "@/lib/utils";
import { formatAUD } from "@/lib/currency";

interface CurrencyAmountProps {
  value: number | string | null | undefined;
  className?: string;
  showSign?: boolean;
  compact?: boolean;
}

export function CurrencyAmount({ value, className, showSign, compact }: CurrencyAmountProps) {
  const n = Number(value ?? 0);
  const formatted = compact
    ? new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(n)
    : formatAUD(n);

  return (
    <span className={cn(showSign && n > 0 && "text-gain", showSign && n < 0 && "text-loss", className)}>
      {showSign && n > 0 ? `+${formatted}` : formatted}
    </span>
  );
}

export function PercentChange({ value, className }: { value: number | null | undefined; className?: string }) {
  const n = Number(value ?? 0);
  const pct = (n * 100).toFixed(2);
  return (
    <span className={cn("text-sm font-medium tabular-nums", n >= 0 ? "text-gain" : "text-loss", className)}>
      {n >= 0 ? "+" : ""}{pct}%
    </span>
  );
}
