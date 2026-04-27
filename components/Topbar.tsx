"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const BREADCRUMBS: Record<string, { section: string; page: string }> = {
  "/net-worth":     { section: "Overview",         page: "Net Worth" },
  "/etfs":          { section: "Investments",      page: "ETFs" },
  "/stocks":        { section: "Investments",      page: "Stocks" },
  "/crypto":        { section: "Investments",      page: "Crypto" },
  "/managed-funds": { section: "Investments",      page: "Managed Funds" },
  "/super":         { section: "Investments",      page: "Superannuation" },
  "/dividends":     { section: "Investments",      page: "Dividends" },
  "/property":      { section: "Real assets",      page: "Property" },
  "/cash":          { section: "Real assets",      page: "Cash & Savings" },
  "/other-assets":  { section: "Real assets",      page: "Other Assets" },
  "/loans":         { section: "Liabilities",      page: "Loans & Debt" },
  "/budget":        { section: "Planning",         page: "Budget" },
  "/side-income":   { section: "Planning",         page: "Side Income" },
  "/fire":          { section: "Planning",         page: "FIRE Projection" },
  "/capital-gains": { section: "Planning",         page: "Capital Gains" },
  "/import":        { section: "Tools",            page: "Import CSV" },
  "/settings":      { section: "Account",          page: "Settings" },
};

interface TopbarProps {
  onToggleSidebar: () => void;
  className?: string;
}

export function Topbar({ onToggleSidebar, className }: TopbarProps) {
  const pathname = usePathname();
  const crumb = BREADCRUMBS[pathname] ?? { section: "Financial Sanity", page: "" };

  return (
    <header
      className={cn(
        "h-14 flex items-center justify-between px-6 gap-4",
        "border-b border-border bg-background/85 backdrop-blur-md",
        "sticky top-0 z-10",
        className
      )}
    >
      {/* Left: toggle + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
        >
          <Menu className="size-4" />
        </button>
        <nav className="flex items-center gap-1.5 text-sm min-w-0">
          <span className="text-muted-foreground truncate">{crumb.section}</span>
          {crumb.page && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-medium text-foreground truncate">{crumb.page}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right: search + theme + bell */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Search hint — visual only */}
        <div className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg bg-secondary border-0 text-sm text-muted-foreground w-52">
          <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <span className="flex-1 text-xs">Search…</span>
          <kbd className="text-[10px] font-mono border border-border bg-card rounded px-1 py-0.5 leading-none">⌘K</kbd>
        </div>

        <ThemeToggle />

        <button
          aria-label="Notifications"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Bell className="size-4" />
        </button>
      </div>
    </header>
  );
}
