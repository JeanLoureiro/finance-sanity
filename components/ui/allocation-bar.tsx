import { cn } from "@/lib/utils";

export interface AllocationSegment {
  name: string;
  value: number;
  /** CSS colour value — use `var(--fs-cat-*)` tokens. */
  color: string;
}

interface AllocationBarProps {
  segments: AllocationSegment[];
  /** Bar height in pixels. Defaults to 8. */
  height?: number;
  className?: string;
}

/**
 * Horizontal proportional bar showing portfolio allocation by category.
 * Uses the Sanctum asset-category colour tokens.
 */
export function AllocationBar({ segments, height = 8, className }: AllocationBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  return (
    <div
      className={cn("flex rounded-full overflow-hidden bg-muted", className)}
      style={{ height, gap: 2 }}
      role="img"
      aria-label="Asset allocation"
    >
      {segments.map((segment, index) => (
        <div
          key={index}
          style={{
            width: `${(segment.value / total) * 100}%`,
            background: segment.color,
          }}
          title={`${segment.name}: ${((segment.value / total) * 100).toFixed(1)}%`}
        />
      ))}
    </div>
  );
}
