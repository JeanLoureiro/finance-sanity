import { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** Renders on the teal gradient hero surface. */
  inverted?: boolean;
  className?: string;
}

const heroStyle: CSSProperties = {
  background: "linear-gradient(135deg, var(--fs-surface-hero-from), var(--fs-surface-hero-to))",
};

/**
 * Stat tile used on dashboard overview rows.
 * Matches the Sanctum KPI / hero-card design.
 */
export function Kpi({ label, value, sub, inverted = false, className }: KpiProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 px-5 py-[18px]",
        inverted && "rounded-xl text-white",
        className
      )}
      style={inverted ? heroStyle : undefined}
    >
      <span
        className={cn(
          "text-sm leading-none",
          inverted ? "text-white/60" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[26px] font-semibold tracking-tight tabular-nums leading-none",
          inverted ? "text-white" : "text-foreground"
        )}
      >
        {value}
      </span>
      {sub && (
        <span
          className={cn(
            "text-sm flex items-center gap-2",
            inverted ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
