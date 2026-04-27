"use client"

interface SeriesData {
  data: number[]
  color?: string
  strokeWidth?: number
}

interface LineChartProps {
  series: SeriesData[]
  width?: number
  height?: number
  padding?: { t: number; r: number; b: number; l: number }
  formatY?: (v: number) => string
  xLabels?: string[]
  showGrid?: boolean
  showEndLabels?: boolean
}

export function LineChart({
  series,
  width = 600,
  height = 240,
  padding = { t: 16, r: 56, b: 28, l: 16 },
  formatY,
  xLabels = [],
  showGrid = true,
  showEndLabels = true,
}: LineChartProps) {
  if (!series || series.length === 0) return null

  const allValues = series.flatMap((s) => s.data)
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const pad = (max - min) * 0.08 || 1
  const yMin = min - pad
  const yMax = max + pad
  const yRange = yMax - yMin || 1

  const innerW = width - padding.l - padding.r
  const innerH = height - padding.t - padding.b
  const len = series[0].data.length
  const stepX = innerW / (len - 1)

  const yToPx = (v: number) => padding.t + innerH - ((v - yMin) / yRange) * innerH
  const xToPx = (i: number) => padding.l + i * stepX

  const ticks = 4
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => yMin + (yRange * i) / ticks)

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      {showGrid &&
        tickValues.map((v, i) => (
          <g key={i}>
            <line
              x1={padding.l}
              x2={width - padding.r}
              y1={yToPx(v)}
              y2={yToPx(v)}
              stroke="var(--fs-line-1)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          </g>
        ))}
      {xLabels.map((lbl, i) => {
        const idx = Math.round((i / (xLabels.length - 1)) * (len - 1))
        return (
          <text
            key={i}
            x={xToPx(idx)}
            y={height - padding.b + 16}
            fontSize="11"
            fill="var(--fs-ink-3)"
            textAnchor="middle"
            className="tabular"
          >
            {lbl}
          </text>
        )
      })}
      {series.map((s, si) => {
        const path = s.data.map((v, i) => `${i === 0 ? "M" : "L"} ${xToPx(i)} ${yToPx(v)}`).join(" ")
        const color = s.color || "var(--fs-ink-1)"
        const lastX = xToPx(len - 1)
        const lastY = yToPx(s.data[len - 1])
        return (
          <g key={si}>
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={s.strokeWidth || 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showEndLabels && (
              <>
                <circle cx={lastX} cy={lastY} r="3" fill={color} />
                <text
                  x={lastX + 6}
                  y={lastY + 4}
                  fontSize="11"
                  fontWeight="500"
                  fill={color}
                  className="tabular"
                >
                  {formatY ? formatY(s.data[len - 1]) : s.data[len - 1]}
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
