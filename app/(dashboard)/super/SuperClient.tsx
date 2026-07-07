"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, PlusCircle, X, Save, Check } from "lucide-react";
import { useState } from "react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import dynamic from "next/dynamic";

const SuperChart = dynamic(() => import("./SuperChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[268px] w-full" />,
});

type SuperAccount = { id: string; name: string; provider: string | null; balance: string | number };
type HistorySnapshot = { date: string; superTotal: number };

export default function SuperPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: accounts = [], isLoading } = useQuery<SuperAccount[]>({
    queryKey: queryKeys.super(),
    queryFn: () => fetch("/api/super").then((r) => r.json()),
  });

  const { data: history = [] } = useQuery<HistorySnapshot[]>({
    queryKey: queryKeys.history.list(),
    queryFn: () => fetch("/api/history").then((r) => r.json()),
    staleTime: 60 * 60 * 1000,
  });

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/super/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.super() }),
  });

  const { register: regAdd, handleSubmit: handleAdd, reset: resetAdd } = useForm({
    defaultValues: { name: "", provider: "", balance: 0 },
  });

  const add = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/super", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.super() }); resetAdd(); setAddOpen(false); },
  });

  const update = useMutation({
    mutationFn: ({ id, balance }: { id: string; balance: number }) =>
      fetch(`/api/super/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance }) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.super() }),
  });

  const saveMonth = useMutation({
    mutationFn: () => fetch("/api/history/record", { method: "POST" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.history.list() }),
  });

  const totalSuper = accounts.reduce((s, a) => s + Number(a.balance), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="space-y-3">
          {[...Array(2)].map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Superannuation</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveMonth.mutate()}
            disabled={saveMonth.isPending || accounts.length === 0}
          >
            {saveMonth.isSuccess ? (
              <><Check className="h-4 w-4 mr-1 text-green-600" /> Saved</>
            ) : (
              <><Save className="h-4 w-4 mr-1" /> Save Month</>
            )}
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} disabled={addOpen}>
            <PlusCircle className="h-4 w-4 mr-1" /> Add Account
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground">Total Superannuation</p>
          <p className="text-3xl font-bold"><CurrencyAmount value={totalSuper} /></p>
          <p className="text-xs text-muted-foreground mt-1">Updated manually — update balance after each statement</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold">{a.name}</p>
                    {a.provider && <p className="text-sm text-muted-foreground">{a.provider}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={Number(a.balance)}
                      className="w-36 text-right"
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== Number(a.balance)) update.mutate({ id: a.id, balance: val });
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(a.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {accounts.length === 0 && !addOpen && <Card><CardContent className="py-10 text-center text-muted-foreground">No super accounts. Add one above.</CardContent></Card>}
          {addOpen && (
            <Card className="border-dashed border-fs-accent-300 bg-fs-accent-50">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-fs-accent-700">New Super Account</p>
                  <Button size="sm" variant="ghost" onClick={() => { setAddOpen(false); resetAdd(); }}><X className="h-3 w-3" /></Button>
                </div>
                <form onSubmit={handleAdd((d) => add.mutate(d))} className="flex flex-wrap gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Account name</label>
                    <Input placeholder="e.g. Australian Super" className="w-52 h-8 text-sm" {...regAdd("name")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Provider (optional)</label>
                    <Input placeholder="AustralianSuper..." className="w-44 h-8 text-sm" {...regAdd("provider")} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Current balance ($)</label>
                    <Input type="number" placeholder="0" className="w-36 h-8 text-sm" {...regAdd("balance")} />
                  </div>
                  <Button type="submit" size="sm" disabled={add.isPending}>Add Account</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { del.mutate(deleteId); setDeleteId(null); } }}
        title="Delete super account?"
        isPending={del.isPending}
      />

      {/* Super history chart */}
      {history.length > 1 && <SuperChart history={history} />}
    </div>
  );
}
