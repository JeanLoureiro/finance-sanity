"use client";

import { Card } from "@/components/ui/card";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Badge } from "@/components/ui/badge";

interface PropertiesProps {
  properties: { id: string; name: string; currentValue: number; currentMortgageBalance: number; equity: number }[];
}

export function Properties({ properties }: PropertiesProps) {
  if (properties.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <span className="text-[15px] font-semibold">Properties</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Property</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Mortgage</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Equity</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => {
              const lvr = property.currentValue > 0
                ? (property.currentMortgageBalance / property.currentValue) * 100
                : 0;
              return (
                <tr key={property.id} className="border-b border-border last:border-0 hover:bg-fs-accent-subtle transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium">{property.name}</div>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <CurrencyAmount value={property.currentValue} />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-loss">
                    <CurrencyAmount value={property.currentMortgageBalance} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-medium tabular-nums">
                        <CurrencyAmount value={property.equity} />
                      </span>
                      {lvr > 0 && (
                        <Badge variant={lvr > 70 ? "warn" : "outline"} className="text-xs tabular-nums">
                          {lvr.toFixed(0)}% LVR
                        </Badge>
                      )}
                    </div>
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
