"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { queryKeys } from "@/lib/queryKeys";
import { getFiscalYear, getFYLabel, currentFY } from "@/lib/australianFY";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import type { SideIncomeEntry } from "./exportSideIncome";
import { ImportExportModal } from "./ImportExportModal";
import type { SideIncomeImportRow } from "./importSideIncome";

export default function SideIncomePage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedFY, setSelectedFY] = useState(currentFY());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery<SideIncomeEntry[]>({
    queryKey: queryKeys.sideIncome.all(),
    queryFn: () => fetch("/api/side-income").then((r) => r.json()),
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/side-income/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sideIncome.all() }),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { date: "", sideIncome: 0, rentalIncome: 0, notes: "" },
  });

  const add = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/side-income", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.sideIncome.all() }); reset(); setAddOpen(false); },
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      fetch(`/api/side-income/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.sideIncome.all() }); setEditId(null); },
  });

  useEffect(() => {
    if (editId) {
      const entry = entries.find((e) => e.id === editId);
      if (entry) {
        reset({
          date: new Date(entry.date).toISOString().slice(0, 10),
          sideIncome: Number(entry.sideIncome),
          rentalIncome: Number(entry.rentalIncome),
          notes: entry.notes || "",
        });
      }
    }
  }, [editId, entries, reset]);

  const fyEntries = entries.filter((e) => getFiscalYear(new Date(e.date)) === selectedFY);
  const allFYs = [...new Set(entries.map((e) => getFiscalYear(new Date(e.date))))].sort((a, b) => b - a);
  if (!allFYs.includes(selectedFY)) allFYs.unshift(selectedFY);

  const fySideIncome = fyEntries.reduce((s, e) => s + Number(e.sideIncome), 0);
  const fyRentalIncome = fyEntries.reduce((s, e) => s + Number(e.rentalIncome), 0);
  const fyTotal = fySideIncome + fyRentalIncome;

  const last12 = entries.filter((e) => { const d = new Date(e.date); const c = new Date(); c.setMonth(c.getMonth() - 12); return d >= c; });
  const rolling12Avg = last12.length > 0 ? last12.reduce((s, e) => s + Number(e.sideIncome) + Number(e.rentalIncome), 0) / 12 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => <Skeleton key={index} className="h-20" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Side Income</h1>
        <div className="flex gap-2">
          <Select value={String(selectedFY)} onValueChange={(v) => setSelectedFY(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{allFYs.map((fy) => <SelectItem key={fy} value={String(fy)}>{getFYLabel(fy)}</SelectItem>)}</SelectContent>
          </Select>
          <ImportExportModal
            fyEntries={fyEntries}
            allEntries={entries}
            fyLabel={getFYLabel(selectedFY)}
            onImport={async (rows: SideIncomeImportRow[]) => {
              for (const row of rows) {
                await fetch("/api/side-income", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(row),
                });
              }
              qc.invalidateQueries({ queryKey: queryKeys.sideIncome.all() });
            }}
          />
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={<Button size="sm" />}><PlusCircle className="h-4 w-4 mr-1" /> Add Entry</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Side Income Entry</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((d) => add.mutate(d))} className="space-y-3">
                <div><label className="text-sm font-medium">Date</label><Input type="date" {...register("date")} /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-sm font-medium">Side income ($)</label><Input type="number" {...register("sideIncome")} /></div>
                  <div className="flex-1"><label className="text-sm font-medium">Rental income ($)</label><Input type="number" {...register("rentalIncome")} /></div>
                </div>
                <div><label className="text-sm font-medium">Notes (optional)</label><Input placeholder="e.g. Freelance project" {...register("notes")} /></div>
                <Button type="submit" className="w-full" disabled={add.isPending}>Add Entry</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{getFYLabel(selectedFY)} Total</p><p className="text-2xl font-bold"><CurrencyAmount value={fyTotal} /></p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Side income</p><p className="text-2xl font-bold"><CurrencyAmount value={fySideIncome} /></p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Rental income</p><p className="text-2xl font-bold"><CurrencyAmount value={fyRentalIncome} /></p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">12-month avg/month</p><p className="text-2xl font-bold"><CurrencyAmount value={rolling12Avg} /></p></CardContent></Card>
      </div>

      {(
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-right py-3 px-4">Side income</th>
                <th className="text-right py-3 px-4">Rental income</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-left py-3 px-4">Notes</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {fyEntries.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4">{new Date(e.date).toLocaleDateString("en-AU")}</td>
                  <td className="py-3 px-4 text-right"><CurrencyAmount value={Number(e.sideIncome)} /></td>
                  <td className="py-3 px-4 text-right"><CurrencyAmount value={Number(e.rentalIncome)} /></td>
                  <td className="py-3 px-4 text-right font-medium"><CurrencyAmount value={Number(e.sideIncome) + Number(e.rentalIncome)} /></td>
                  <td className="py-3 px-4 text-muted-foreground">{e.notes}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Dialog open={editId === e.id} onOpenChange={(open) => setEditId(open ? e.id : null)}>
                        <DialogTrigger render={<Button size="sm" variant="ghost" />}>
                          <Pencil className="h-3 w-3" />
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Edit Side Income Entry</DialogTitle></DialogHeader>
                          <form onSubmit={handleSubmit((d) => update.mutate({ id: e.id, ...d }))} className="space-y-3">
                            <div><label className="text-sm font-medium">Date</label><Input type="date" {...register("date")} /></div>
                            <div className="flex gap-2">
                              <div className="flex-1"><label className="text-sm font-medium">Side income ($)</label><Input type="number" {...register("sideIncome")} /></div>
                              <div className="flex-1"><label className="text-sm font-medium">Rental income ($)</label><Input type="number" {...register("rentalIncome")} /></div>
                            </div>
                            <div><label className="text-sm font-medium">Notes (optional)</label><Input placeholder="e.g. Freelance project" {...register("notes")} /></div>
                            <Button type="submit" className="w-full" disabled={update.isPending}>Save Changes</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {fyEntries.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No entries for {getFYLabel(selectedFY)}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { del.mutate(deleteId); setDeleteId(null); } }}
        title="Delete side income entry?"
        isPending={del.isPending}
      />
    </div>
  );
}
