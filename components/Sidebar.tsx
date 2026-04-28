"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { ContextSwitcher } from "./ContextSwitcher";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Bitcoin,
  Globe,
  Landmark,
  Home,
  Banknote,
  Package,
  CreditCard,
  Wallet,
  Clock,
  Flame,
  Receipt,
  DollarSign,
  Upload,
  Settings,
  LogOut,
  X,
  BookOpen,
} from "lucide-react";

const NAV_GROUPS = [
  {
    name: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    name: "Investments",
    items: [
      { href: "/etfs",          label: "ETFs",          icon: TrendingUp },
      { href: "/stocks",        label: "Stocks",        icon: BarChart3 },
      { href: "/crypto",        label: "Crypto",        icon: Bitcoin },
      { href: "/managed-funds", label: "Managed Funds", icon: Globe },
      { href: "/super",         label: "Super",         icon: Landmark },
      { href: "/dividends",     label: "Dividends",     icon: DollarSign },
    ],
  },
  {
    name: "Real assets & cash",
    items: [
      { href: "/property",     label: "Property",      icon: Home },
      { href: "/cash",         label: "Cash & Savings", icon: Banknote },
      { href: "/other-assets", label: "Other Assets",  icon: Package },
    ],
  },
  {
    name: "Liabilities",
    items: [
      { href: "/loans", label: "Loans & Debt", icon: CreditCard },
    ],
  },
  {
    name: "Planning",
    items: [
      { href: "/budget",        label: "Budget",         icon: Wallet },
      { href: "/side-income",   label: "Side Income",    icon: Clock },
      { href: "/fire",          label: "FIRE Projection", icon: Flame },
      { href: "/capital-gains", label: "Capital Gains",  icon: Receipt },
    ],
  },
];

function getInitials(email: string | null): string {
  if (!email) return "U";
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
  email: string | null;
}

export function Sidebar({ collapsed, onClose, email }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // While a transition is in flight use the clicked href; once it settles
  // fall back to the real pathname so external navigations stay correct.
  const activeHref = isPending && pendingHref ? pendingHref : pathname;

  function navigate(href: string) {
    setPendingHref(href);
    onClose?.();
    startTransition(() => {
      router.push(href);
    });
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  const initials = getInitials(email);

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border bg-card transition-[width] duration-200 overflow-hidden",
        collapsed ? "w-16" : "w-[240px]"
      )}
    >
      {/* Brand */}
      <div className={cn(
        "flex items-center gap-3 border-b border-border flex-shrink-0",
        collapsed ? "px-4 py-4 justify-center" : "px-4"
      )}
      style={!collapsed ? { paddingTop: "calc(var(--spacing) * 2.8)", paddingBottom: "calc(var(--spacing) * 2.8)" } : undefined}
      >
        <div className="size-8 rounded-lg bg-foreground text-background grid place-items-center text-xs font-semibold tracking-wide flex-shrink-0">
          FS
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold tracking-tight leading-none">Financial Sanity</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Personal · AUD</div>
          </div>
        )}
        {/* Mobile close button */}
        {!collapsed && onClose && (
          <button
            aria-label="Close navigation"
            className="md:hidden p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-auto"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto py-3", collapsed ? "px-1.5" : "px-2")} aria-label="Main navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.name} className="mb-4">
            {!collapsed && (
              <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                {group.name}
              </div>
            )}
            <div className="flex flex-col gap-px">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = activeHref === href || activeHref.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={(event) => { event.preventDefault(); navigate(href); }}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all",
                      collapsed ? "px-2 py-2 justify-center" : "px-2.5 py-[7px]",
                      isActive
                        ? "bg-fs-surface-inv text-fs-ink-on-inv"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className={cn("flex-shrink-0", collapsed ? "size-[18px]" : "size-4 opacity-85")} />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer links */}
      {!collapsed && (
        <div className="border-t border-border px-2 py-2 flex flex-col gap-px">
          <Link
            href="/glossary"
            onClick={(event) => { event.preventDefault(); navigate("/glossary"); }}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all",
              activeHref === "/glossary"
                ? "bg-fs-surface-inv text-fs-ink-on-inv"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <BookOpen className="size-4 flex-shrink-0 opacity-85" />
            <span>Glossary</span>
          </Link>
          <Link
            href="/import"
            onClick={(event) => { event.preventDefault(); navigate("/import"); }}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all",
              activeHref === "/import"
                ? "bg-fs-surface-inv text-fs-ink-on-inv"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Upload className="size-4 flex-shrink-0 opacity-85" />
            <span>Import CSV</span>
          </Link>
          <Link
            href="/settings"
            onClick={(event) => { event.preventDefault(); navigate("/settings"); }}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all",
              activeHref === "/settings"
                ? "bg-fs-surface-inv text-fs-ink-on-inv"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Settings className="size-4 flex-shrink-0 opacity-85" />
            <span>Settings</span>
          </Link>
        </div>
      )}

      {/* Context switcher */}
      <div className={cn(
        "flex-shrink-0",
        collapsed ? "px-2 pb-1 flex justify-center" : "px-2 pb-1"
      )}>
        <ContextSwitcher collapsed={collapsed} />
      </div>

      {/* User footer */}
      <div className={cn(
        "border-t border-border flex-shrink-0",
        collapsed ? "px-2 py-3 flex justify-center" : "px-3 py-3"
      )}>
        {collapsed ? (
          <div
            className="size-8 rounded-full grid place-items-center text-xs font-semibold flex-shrink-0"
            style={{ background: "var(--fs-accent-100)", color: "var(--fs-accent-700)" }}
            title={email ?? undefined}
          >
            {initials}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div
              className="size-8 rounded-full grid place-items-center text-xs font-semibold flex-shrink-0"
              style={{ background: "var(--fs-accent-100)", color: "var(--fs-accent-700)" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium truncate leading-none">{email?.split("@")[0] ?? "Account"}</div>
              {email && <div className="text-[11px] text-muted-foreground truncate mt-0.5">{email}</div>}
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
