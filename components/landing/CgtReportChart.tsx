/**
 * Static demo CGT report chart for the landing page.
 * Pure SVG — no client JS needed.
 *
 * Shows grouped bars per Australian financial year:
 * - Lighter bar: gross capital gain
 * - Darker bar: net taxable gain (after 50% CGT discount)
 */

// Chart geometry
const LEFT = 56;
const RIGHT = 532;
const TOP = 18;
const BOTTOM = 206;
const CHART_W = RIGHT - LEFT; // 476
const CHART_H = BOTTOM - TOP; // 188
const MAX_VALUE = 165000; // $165k ceiling (FY25 gross)

const GROUP_W = CHART_W / 5; // 95.2 per financial year
const BAR_W = 26;
const BAR_GAP = 8;
const BARS_TOTAL = BAR_W * 2 + BAR_GAP; // 60
const BAR_PADDING = (GROUP_W - BARS_TOTAL) / 2; // ~17.6

function xGroup(groupIndex: number) {
  return LEFT + groupIndex * GROUP_W;
}
function yAt(value: number) {
  return BOTTOM - (value / MAX_VALUE) * CHART_H;
}
function hAt(value: number) {
  return (value / MAX_VALUE) * CHART_H;
}

// Gross gain and net taxable gain per financial year
const DATA = [
  { fy: "FY21", gross: 45000, net: 22500 },
  { fy: "FY22", gross: 120000, net: 60000 },
  { fy: "FY23", gross: 32000, net: 16000 },
  { fy: "FY24", gross: 78000, net: 39000 },
  { fy: "FY25", gross: 165000, net: 82500 },
];

const Y_LABELS = [
  { value: 0, label: "$0" },
  { value: 50000, label: "$50k" },
  { value: 100000, label: "$100k" },
  { value: 150000, label: "$150k" },
];

export default function CgtReportChart() {
  return (
    <svg
      viewBox="0 0 560 240"
      width="100%"
      height="100%"
      aria-label="CGT report chart showing capital gains by Australian financial year from FY21 to FY25"
      role="img"
    >
      {/* Horizontal grid lines */}
      {Y_LABELS.filter((label) => label.value > 0).map(({ value }) => (
        <line
          key={value}
          x1={LEFT}
          x2={RIGHT}
          y1={yAt(value)}
          y2={yAt(value)}
          stroke="oklch(0.88 0.010 75)"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      <line x1={LEFT} x2={LEFT} y1={TOP} y2={BOTTOM} stroke="oklch(0.82 0.012 75)" strokeWidth="1" />
      <line x1={LEFT} x2={RIGHT} y1={BOTTOM} y2={BOTTOM} stroke="oklch(0.82 0.012 75)" strokeWidth="1" />

      {/* Bars */}
      {DATA.map(({ fy, gross, net }, groupIndex) => {
        const groupX = xGroup(groupIndex);
        const bar1X = groupX + BAR_PADDING;
        const bar2X = bar1X + BAR_W + BAR_GAP;
        const labelX = groupX + GROUP_W / 2;

        return (
          <g key={fy}>
            {/* Gross gain bar (lighter teal) */}
            <rect
              x={bar1X.toFixed(1)}
              y={yAt(gross).toFixed(1)}
              width={BAR_W}
              height={hAt(gross).toFixed(1)}
              rx="3"
              fill="oklch(0.78 0.090 185)"
              opacity="0.65"
            />

            {/* Net taxable bar (darker teal) */}
            <rect
              x={bar2X.toFixed(1)}
              y={yAt(net).toFixed(1)}
              width={BAR_W}
              height={hAt(net).toFixed(1)}
              rx="3"
              fill="oklch(0.50 0.095 185)"
            />

            {/* Financial year label */}
            <text
              x={labelX.toFixed(1)}
              y={BOTTOM + 14}
              textAnchor="middle"
              fontSize="9"
              fill="oklch(0.55 0.012 65)"
              fontFamily="ui-sans-serif,system-ui,sans-serif"
            >
              {fy}
            </text>
          </g>
        );
      })}

      {/* Y-axis labels */}
      {Y_LABELS.map(({ value, label }) => (
        <text
          key={value}
          x={LEFT - 6}
          y={yAt(value) + 4}
          textAnchor="end"
          fontSize="9"
          fill="oklch(0.55 0.012 65)"
          fontFamily="ui-sans-serif,system-ui,sans-serif"
        >
          {label}
        </text>
      ))}

      {/* Legend */}
      <rect x={RIGHT - 148} y={TOP + 2} width="10" height="10" rx="2" fill="oklch(0.78 0.090 185)" opacity="0.65" />
      <text
        x={RIGHT - 135}
        y={TOP + 10}
        fontSize="8.5"
        fill="oklch(0.55 0.012 65)"
        fontFamily="ui-sans-serif,system-ui,sans-serif"
      >
        Gross gain
      </text>
      <rect x={RIGHT - 68} y={TOP + 2} width="10" height="10" rx="2" fill="oklch(0.50 0.095 185)" />
      <text
        x={RIGHT - 55}
        y={TOP + 10}
        fontSize="8.5"
        fill="oklch(0.55 0.012 65)"
        fontFamily="ui-sans-serif,system-ui,sans-serif"
      >
        After discount
      </text>
    </svg>
  );
}
