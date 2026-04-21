"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Default to dark during SSR (matches defaultTheme="dark").
  // suppressHydrationWarning lets React keep the server-rendered icon
  // during hydration rather than patching the DOM, eliminating the
  // empty-space → icon repaint that the mounted guard previously caused.
  const isDark = resolvedTheme !== "light";

  return (
    <button
      suppressHydrationWarning
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
