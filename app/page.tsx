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
import LandingNav from "@/components/landing/LandingNav"
import BrandLogoMark from "@/components/landing/BrandLogoMark"
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
      "Stocks, ETFs, crypto, property, cash, superannuation, and managed funds - all in one place.",
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

export default async function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--fs-surface-0)]">
      <LandingNav />

      {/* Hero */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-20 text-center"
        style={{ background: "linear-gradient(160deg, var(--fs-surface-hero-from) 0%, var(--fs-surface-hero-to) 100%)" }}
      >
        {/* Glow blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-[-15%] h-[640px] w-[640px] -translate-x-1/2 rounded-full"
            style={{ background: "radial-gradient(ellipse at center, oklch(0.78 0.090 185 / 0.20) 0%, transparent 65%)" }}
          />
          <div
            className="absolute bottom-[-10%] right-0 h-[400px] w-[400px] rounded-full"
            style={{ background: "radial-gradient(ellipse at right center, oklch(0.35 0.085 185 / 0.30) 0%, transparent 65%)" }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <span className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
            <Flame className="size-3" />
            Built for Australian investors
          </span>

          {/* Headline */}
          <h1
            className="max-w-3xl font-semibold leading-[1.08] text-white"
            style={{ fontSize: "clamp(32px, 4vw, 50px)", letterSpacing: "-0.022em" }}
          >
            Your finances,{" "}
            <span className="text-white/55">finally clear.</span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 max-w-xl text-center text-[17px] leading-relaxed text-white/62">
            Track every asset, plan for FIRE, and understand your tax position.
            All in one place.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-[var(--fs-ink-1)] transition-all hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Get started
            </Link>
            <a
              href="#features"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-8 text-sm font-medium text-white/85 transition-all hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              See features
            </a>
          </div>
        </div>

        {/* Stat strip */}
        <div className="absolute bottom-10 flex gap-12 text-center">
          <div>
            <p className="text-[22px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>9+</p>
            <p className="mt-0.5 text-[11px] text-white/50">Asset classes</p>
          </div>
          <div>
            <p className="text-[22px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>AUS</p>
            <p className="mt-0.5 text-[11px] text-white/50">Tax compliant</p>
          </div>
          <div>
            <p className="text-[22px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>FIRE</p>
            <p className="mt-0.5 text-[11px] text-white/50">Planning built-in</p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="bg-[var(--fs-surface-0)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-fs-accent-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-fs-accent-strong">
              <LayoutDashboard className="size-3" />
              Features
            </span>
            <h2
              className="text-[22px] font-semibold text-[var(--fs-ink-1)]"
              style={{ letterSpacing: "-0.02em" }}
            >
              Everything in one place
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-[15px] leading-relaxed text-[var(--fs-ink-3)]">
              From daily cash balances to retirement projections, Financial Sanity covers every dimension of your wealth.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* FIRE Highlight */}
      <section className="bg-fs-surface-inv px-6 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--fs-accent-300)]">
              <Flame className="size-3" />
              FIRE Planning
            </span>
            <h2
              className="mb-6 text-[28px] font-semibold leading-tight text-[var(--fs-ink-on-inv)]"
              style={{ letterSpacing: "-0.02em" }}
            >
              Know exactly when you can retire
            </h2>
            <p className="mb-8 text-[15px] leading-relaxed text-[var(--fs-ink-on-inv)]/60">
              Enter your current portfolio, expected returns, and target spending. Financial Sanity projects your wealth year-by-year and shows you exactly when you reach financial independence.
            </p>
            <ul className="space-y-3 text-sm text-[var(--fs-ink-on-inv)]/70">
              {[
                "Year-by-year wealth projection chart",
                "Adjustable return rate and inflation assumptions",
                "Visual FIRE date indicator on the timeline",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckCircle className="size-4 shrink-0 text-[var(--fs-accent-300)]" />
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
      <section className="bg-fs-surface-3 px-6 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="order-2 flex h-64 items-center justify-center rounded-2xl border border-[var(--fs-line-2)] bg-[var(--fs-surface-1)] font-mono text-sm text-[var(--fs-ink-4)] lg:order-1">
            [ CGT report by financial year ]
          </div>
          <div className="order-1 lg:order-2">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-fs-accent-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-fs-accent-strong">
              <Calculator className="size-3" />
              Tax Tools
            </span>
            <h2
              className="mb-6 text-[28px] font-semibold text-[var(--fs-ink-1)]"
              style={{ letterSpacing: "-0.02em" }}
            >
              CGT done right for Australia
            </h2>
            <p className="mb-8 text-[15px] leading-relaxed text-[var(--fs-ink-3)]">
              Automatic FIFO cost base matching, the 12-month 50% CGT discount applied correctly, and reports organised by Australian financial year - so you always know where you stand come tax time.
            </p>
            <ul className="space-y-3 text-sm text-[var(--fs-ink-3)]">
              {[
                "FIFO cost base matching across all trades",
                "50% CGT discount for assets held over 12 months",
                "Reports broken down by Australian financial year",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckCircle className="size-4 shrink-0 text-fs-accent-hover" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="relative overflow-hidden px-6 py-24 text-center"
        style={{ background: "linear-gradient(135deg, oklch(0.50 0.095 185) 0%, oklch(0.40 0.085 185) 100%)" }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-[-30%] h-[400px] w-[600px] -translate-x-1/2 rounded-full"
            style={{ background: "radial-gradient(ellipse at center, oklch(0.78 0.090 185 / 0.15) 0%, transparent 65%)" }}
          />
        </div>
        <h2
          className="relative mb-4 text-[32px] font-semibold text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Ready to take control?
        </h2>
        <p className="relative mx-auto mb-10 max-w-md text-[15px] text-white/62">
          Join Financial Sanity and get the full picture of your wealth today.
        </p>
        <Link
          href="/login"
          className="relative inline-flex h-10 items-center justify-center rounded-lg bg-white px-10 text-sm font-semibold text-[oklch(0.40_0.085_185)] transition-all hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          Get started
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--fs-line-1)] bg-fs-surface-2 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <BrandLogoMark size="xs" />
            <span className="text-sm font-semibold text-[var(--fs-ink-2)]" style={{ letterSpacing: "-0.01em" }}>
              Financial Sanity
            </span>
          </div>
          <p className="text-xs text-[var(--fs-ink-4)]">
            Built for Australian investors. Not financial advice.
          </p>
          <Link
            href="/login"
            className="text-xs text-[var(--fs-ink-3)] transition-colors hover:text-[var(--fs-ink-1)]"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
