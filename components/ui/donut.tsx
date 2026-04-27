"use client"

interface DonutData {
  value: number
  color: string
}

interface DonutProps {
  data: DonutData[]
  size?: number
  thickness?: number
  showCenter?: boolean
  centerLabel?: string
  centerValue?: string
}

export function Donut({
  data,
  size = 180,
  thickness = 18,
  showCenter = true,
  centerLabel,
  centerValue,
}: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = size / 2 - thickness / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * radius

  // Pre-compute segment offsets outside the render loop to avoid mutation inside JSX
  const segments = data.reduce<{ len: number; offset: number; color: string }[]>(
    (accumulator, d) => {
      const previousOffset = accumulator.length > 0
        ? accumulator[accumulator.length - 1].offset + accumulator[accumulator.length - 1].len + 2
        : 0
      accumulator.push({ len: (d.value / total) * circ, offset: previousOffset, color: d.color })
      return accumulator
    },
    []
  )

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--fs-surface-3)"
          strokeWidth={thickness}
        />
        {segments.map((segment, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={thickness}
            strokeDasharray={`${segment.len} ${circ - segment.len}`}
            strokeDashoffset={-segment.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      {showCenter && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {centerLabel && (
            <span
              style={{
                fontSize: 11,
                color: "var(--fs-ink-3)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {centerLabel}
            </span>
          )}
          {centerValue && (
            <span
              style={{ fontSize: 18, fontWeight: 600, color: "var(--fs-ink-1)" }}
              className="tabular"
            >
              {centerValue}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
