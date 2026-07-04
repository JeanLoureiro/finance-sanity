"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import BrandLogoMark from "@/components/landing/BrandLogoMark"

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between px-6 md:px-8 transition-all duration-200",
        scrolled
          ? "border-b border-[var(--fs-line-1)] bg-[var(--fs-surface-1)]/90 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="flex items-center gap-2.5">
        <BrandLogoMark size="sm" />
        <span
          className={cn(
            "text-sm font-semibold tracking-tight transition-colors duration-200",
            scrolled ? "text-fs-ink-1" : "text-white"
          )}
          style={{ letterSpacing: "-0.01em" }}
        >
          Financial Sanity
        </span>
      </div>
      <Link
        href="/login"
        className={cn(
          scrolled
            ? buttonVariants({ size: "sm" })
            : "inline-flex h-[34px] items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-[oklch(0.40_0.085_185)] transition-all hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        )}
      >
        Get started
      </Link>
    </nav>
  )
}
