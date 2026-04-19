"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
        "fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between px-6 transition-all duration-200",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <span
        className={cn(
          "text-sm font-semibold transition-colors duration-200",
          scrolled ? "text-foreground" : "text-white"
        )}
      >
        Financial Sanity
      </span>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ size: "sm" }),
          scrolled
            ? ""
            : "border-white/20 bg-white text-black hover:bg-white/90"
        )}
      >
        Get started
      </Link>
    </nav>
  )
}
