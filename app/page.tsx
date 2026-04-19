"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  TrendingUp,
  Flame,
  Receipt,
  DollarSign,
  CreditCard,
  PieChart,
  History,
  Upload,
  CheckCircle,
  Calculator,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import LandingNav from "@/components/landing/LandingNav"
import FeatureCard from "@/components/landing/FeatureCard"

const features = [
  {
    icon: LayoutDashboard,
    title: "Net Worth Dashboard",
    description:
      "Aggregated view of all your assets and liabilities with interactive historical charts.",
  },
  {
    icon: TrendingUp,
    title: "Multi-Asset Tracking",
    description:
      "Stocks, ETFs, crypto, property, cash, superannuation, and managed funds — all in one place.",
  },
  {
    icon: Flame,
    title: "FIRE Planning",
    description:
      "Year-by-year financial independence projections with customisable return and inflation assumptions.",
  },
  {
    icon: Receipt,
    title: "Capital Gains Tax",
    description:
      "FIFO-based CGT calculations with the Australian 50% discount applied correctly, organised by financial year.",
  },
  {
    icon: DollarSign,
    title: "Dividends & Income",
    description: "Track all dividend and side income streams in one unified view.",
  },
  {
    icon: CreditCard,
    title: "Loans & Budget",
    description:
      "Manage liabilities, loan schedules, and monitor your monthly spending.",
  },
  {
    icon: PieChart,
    title: "Portfolio Allocation",
    description:
      "Set target allocations and visualise the gap between target and actual with pie charts.",
  },
  {
    icon: History,
    title: "Monthly Snapshots",
    description:
      "Record your net worth each month and track your wealth trajectory over time.",
  },
  {
    icon: Upload,
    title: "CSV Import",
    description:
      "Bulk-import purchase history and historical balances from any broker or bank.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-white"
        style={{ background: "oklch(0.08 0 0)" }}
      >
        {/* Glow blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-[-20%] h-[600px] w-[600px] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.5 0.15 270 / 0.25) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-0 left-[-10%] h-[400px] w-[400px] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.5 0.12 230 / 0.2) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Flame className="size-3" />
            Built for Australian investors
          </span>

          {/* Headline */}
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
            Your finances,{" "}
            <span className="bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent">
              finally clear.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 max-w-2xl text-center text-lg leading-relaxed text-white/60 md:text-xl">
            Track every asset, plan for FIRE, and understand your tax position
            — all in one place.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-white px-8 font-semibold text-black hover:bg-white/90"
              )}
            >
              Get started
            </Link>
            <a
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/20 px-8 text-white hover:bg-white/10"
              )}
            >
              See features
            </a>
          </div>
        </div>

        {/* Stat strip */}
        <div className="absolute bottom-12 flex gap-12 text-center">
          <div>
            <p className="text-2xl font-bold text-white">9+</p>
            <p className="text-xs text-white/50">Asset classes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">AUS</p>
            <p className="text-xs text-white/50">Tax compliant</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">FIRE</p>
            <p className="text-xs text-white/50">Planning built-in</p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="bg-background px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">
            Everything in one place
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-muted-foreground">
            From daily cash balances to retirement projections, Financial
            Sanity covers every dimension of your wealth.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* FIRE Highlight */}
      <section className="px-6 py-24" style={{ background: "oklch(0.1 0 0)" }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge
              variant="outline"
              className="mb-4 border-white/10 bg-white/5 text-white/60"
            >
              <Flame className="mr-1 size-3" />
              FIRE Planning
            </Badge>
            <h2 className="mb-6 text-3xl font-bold leading-tight text-white md:text-4xl">
              Know exactly when you can retire
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-white/60">
              Enter your current portfolio, expected returns, and target
              spending. Financial Sanity projects your wealth year-by-year and
              shows you exactly when you reach financial independence.
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              {[
                "Year-by-year wealth projection chart",
                "Adjustable return rate and inflation assumptions",
                "Visual FIRE date indicator on the timeline",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckCircle className="size-4 shrink-0 text-white/40" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-mono text-sm text-white/20">
            [ FIRE projection chart ]
          </div>
        </div>
      </section>

      {/* CGT Section */}
      <section className="bg-muted/30 px-6 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="order-2 flex h-64 items-center justify-center rounded-2xl border bg-card font-mono text-sm text-muted-foreground lg:order-1">
            [ CGT report by financial year ]
          </div>
          <div className="order-1 lg:order-2">
            <Badge variant="secondary" className="mb-4">
              <Calculator className="mr-1 size-3" />
              Tax Tools
            </Badge>
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              CGT done right for Australia
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
              Automatic FIFO cost base matching, the 12-month 50% CGT discount
              applied correctly, and reports organised by Australian financial
              year — so you always know where you stand come tax time.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "FIFO cost base matching across all trades",
                "50% CGT discount for assets held over 12 months",
                "Reports broken down by Australian financial year",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckCircle className="size-4 shrink-0 text-foreground/40" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="px-6 py-24 text-center"
        style={{ background: "oklch(0.08 0 0)" }}
      >
        <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
          Ready to take control?
        </h2>
        <p className="mx-auto mb-10 max-w-md text-white/60">
          Join Financial Sanity and get the full picture of your wealth today.
        </p>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-white px-10 font-semibold text-black hover:bg-white/90"
          )}
        >
          Get started
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-sm font-semibold">Financial Sanity</span>
          <p className="text-xs text-muted-foreground">
            Built for Australian investors. Not financial advice.
          </p>
          <Link
            href="/login"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
