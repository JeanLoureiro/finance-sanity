"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, Upload, FileDown, AlertCircle, CheckCircle2, ArrowUpDown } from "lucide-react";
import { type SideIncomeEntry, exportSideIncomeCSV } from "./exportSideIncome";
import { type SideIncomeImportRow, parseSideIncomeCSV, downloadSideIncomeTemplate } from "./importSideIncome";

type ImportExportModalProps = {
  fyEntries: SideIncomeEntry[];
  allEntries: SideIncomeEntry[];
  fyLabel: string;
  onImport: (rows: SideIncomeImportRow[]) => Promise<void>;
};

export function ImportExportModal({
  fyEntries,
  allEntries,
  fyLabel,
  onImport,
}: ImportExportModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"export" | "import">("export");
  const [parseResult, setParseResult] = useState<{ rows: SideIncomeImportRow[]; errors: { line: number; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const text = readerEvent.target?.result as string;
      setParseResult(parseSideIncomeCSV(text));
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

  const isFYFiltered = fyEntries.length !== allEntries.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button size="sm" variant="outline" className="gap-1.5">
          <ArrowUpDown className="h-4 w-4" />
          Import / Export
        </Button>
      } />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import / Export Side Income</DialogTitle>
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
            <p className="text-sm text-muted-foreground">Download your side income entries as a CSV file.</p>
            <div className="space-y-2">
              {isFYFiltered && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => exportSideIncomeCSV(fyEntries, fyLabel)}
                >
                  <Download className="h-4 w-4" />
                  Export {fyLabel} ({fyEntries.length} entries)
                </Button>
              )}
              <Button
                variant={isFYFiltered ? "ghost" : "outline"}
                className="w-full justify-start gap-2"
                onClick={() => exportSideIncomeCSV(allEntries, "all")}
              >
                <Download className="h-4 w-4" />
                Export all ({allEntries.length} entries)
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
                    Columns: Date, Side Income ($), Rental Income ($), Notes
                  </p>
                  <button
                    className="mt-2 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                    onClick={downloadSideIncomeTemplate}
                  >
                    Download template CSV
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t pt-3">
                <Upload className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="w-full">
                  <p className="text-sm font-medium">Step 2 — Upload your CSV</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Date formats accepted: YYYY-MM-DD or DD/MM/YYYY
                  </p>
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
              {importing ? "Importing…" : `Import ${parseResult?.rows.length ?? 0} entr${(parseResult?.rows.length ?? 0) !== 1 ? "ies" : "y"}`}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
