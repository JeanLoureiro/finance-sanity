import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-xl border border-[var(--fs-line-1)] bg-[var(--fs-surface-1)] p-6 transition-all duration-200 hover:border-[var(--fs-accent-300)] hover:shadow-sm hover:-translate-y-0.5">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-fs-accent-subtle transition-colors group-hover:bg-fs-accent-muted">
        <Icon className="h-5 w-5 text-fs-accent-hover transition-colors group-hover:text-fs-accent-strong" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 font-semibold text-[var(--fs-ink-1)]" style={{ letterSpacing: "-0.01em" }}>{title}</h3>
      <p className="text-[13px] leading-relaxed text-[var(--fs-ink-3)]">{description}</p>
    </div>
  )
}
