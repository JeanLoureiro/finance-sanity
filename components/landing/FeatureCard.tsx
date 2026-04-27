import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-border/60 hover:shadow-md hover:-translate-y-0.5">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-fs-surface-2 transition-all group-hover:bg-fs-accent-subtle">
        <Icon className="h-5 w-5 text-fs-ink-3 transition-colors group-hover:text-fs-accent-strong" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 font-semibold text-foreground tracking-tight" style={{ letterSpacing: "-0.01em" }}>{title}</h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
