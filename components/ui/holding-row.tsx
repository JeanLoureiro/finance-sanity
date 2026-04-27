import { cn } from "@/lib/utils"
import { Sparkline } from "./sparkline"
import { Delta } from "./delta"
import { CurrencyAmount } from "./currency-amount"

interface HoldingRowProps {
  ticker: string
  name?: string | null
  units?: number | null
  value: number
  gain?: number | null
  gainPercent?: number | null
  sparklineData?: number[]
  categoryColor?: string
  className?: string
  actions?: React.ReactNode
}

export function HoldingRow({
  ticker,
  name,
  units,
  value,
  gain,
  gainPercent,
  sparklineData,
  categoryColor = "var(--fs-cat-etf)",
  className,
  actions,
}: HoldingRowProps) {
  return (
    <div className={cn("flex items-center gap-3 py-3 px-4 hover:bg-secondary/40 transition-colors", className)}>
      {/* Left category color bar */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0 min-h-[32px]"
        style={{ background: categoryColor }}
      />

      {/* Ticker + name + units */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-semibold bg-muted px-1.5 py-0.5 rounded text-foreground tracking-wide">
            {ticker}
          </span>
          {name && (
            <span className="text-sm text-muted-foreground truncate">{name}</span>
          )}
        </div>
        {units != null && (
          <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {units.toFixed(4)} units
          </div>
        )}
      </div>

      {/* Sparkline — hidden on small screens */}
      {sparklineData && sparklineData.length >= 2 && (
        <div className="hidden sm:block flex-shrink-0">
          <Sparkline data={sparklineData} width={56} height={22} color={categoryColor} />
        </div>
      )}

      {/* Value + delta */}
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-semibold tabular-nums">
          <CurrencyAmount value={value} />
        </div>
        {gain != null && (
          <div className="mt-0.5">
            <Delta value={gain} percent={gainPercent ?? undefined} compact />
          </div>
        )}
      </div>

      {/* Actions slot */}
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  )
}
