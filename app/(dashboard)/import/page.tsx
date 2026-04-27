"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

const PURCHASE_EXAMPLE = `type,ticker,date,direction,units,price,brokerage
ETF,A200.AX,2023-01-15,BUY,100,105.50,9.50
ETF,A200.AX,2024-06-30,SELL,50,120.00,9.50
Stock,BHP.AX,2023-03-20,BUY,200,45.00,9.50
Crypto,BTC,2023-05-01,BUY,0.5,35000,0
MF,VDHG,2023-09-15,BUY,50,55.00,0`;

const HISTORY_EXAMPLE = `date,cashTotal,etfTotal,stockTotal,cryptoTotal,superTotal,propertyValue,mortgageBalance,netWorth
2023-08-31,50000,200000,0,0,180000,850000,450000,830000
2023-09-30,52000,210000,0,0,182000,855000,448500,850500
2023-10-31,55000,215000,0,0,185000,860000,447000,868000`;

type ImportResult = { imported: number; errors: string[]; total: number } | null;

function ImportPanel({
  title,
  description,
  exampleCSV,
  endpoint,
  invalidateKeys,
  fields,
}: {
  title: string;
  description: string;
  exampleCSV: string;
  endpoint: string;
  invalidateKeys?: string[];
  fields: { name: string; note: string }[];
}) {
  const qc = useQueryClient();
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult>(null);
  const [showExample, setShowExample] = useState(false);

  async function handleImport() {
    if (!csv.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      setResult(data);
      if (data.imported > 0 && invalidateKeys) {
        invalidateKeys.forEach((key) => {
          qc.invalidateQueries({ queryKey: [key] });
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsv(ev.target?.result as string);
    reader.readAsText(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Field reference */}
        <div className="flex flex-wrap gap-2">
          {fields.map((f) => (
            <div key={f.name} className="text-xs bg-muted rounded px-2 py-1">
              <span className="font-mono font-medium">{f.name}</span>
              {f.note && <span className="text-muted-foreground ml-1">— {f.note}</span>}
            </div>
          ))}
        </div>

        {/* Example toggle */}
        <button
          className="text-xs text-primary underline"
          onClick={() => setShowExample((v) => !v)}
        >
          {showExample ? "Hide example" : "Show example CSV"}
        </button>
        {showExample && (
          <pre className="text-xs bg-muted rounded p-3 overflow-x-auto whitespace-pre">
            {exampleCSV}
          </pre>
        )}

        {/* File upload */}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <input type="file" accept=".csv,.txt" className="sr-only" onChange={handleFile} />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors">
              <Upload className="h-3.5 w-3.5" /> Upload .csv
            </span>
          </label>
          <span className="text-xs text-muted-foreground">or paste below</span>
        </div>

        {/* Textarea */}
        <textarea
          className="w-full h-36 text-xs font-mono border rounded-md p-3 bg-background resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={`Paste CSV here…\n\n${fields.map((f) => f.name).join(",")}\n…`}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />

        {/* Import button */}
        <div className="flex items-center gap-3">
          <Button onClick={handleImport} disabled={loading || !csv.trim()} size="sm">
            {loading ? "Importing…" : "Import"}
          </Button>
          {csv && (
            <button className="text-xs text-muted-foreground underline" onClick={() => { setCsv(""); setResult(null); }}>
              Clear
            </button>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {result.imported > 0 && (
                <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                  <CheckCircle className="h-3 w-3" /> {result.imported} of {result.total} imported
                </Badge>
              )}
              {result.errors.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" /> {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import CSV</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bulk-import purchase histories and historical balance data. Safe to re-run — existing records are skipped (purchases) or overwritten (history).
        </p>
      </div>

      <ImportPanel
        title="Purchase History"
        description="Import ETF, Stock, Managed Fund, or Crypto purchases/sales. Creates the holding if it doesn't exist."
        exampleCSV={PURCHASE_EXAMPLE}
        endpoint="/api/import/purchases"
        invalidateKeys={["holdings", "capital-gains", "dashboard"]}
        fields={[
          { name: "type", note: "ETF | Stock | MF | Crypto" },
          { name: "ticker", note: "e.g. A200.AX" },
          { name: "date", note: "YYYY-MM-DD" },
          { name: "direction", note: "BUY | SELL" },
          { name: "units", note: "positive number" },
          { name: "price", note: "per unit" },
          { name: "brokerage", note: "optional, default 0" },
        ]}
      />

      <ImportPanel
        title="Historical Balance Backfill"
        description="Populate monthly snapshot history from your spreadsheet. Dates are snapped to end-of-month automatically."
        exampleCSV={HISTORY_EXAMPLE}
        endpoint="/api/history/backfill"
        invalidateKeys={["history", "dashboard"]}
        fields={[
          { name: "date", note: "YYYY-MM-DD" },
          { name: "cashTotal", note: "" },
          { name: "etfTotal", note: "" },
          { name: "stockTotal", note: "" },
          { name: "cryptoTotal", note: "" },
          { name: "superTotal", note: "" },
          { name: "propertyValue", note: "" },
          { name: "mortgageBalance", note: "" },
          { name: "netWorth", note: "or auto-computed" },
        ]}
      />
    </div>
  );
}
