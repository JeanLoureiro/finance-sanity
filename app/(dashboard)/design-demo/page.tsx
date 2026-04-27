"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LineChart } from "@/components/ui/line-chart"
import { Donut } from "@/components/ui/donut"
import { Segmented } from "@/components/ui/segmented"
import { Sparkline } from "@/components/ui/sparkline"
import { Delta } from "@/components/ui/delta"
import { Download, Plus, Flame } from "lucide-react"

export default function DesignDemoPage() {
  const [range, setRange] = useState("1y")
  const [view, setView] = useState("t")

  const allocations = [
    { name: "ETFs", value: 220, target: 45, color: "var(--fs-cat-etf)" },
    { name: "Property", value: 683, target: 0, color: "var(--fs-cat-property)" },
    { name: "Super", value: 195, target: 0, color: "var(--fs-cat-super)" },
    { name: "Stocks", value: 90, target: 15, color: "var(--fs-cat-stock)" },
    { name: "Cash", value: 80, target: 20, color: "var(--fs-cat-cash)" },
    { name: "Crypto", value: 64, target: 10, color: "var(--fs-cat-crypto)" },
    { name: "Managed", value: 70, target: 10, color: "var(--fs-cat-mf)" },
  ]
  const total = allocations.reduce((s, a) => s + a.value, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Design System
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ letterSpacing: "-0.01em" }}>
            Sanctum Components
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            size="sm"
            options={[
              { label: "1M", value: "1m" },
              { label: "3M", value: "3m" },
              { label: "6M", value: "6m" },
              { label: "1Y", value: "1y" },
              { label: "All", value: "all" },
            ]}
            value={range}
            onChange={setRange}
          />
          <Button variant="outline" size="sm">
            <Download className="size-3.5" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="size-3.5" />
            Record snapshot
          </Button>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 items-stretch">
        {/* Hero card — inverted */}
        <div
          className="rounded-xl p-5 flex flex-col justify-between min-h-[140px]"
          style={{ background: "var(--fs-surface-inv)", color: "var(--fs-ink-on-inv)" }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-sm" style={{ color: "oklch(from var(--fs-ink-on-inv) l c h / 0.6)" }}>
              Net Worth · April 2026
            </span>
            <span className="text-[32px] font-semibold tracking-tight tabular-nums leading-none">
              $1,247,892
            </span>
            <div className="flex items-center gap-2 text-sm" style={{ color: "oklch(from var(--fs-ink-on-inv) l c h / 0.7)" }}>
              <Delta value={18430} percent={1.49} showIcon />
              <span>this month · +12.4% YTD</span>
            </div>
          </div>
          <div className="mt-3">
            <Sparkline
              data={[980, 995, 1010, 1040, 1060, 1080, 1100, 1130, 1180, 1210, 1240, 1248]}
              width={280}
              height={32}
              color="var(--fs-ink-on-inv)"
              strokeWidth={1.25}
            />
          </div>
        </div>

        {/* Regular KPI cards */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Investable</span>
            <span className="text-[28px] font-semibold tracking-tight tabular-nums">$524,318</span>
            <span className="text-xs text-muted-foreground">42% of assets</span>
          </div>
          <div className="mt-3">
            <Sparkline
              data={[420, 440, 455, 470, 485, 492, 500, 510, 524]}
              width={180}
              height={24}
              color="var(--fs-cat-etf)"
            />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Property equity</span>
            <span className="text-[28px] font-semibold tracking-tight tabular-nums">$683k</span>
            <span className="text-xs text-muted-foreground">2 properties</span>
          </div>
          <div className="mt-3">
            <Sparkline
              data={[610, 625, 640, 650, 660, 670, 675, 680, 683]}
              width={180}
              height={24}
              color="var(--fs-cat-property)"
            />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Liabilities</span>
            <span className="text-[28px] font-semibold tracking-tight tabular-nums text-[var(--fs-loss)]">
              $154k
            </span>
            <span className="text-sm">
              <Delta value={-1840} percent={-1.18} showIcon />
            </span>
          </div>
          <div className="mt-3">
            <Sparkline
              data={[160, 159, 158, 157, 156, 156, 155, 155, 154]}
              width={180}
              height={24}
              color="var(--fs-loss)"
            />
          </div>
        </Card>
      </div>

      {/* Chart + Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Line Chart */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Net worth · last 12 months</div>
              <div className="text-[22px] font-semibold tabular-nums mt-0.5">$1,247,892</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="default" className="bg-[var(--fs-gain-soft)] text-[var(--fs-gain-strong)] border-0">
                +$267k YoY
              </Badge>
            </div>
          </div>
          <LineChart
            series={[
              {
                data: [980, 992, 1010, 1015, 1040, 1062, 1078, 1095, 1130, 1180, 1210, 1248],
                color: "var(--fs-ink-1)",
                strokeWidth: 1.5,
              },
              {
                data: [820, 840, 855, 860, 880, 900, 920, 935, 970, 1000, 1030, 1075],
                color: "var(--fs-ink-3)",
                strokeWidth: 1,
              },
            ]}
            xLabels={["May", "Jul", "Sep", "Nov", "Jan", "Mar"]}
            formatY={(v) => `$${v}k`}
            height={240}
          />
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-0.5 bg-[var(--fs-ink-1)]" />
              Net worth
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-px bg-[var(--fs-ink-3)]" />
              Net worth ex-property
            </div>
          </div>
        </Card>

        {/* Donut Chart */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
            <div className="text-sm font-semibold">Allocation</div>
            <Segmented
              size="sm"
              options={[
                { label: "Total", value: "t" },
                { label: "Investable", value: "i" },
              ]}
              value={view}
              onChange={setView}
            />
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-5 items-center">
            <Donut
              size={140}
              thickness={14}
              centerLabel="Assets"
              centerValue="$1.40M"
              data={allocations.map((a) => ({ value: a.value, color: a.color }))}
            />
            <div className="flex flex-col gap-1.5">
              {allocations.slice(0, 7).map((a) => (
                <div key={a.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: a.color }}
                    />
                    <span className="text-muted-foreground">{a.name}</span>
                  </div>
                  <span className="tabular-nums text-muted-foreground">
                    {((a.value / total) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Badges showcase */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">Badge Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge className="bg-[var(--fs-gain-soft)] text-[var(--fs-gain-strong)] border-0">
            Gain
          </Badge>
          <Badge className="bg-[var(--fs-loss-soft)] text-[var(--fs-loss-strong)] border-0">
            Loss
          </Badge>
          <Badge className="bg-[var(--fs-accent-50)] text-[var(--fs-accent-700)] border border-[var(--fs-accent-100)]">
            <Flame className="size-3 mr-1" />
            Accent
          </Badge>
        </div>
      </Card>

      {/* Typography showcase */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">Typography</h3>
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Display Heading
            </h1>
            <p className="text-muted-foreground mt-2">
              Sanctum uses refined typography with tight letter-spacing for a premium feel.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[32px] font-semibold tabular-nums">$1,247,892</span>
            <Delta value={18430} percent={1.49} showIcon />
          </div>
        </div>
      </Card>
    </div>
  )
}
