/**
 * Static demo FIRE projection chart for the landing page.
 * Pure SVG — no client JS needed.
 *
 * Data: hypothetical portfolio growing from $380k (2025) to $1.68M (2038)
 * at 8% p.a. + $30k annual contributions. FIRE target: $1.1M.
 */

// Chart geometry
const LEFT = 54;
const RIGHT = 532;
const TOP = 20;
const BOTTOM = 206;
const CHART_W = RIGHT - LEFT; // 478
const CHART_H = BOTTOM - TOP; // 186
const MAX_VALUE = 1750; // $1.75M ceiling
const FIRE_TARGET = 1100; // $1.1M

// Portfolio values in $k, 2025–2038 (14 points)
const VALUES = [380, 441, 506, 577, 653, 735, 824, 920, 1024, 1136, 1257, 1388, 1529, 1682];
const N = VALUES.length - 1; // 13 intervals

function xAt(index: number) {
  return LEFT + (index / N) * CHART_W;
}
function yAt(value: number) {
  return BOTTOM - (value / MAX_VALUE) * CHART_H;
}

const points = VALUES.map((value, index) => ({ x: xAt(index), y: yAt(value) }));

const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
const areaPath = `${linePath} L ${points[N].x.toFixed(1)} ${BOTTOM} L ${LEFT} ${BOTTOM} Z`;

const yFireLine = yAt(FIRE_TARGET);

// Interpolate x where the line crosses the FIRE target
const fireIdx = VALUES.findIndex((value, i) => i > 0 && VALUES[i - 1] < FIRE_TARGET && value >= FIRE_TARGET);
const t = (FIRE_TARGET - VALUES[fireIdx - 1]) / (VALUES[fireIdx] - VALUES[fireIdx - 1]);
const fireX = xAt(fireIdx - 1) + t * (xAt(fireIdx) - xAt(fireIdx - 1));

const Y_LABELS = [
  { value: 0, label: "$0" },
  { value: 500, label: "$500k" },
  { value: 1000, label: "$1M" },
  { value: 1500, label: "$1.5M" },
];

const X_LABELS = [
  { index: 0, year: "2025" },
  { index: 3, year: "2028" },
  { index: 6, year: "2031" },
  { index: 9, year: "2034" },
  { index: 12, year: "2037" },
];

export default function FireProjectionChart() {
  return (
    <svg
      viewBox="0 0 560 240"
      width="100%"
      height="100%"
      aria-label="FIRE projection chart showing portfolio growth from $380k in 2025 to $1.68M in 2038, crossing the $1.1M FIRE target in 2034"
      role="img"
    >
      <defs>
        <linearGradient id="fire-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.090 185)" stopOpacity="0.40" />
          <stop offset="100%" stopColor="oklch(0.78 0.090 185)" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {Y_LABELS.filter((label) => label.value > 0).map(({ value }) => (
        <line
          key={value}
          x1={LEFT}
          x2={RIGHT}
          y1={yAt(value)}
          y2={yAt(value)}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      <line x1={LEFT} x2={LEFT} y1={TOP} y2={BOTTOM} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1={LEFT} x2={RIGHT} y1={BOTTOM} y2={BOTTOM} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

      {/* FIRE target dashed line */}
      <line
        x1={LEFT}
        x2={RIGHT}
        y1={yFireLine}
        y2={yFireLine}
        stroke="oklch(0.82 0.120 75)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        opacity="0.75"
      />

      {/* FIRE crossing vertical dashed line */}
      <line
        x1={fireX}
        x2={fireX}
        y1={TOP}
        y2={BOTTOM}
        stroke="oklch(0.82 0.120 75)"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.45"
      />

      {/* Area fill */}
      <path d={areaPath} fill="url(#fire-area)" />

      {/* Portfolio line */}
      <path
        d={linePath}
        fill="none"
        stroke="oklch(0.78 0.090 185)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Y-axis labels */}
      {Y_LABELS.map(({ value, label }) => (
        <text
          key={value}
          x={LEFT - 6}
          y={yAt(value) + 4}
          textAnchor="end"
          fontSize="9"
          fill="rgba(255,255,255,0.50)"
          fontFamily="ui-sans-serif,system-ui,sans-serif"
        >
          {label}
        </text>
      ))}

      {/* X-axis labels */}
      {X_LABELS.map(({ index, year }) => (
        <text
          key={year}
          x={xAt(index)}
          y={BOTTOM + 14}
          textAnchor="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.50)"
          fontFamily="ui-sans-serif,system-ui,sans-serif"
        >
          {year}
        </text>
      ))}

      {/* FIRE target badge */}
      <rect
        x={RIGHT - 90}
        y={yFireLine - 18}
        width={86}
        height={14}
        rx="3"
        fill="oklch(0.22 0.010 60)"
        opacity="0.85"
      />
      <text
        x={RIGHT - 47}
        y={yFireLine - 8}
        textAnchor="middle"
        fontSize="8.5"
        fill="oklch(0.82 0.120 75)"
        fontFamily="ui-sans-serif,system-ui,sans-serif"
      >
        FIRE target · $1.1M
      </text>

      {/* FIRE crossing dot */}
      <circle cx={fireX.toFixed(1)} cy={yFireLine.toFixed(1)} r="4.5" fill="oklch(0.22 0.010 60)" />
      <circle cx={fireX.toFixed(1)} cy={yFireLine.toFixed(1)} r="3" fill="oklch(0.82 0.120 75)" />

      {/* End-of-projection dot */}
      <circle cx={points[N].x.toFixed(1)} cy={points[N].y.toFixed(1)} r="4" fill="oklch(0.78 0.090 185)" />

      {/* Legend */}
      <circle cx={LEFT + 2} cy={TOP - 4} r="3" fill="oklch(0.78 0.090 185)" />
      <text
        x={LEFT + 8}
        y={TOP}
        fontSize="8.5"
        fill="rgba(255,255,255,0.45)"
        fontFamily="ui-sans-serif,system-ui,sans-serif"
      >
        Portfolio value
      </text>
    </svg>
  );
}
