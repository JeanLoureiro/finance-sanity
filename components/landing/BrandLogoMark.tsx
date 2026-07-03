type Size = "xs" | "sm" | "md"

const sizeConfig: Record<Size, { container: string; rounded: string; icon: string }> = {
  xs: { container: "size-6", rounded: "rounded-md", icon: "size-3" },
  sm: { container: "size-[30px]", rounded: "rounded-lg", icon: "size-4" },
  md: { container: "size-9", rounded: "rounded-[10px]", icon: "size-[18px]" },
}

export default function BrandLogoMark({ size = "md" }: { size?: Size }) {
  const { container, rounded, icon } = sizeConfig[size]
  return (
    <div
      className={`grid ${container} shrink-0 place-items-center ${rounded} bg-gradient-to-br from-[var(--fs-accent-500)] to-[var(--fs-accent-700)]`}
    >
      <svg className={icon} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <polyline
          points="2.5,15.5 7,9.5 11,12.5 16,4.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <circle cx="16" cy="4.5" r="2.2" fill="white" />
      </svg>
    </div>
  )
}
