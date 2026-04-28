"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, Upload, FileDown, AlertCircle, CheckCircle2, ArrowUpDown } from "lucide-react";
import { type BudgetItem, exportBudgetCSV } from "./exportBudget";
import { type BudgetImportRow, parseBudgetCSV, downloadBudgetTemplate } from "./importBudget";

type ImportExportModalProps = {
  displayItems: BudgetItem[];
  allItems: BudgetItem[];
  monthlyIncome: number;
  isFiltered: boolean;
  onImport: (rows: BudgetImportRow[]) => Promise<void>;
};

export function ImportExportModal({
  displayItems,
  allItems,
  monthlyIncome,
  isFiltered,
  onImport,
}: ImportExportModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"export" | "import">("export");
  const [parseResult, setParseResult] = useState<{ rows: BudgetImportRow[]; errors: { line: number; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const text = readerEvent.target?.result as string;
      setParseResult(parseBudgetCSV(text));
      setImportDone(false);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parseResult || parseResult.rows.length === 0) return;
    setImporting(true);
    try {
      await onImport(parseResult.rows);
      setImportDone(true);
      setParseResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImporting(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setParseResult(null);
      setImportDone(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <button className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Import / Export
        </button>
      } />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import / Export Budget</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as "export" | "import")}>
          <TabsList className="w-full">
            <TabsTrigger value="export" className="flex-1">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* Export tab */}
          <TabsContent value="export" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Download your budget items as a CSV file.</p>
            <div className="space-y-2">
              {isFiltered && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => exportBudgetCSV(displayItems, monthlyIncome, "budget-filtered.csv")}
                >
                  <Download className="h-4 w-4" />
                  Export filtered ({displayItems.length} items)
                </Button>
              )}
              <Button
                variant={isFiltered ? "ghost" : "outline"}
                className="w-full justify-start gap-2"
                onClick={() => exportBudgetCSV(allItems, monthlyIncome, "budget.csv")}
              >
                <Download className="h-4 w-4" />
                Export all ({allItems.length} items)
              </Button>
            </div>
          </TabsContent>

          {/* Import tab */}
          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="rounded-md border border-dashed p-4 bg-muted/20 space-y-3">
              <div className="flex items-start gap-3">
                <FileDown className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Step 1 — Download template</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Columns: Name, Type, Category, Frequency, Amount, Bank Account
                  </p>
                  <button
                    className="mt-2 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                    onClick={() => downloadBudgetTemplate(allItems)}
                  >
                    Download template CSV
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t pt-3">
                <Upload className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="w-full">
                  <p className="text-sm font-medium">Step 2 — Upload your CSV</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="mt-2 block w-full text-xs text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-border file:text-xs file:font-medium file:bg-background file:text-foreground hover:file:bg-muted cursor-pointer"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            {/* Parse result preview */}
            {parseResult && (
              <div className="space-y-2">
                {parseResult.rows.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{parseResult.rows.length} row{parseResult.rows.length !== 1 ? "s" : ""} ready to import</span>
                  </div>
                )}
                {parseResult.errors.length > 0 && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {parseResult.errors.length} issue{parseResult.errors.length !== 1 ? "s" : ""} found
                    </div>
                    <ul className="space-y-0.5 mt-1">
                      {parseResult.errors.map((error, index) => (
                        <li key={index} className="text-xs text-muted-foreground">
                          {error.line > 0 && <span className="font-mono text-xs">Line {error.line}: </span>}
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {importDone && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Import complete!
              </div>
            )}

            <Button
              className="w-full"
              disabled={!parseResult || parseResult.rows.length === 0 || importing}
              onClick={handleImport}
            >
              {importing ? "Importing…" : `Import ${parseResult?.rows.length ?? 0} item${(parseResult?.rows.length ?? 0) !== 1 ? "s" : ""}`}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
