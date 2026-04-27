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
        "fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between px-6 md:px-8 transition-all duration-200",
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div 
          className={cn(
            "size-7 rounded-lg grid place-items-center text-xs font-semibold transition-all duration-200",
            scrolled 
              ? "bg-foreground text-background" 
              : "bg-white text-black"
          )}
        >
          FS
        </div>
        <span
          className={cn(
            "text-sm font-semibold tracking-tight transition-colors duration-200",
            scrolled ? "text-foreground" : "text-white"
          )}
        >
          Financial Sanity
        </span>
      </div>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ size: "sm" }),
          scrolled
            ? ""
            : "border-white/20 bg-white text-black hover:bg-white/90 font-semibold"
        )}
      >
        Get started
      </Link>
    </nav>
  )
}
