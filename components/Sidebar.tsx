"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
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
  Palette,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  settingsKey?: string;
};

const NAV_GROUPS: { name: string; items: NavItem[] }[] = [
  {
    name: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    name: "Planning",
    items: [
      { href: "/budget",        label: "Budget",          icon: Wallet,  settingsKey: "useBudget" },
      { href: "/side-income",   label: "Side Income",     icon: Clock,   settingsKey: "useSideIncome" },
      { href: "/fire",          label: "FIRE Projection", icon: Flame,   settingsKey: "useFIRE" },
      { href: "/capital-gains", label: "Capital Gains",   icon: Receipt, settingsKey: "useCapitalGains" },
    ],
  },
  {
    name: "Investments",
    items: [
      { href: "/etfs",          label: "ETFs",          icon: TrendingUp,  settingsKey: "useETFs" },
      { href: "/stocks",        label: "Stocks",        icon: BarChart3,   settingsKey: "useStocks" },
      { href: "/crypto",        label: "Crypto",        icon: Bitcoin,     settingsKey: "useCrypto" },
      { href: "/managed-funds", label: "Managed Funds", icon: Globe,       settingsKey: "useManagedFunds" },
      { href: "/super",         label: "Super",         icon: Landmark,    settingsKey: "useSuper" },
      { href: "/dividends",     label: "Dividends",     icon: DollarSign,  settingsKey: "useDividends" },
    ],
  },
  {
    name: "Real assets & cash",
    items: [
      { href: "/property",     label: "Property",      icon: Home,    settingsKey: "useProperty" },
      { href: "/cash",         label: "Cash & Savings", icon: Banknote, settingsKey: "useCash" },
      { href: "/other-assets", label: "Other Assets",  icon: Package, settingsKey: "useOtherAssets" },
    ],
  },
  {
    name: "Liabilities",
    items: [
      { href: "/loans", label: "Loans & Debt", icon: CreditCard, settingsKey: "useLiabilities" },
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: settings } = useQuery<Record<string, boolean>>({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((response) => response.json()),
    staleTime: 5 * 60 * 1000,
  });

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
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.settingsKey || settings?.[item.settingsKey] !== false
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.name} className="mb-4">
              {!collapsed && (
                <div className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-fs-ink-4">
                  {group.name}
                </div>
              )}
              <div className="flex flex-col gap-px">
                {visibleItems.map(({ href, label, icon: Icon }) => {
                  const isActive = activeHref === href || activeHref.startsWith(href + "/");
                  return (
                    <div key={href} className="relative">
                      {isActive && !collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-fs-accent-500" />
                      )}
                      <Link
                        href={href}
                        onClick={(event) => { event.preventDefault(); navigate(href); }}
                        title={collapsed ? label : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg text-[13px] transition-all",
                          collapsed ? "px-2 py-2 justify-center" : "px-2.5 py-[7px]",
                          isActive
                            ? "bg-fs-accent-subtle text-fs-accent-strong font-semibold"
                            : "font-medium text-muted-foreground hover:text-foreground hover:bg-fs-accent-subtle/50"
                        )}
                      >
                        <Icon className={cn(
                          "flex-shrink-0",
                          collapsed ? "size-[18px]" : "size-4",
                          isActive ? "opacity-100" : "opacity-70"
                        )} />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>


      {/* Context switcher */}
      <div className={cn(
        "flex-shrink-0",
        collapsed ? "px-2 pb-1 flex justify-center" : "px-2 pb-1"
      )}>
        <ContextSwitcher collapsed={collapsed} />
      </div>

      {/* User footer */}
      <div className={cn(
        "border-t border-border flex-shrink-0 relative",
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
          <>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-full flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer"
            >
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
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {[
                  { href: "/glossary", label: "Glossary", Icon: BookOpen },
                  { href: "/design-system", label: "Design System", Icon: Palette },
                  { href: "/import", label: "Import CSV", Icon: Upload },
                  { href: "/settings", label: "Settings", Icon: Settings },
                ].map(({ href, label, Icon }) => {
                  const isActive = activeHref === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={(event) => {
                        event.preventDefault();
                        setIsMenuOpen(false);
                        navigate(href);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-[13px] transition-all border-b border-border last:border-b-0",
                        isActive
                          ? "bg-fs-accent-subtle text-fs-accent-strong font-semibold"
                          : "font-medium text-muted-foreground hover:text-foreground hover:bg-fs-accent-subtle/50"
                      )}
                    >
                      <Icon className={cn("size-4 flex-shrink-0", isActive ? "opacity-100" : "opacity-70")} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-fs-accent-subtle/50 transition-all border-t border-border"
                >
                  <LogOut className="size-4 flex-shrink-0 opacity-70" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
