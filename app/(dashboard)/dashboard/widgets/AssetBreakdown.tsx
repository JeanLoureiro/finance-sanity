"use client";

import { Card } from "@/components/ui/card";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Sparkline } from "@/components/ui/sparkline";

interface AssetBreakdownProps {
  assetRows: { label: string; value: number; color: string; histKey: string }[];
  history: { date: string; netWorth: number; cashTotal: number; etfTotal: number; stockTotal: number; cryptoTotal: number; managedFundTotal: number; superTotal: number; propertyValue: number; liabilitiesTotal: number; savingsRate: number | null }[];
  totalAssets: number;
}

export function AssetBreakdown({ assetRows, history, totalAssets }: AssetBreakdownProps) {
  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <span className="text-[15px] font-semibold">Asset breakdown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">% of total</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">12m trend</th>
            </tr>
          </thead>
          <tbody>
            {assetRows.filter((row) => row.value !== 0).map((row) => {
              const sparkData = history.slice(-9).map(
                (item) => Math.abs(item[row.histKey as keyof typeof item] as number)
              );
              return (
                <tr key={row.label} className="border-b border-border last:border-0 hover:bg-fs-accent-subtle transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="size-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                      <span>{row.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">
                    <CurrencyAmount value={row.value} showSign={row.value < 0} />
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground tabular-nums">
                    {totalAssets > 0 ? `${((Math.abs(row.value) / totalAssets) * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right hidden sm:table-cell">
                    {sparkData.length >= 2 && (
                      <Sparkline
                        data={sparkData}
                        width={80}
                        height={20}
                        color={row.color}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
