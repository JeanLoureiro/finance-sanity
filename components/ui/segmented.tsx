"use client"

interface SegmentedOption {
  label: string
  value: string
}

interface SegmentedProps {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  size?: "sm" | "md"
}

export function Segmented({ options, value, onChange, size = "md" }: SegmentedProps) {
  return (
    <div
      className={`inline-flex p-0.5 bg-fs-surface-2 rounded-[10px] border border-fs-line-1 ${
        size === "sm" ? "text-xs" : "text-sm"
      }`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          className={`
            border-0 font-medium transition-all duration-[120ms] ease-out
            ${size === "sm" ? "px-2.5 py-0.5 rounded-[8px]" : "px-3 py-1 rounded-[8px]"}
            ${
              value === o.value
                ? "bg-fs-surface-1 text-fs-ink-1 shadow-sm"
                : "bg-transparent text-fs-ink-3 hover:text-fs-ink-1"
            }
          `}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
