import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeltaProps {
  /** The absolute change value (used for sign and formatting when percent is omitted). */
  value: number;
  /** If provided, displays a percentage rather than an absolute amount. */
  percent?: number;
  /** Use compact number notation (1k, 1M, etc.). */
  compact?: boolean;
  /** Show up/down arrow icon. Defaults to true. */
  showIcon?: boolean;
  className?: string;
}

/**
 * Displays a gain/loss delta in the Sanctum style:
 * coloured arrow + formatted value. Zero values are muted.
 */
export function Delta({ value, percent, compact = false, showIcon = true, className }: DeltaProps) {
  const isPositive = value > 0;
  const isZero = value === 0;

  const formatted =
    percent != null
      ? `${isPositive ? "+" : ""}${percent.toFixed(2)}%`
      : formatDeltaAmount(value, compact);

  return (
    <span
      className={cn(
        "tabular-nums inline-flex items-center gap-0.5 font-medium",
        !isZero && isPositive && "text-gain",
        !isZero && !isPositive && "text-loss",
        isZero && "text-muted-foreground",
        className
      )}
    >
      {showIcon && !isZero && (
        isPositive
          ? <ArrowUpIcon className="size-3 shrink-0" />
          : <ArrowDownIcon className="size-3 shrink-0" />
      )}
      {formatted}
    </span>
  );
}

function formatDeltaAmount(value: number, compact: boolean): string {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";

  if (compact && absolute >= 1000) {
    if (absolute >= 1e9) return `${sign}$${(absolute / 1e9).toFixed(2)}B`;
    if (absolute >= 1e6) return `${sign}$${(absolute / 1e6).toFixed(2)}M`;
    return `${sign}$${(absolute / 1e3).toFixed(1)}k`;
  }

  return `${sign}$${absolute.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
