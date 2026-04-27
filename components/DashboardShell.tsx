"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardShell({ children, email }: { children: React.ReactNode; email: string | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    // On mobile: toggle drawer; on desktop: toggle collapsed
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((open) => !open);
    } else {
      setCollapsed((c) => !c);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--fs-surface-0)" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — drawer on mobile, sticky on desktop */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 md:z-auto",
          "transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <Sidebar
          collapsed={collapsed}
          onClose={() => setMobileOpen(false)}
          email={email}
        />
      </div>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-7 pb-14 max-w-[1480px] mx-auto w-full md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
