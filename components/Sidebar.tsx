"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Banknote,
  TrendingUp,
  BarChart3,
  Bitcoin,
  Building2,
  Wallet,
  Flame,
  History,
  PiggyBank,
  Receipt,
  Clock,
  Package,
  CreditCard,
  Settings,
  ChevronRight,
  Upload,
  X,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/net-worth", label: "Net Worth", icon: LayoutDashboard },
  { href: "/cash", label: "Cash", icon: Banknote },
  { href: "/etfs", label: "ETFs", icon: TrendingUp },
  { href: "/stocks", label: "Stocks", icon: BarChart3 },
  { href: "/managed-funds", label: "Managed Funds", icon: BarChart3 },
  { href: "/crypto", label: "Crypto", icon: Bitcoin },
  { href: "/dividends", label: "Dividends", icon: Receipt },
  { href: "/property", label: "Property", icon: Building2 },
  { href: "/loans", label: "Loans", icon: CreditCard },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/side-income", label: "Side Income", icon: Clock },
  { href: "/super", label: "Super", icon: PiggyBank },
  { href: "/capital-gains", label: "Capital Gains", icon: History },
  { href: "/fire", label: "FIRE 🔥", icon: Flame },
  { href: "/other-assets", label: "Other Assets", icon: Package },
  { href: "/import", label: "Import CSV", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onClose, email }: { onClose?: () => void; email: string | null }) {
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="w-56 flex-shrink-0 border-r bg-background flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="font-bold text-sm tracking-tight">
          Financial Sanity<br />
          <span className="text-muted-foreground font-normal">Finance</span>
        </h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onClose && (
            <button
              aria-label="Close navigation"
              className="md:hidden p-1 rounded-md hover:bg-muted transition-colors"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-md mx-1 transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {active && <ChevronRight className="h-3 w-3" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t">
        {email && (
          <p className="px-3 py-1 text-xs text-muted-foreground truncate">{email}</p>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md w-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
