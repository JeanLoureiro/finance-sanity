"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
}

function formatValue(value: number): string {
  return value.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Editable currency field: shows a formatted "$1,234.56" value when not
 * focused, and a plain editable number while typing.
 */
export function CurrencyInput({ value, onValueChange, className }: CurrencyInputProps) {
  // Raw text the user is currently typing; null means "not focused", so the
  // formatted `value` prop is shown instead.
  const [editingText, setEditingText] = useState<string | null>(null);

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
      <Input
        type="text"
        inputMode="decimal"
        className="pl-6"
        value={editingText ?? formatValue(value)}
        onFocus={(event) => {
          setEditingText(String(value));
          event.target.select();
        }}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^0-9.]/g, "");
          setEditingText(raw);
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) onValueChange(parsed);
        }}
        onBlur={() => setEditingText(null)}
      />
    </div>
  );
}
