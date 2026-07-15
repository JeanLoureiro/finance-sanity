import { notFound } from "next/navigation";
import { Kpi } from "@/components/ui/kpi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DesignSystemPage() {
  const {
    data: { user },
  } = await getAuthUser();
  if (!user) notFound();

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: { isSuperAdmin: true },
  });
  if (!settings?.isSuperAdmin) notFound();

  return (
    <div className="p-6 max-w-4xl space-y-12">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">Design System</h1>
        <p className="text-sm text-muted-foreground mt-1">Financial Sanity - tokens, components, and patterns</p>
      </div>

      {/* ── COLOR PALETTE ── */}
      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Teal Palette (Primary)</h2>
        <div className="flex gap-2 flex-wrap">
          {[
            { name: "teal-50", style: { background: "var(--fs-accent-50)" } },
            { name: "teal-100", style: { background: "var(--fs-accent-100)" } },
            { name: "teal-300", style: { background: "var(--fs-accent-300)" } },
            { name: "teal-500", style: { background: "var(--fs-accent-500)" } },
            { name: "teal-600", style: { background: "var(--fs-accent-600)" } },
            { name: "teal-700", style: { background: "var(--fs-accent-700)" } },
          ].map(({ name, style }) => (
            <div key={name} className="w-20">
              <div className="h-12 rounded-lg border border-border/50 mb-1.5" style={style} />
              <div className="text-[11px] font-semibold text-foreground">{name}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Semantic Colors</h2>
        <div className="flex gap-2 flex-wrap">
          {[
            { name: "gain-soft", style: { background: "var(--fs-gain-soft)" } },
            { name: "gain", style: { background: "var(--fs-gain)" } },
            { name: "loss-soft", style: { background: "var(--fs-loss-soft)" } },
            { name: "loss", style: { background: "var(--fs-loss)" } },
            { name: "warn-soft", style: { background: "var(--fs-warn-soft)" } },
            { name: "warn", style: { background: "var(--fs-warn-strong)" } },
          ].map(({ name, style }) => (
            <div key={name} className="w-20">
              <div className="h-12 rounded-lg border border-border/50 mb-1.5" style={style} />
              <div className="text-[11px] font-semibold text-foreground">{name}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Asset Category Colors</h2>
        <div className="flex gap-2 flex-wrap">
          {[
            { name: "Cash", style: { background: "var(--fs-cat-cash)" } },
            { name: "Stocks", style: { background: "var(--fs-cat-stock)" } },
            { name: "ETFs", style: { background: "var(--fs-cat-etf)" } },
            { name: "Crypto", style: { background: "var(--fs-cat-crypto)" } },
            { name: "Property", style: { background: "var(--fs-cat-property)" } },
            { name: "Super", style: { background: "var(--fs-cat-super)" } },
            { name: "Managed", style: { background: "var(--fs-cat-mf)" } },
            { name: "Other", style: { background: "var(--fs-cat-other)" } },
          ].map(({ name, style }) => (
            <div key={name} className="w-20">
              <div className="h-12 rounded-lg border border-border/50 mb-1.5" style={style} />
              <div className="text-[11px] font-semibold text-foreground">{name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TYPOGRAPHY ── */}
      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Typography Scale (Inter, 14px base)</h2>
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {[
            { token: "text-xs / 11px", sample: "Caption, badge labels, hints", className: "text-xs text-muted-foreground" },
            { token: "text-sm / 12px", sample: "Column headers, form labels, secondary text", className: "text-sm font-medium text-muted-foreground" },
            { token: "text-base / 14px", sample: "Body text, table rows, card content", className: "text-base" },
            { token: "text-lg / 16px", sample: "Section headers, card titles", className: "text-lg font-semibold" },
            { token: "text-xl / 20px", sample: "Sub-page headings", className: "text-xl font-semibold" },
            { token: "text-2xl / 22px", sample: "Page titles", className: "text-2xl font-bold tracking-tight" },
            { token: "text-3xl / 28px", sample: "Hero KPI values", className: "text-3xl font-bold tracking-tight" },
          ].map(({ token, sample, className }) => (
            <div key={token} className="flex items-baseline gap-6 px-5 py-3">
              <span className="text-xs font-mono text-muted-foreground w-36 flex-shrink-0">{token}</span>
              <span className={className}>{sample}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BUTTONS ── */}
      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Buttons</h2>
        <div className="flex gap-3 flex-wrap items-center">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="sm" variant="outline">+ Add item</Button>
        </div>
      </section>

      {/* ── BADGES ── */}
      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Badges</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <Badge variant="gain">+12.4%</Badge>
          <Badge variant="loss">-5.3%</Badge>
          <Badge variant="warn">Pending</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="accent">Stocks</Badge>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* ── KPI TILES ── */}
      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">KPI Tiles</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2 rounded-xl overflow-hidden border border-transparent">
            <Kpi
              inverted
              label="Net Worth"
              value="$1,284,560"
              sub={<Badge variant="gain" className="text-white/90 bg-white/15 border-white/20">+$34,200 this month</Badge>}
            />
          </div>
          <Card>
            <Kpi label="Annual Return" value="+12.4%" sub="vs 9.2% last year" />
          </Card>
          <Card>
            <Kpi label="Total Cash" value="$128,400" sub="across 3 accounts" />
          </Card>
        </div>
      </section>

      {/* ── CARDS ── */}
      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Cards</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Standard card</CardTitle>
              <CardDescription>Subtle border, no shadow, rounded-xl</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Card body content with 14px text. Padding is 20px horizontal, 16px vertical.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Save</Button>
              <Button size="sm" variant="ghost" className="ml-2">Cancel</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Card with action</CardTitle>
              <CardDescription>Header slot for a button or badge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="gain">Active</Badge>
                <Badge variant="outline">12 items</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── TABLE ── */}
      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Table (Zebra + Teal header)</h2>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full fs-table">
            <thead>
              <tr>
                <th className="text-left px-4">Asset</th>
                <th className="text-right px-4">Value</th>
                <th className="text-right px-4">Change</th>
                <th className="text-right px-4">Return</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Commonwealth Bank", value: "$89,200", change: "+$1,200", pct: "+1.4%", gain: true },
                { name: "Vanguard ASX 300", value: "$74,500", change: "+$800", pct: "+1.1%", gain: true },
                { name: "BHP Group", value: "$52,100", change: "-$400", pct: "-0.8%", gain: false },
                { name: "Betashares Nasdaq 100", value: "$48,300", change: "+$600", pct: "+1.3%", gain: true },
              ].map((row) => (
                <tr key={row.name} className="border-t border-border">
                  <td className="px-4 py-3 text-sm font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">{row.value}</td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold tabular-nums ${row.gain ? "text-gain" : "text-loss"}`}>{row.change}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant={row.gain ? "gain" : "loss"}>{row.pct}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FORM ELEMENTS ── */}
      <section>
        <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Form Elements</h2>
        <div className="max-w-sm space-y-4">
          <div className="space-y-1.5">
            <Label>Text input</Label>
            <Input placeholder="Enter a value..." />
          </div>
          <div className="space-y-1.5">
            <Label>Select</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Focus shows teal ring</p>
          </div>
        </div>
      </section>
    </div>
  );
}
