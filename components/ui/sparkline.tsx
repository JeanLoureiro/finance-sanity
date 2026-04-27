interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Override the auto-computed stroke colour. Defaults to gain/loss based on trend. */
  color?: string;
  strokeWidth?: number;
  /** Show a filled dot at the last data point. */
  showEndDot?: boolean;
}

/**
 * Minimal inline sparkline — Apple Health style: thin line, no fill, optional end dot.
 * Colour auto-detects trend (gain green / loss red) unless overridden.
 */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color,
  strokeWidth = 1.5,
  showEndDot = false,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const innerHeight = height - 4; // 2px vertical padding each side

  const points = data.map((value, index) => ({
    x: index * stepX,
    y: height - ((value - min) / range) * innerHeight - 2,
  }));

  const pathD = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const lastPoint = points[points.length - 1];
  const trendUp = data[data.length - 1] >= data[0];
  const strokeColor = color ?? (trendUp ? "var(--fs-gain)" : "var(--fs-loss)");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }} aria-hidden="true">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showEndDot && (
        <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill={strokeColor} />
      )}
    </svg>
  );
}
