"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { queryKeys } from "@/lib/queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, PlusCircle } from "lucide-react";
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
        <h1 className="text-2xl font-bold">Superannuation</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-1" /> Add Account
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader><DialogTitle>Add Super Account</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd((d) => add.mutate(d))} className="space-y-3">
              <Input placeholder="Account name (e.g. Australian Super)" {...regAdd("name")} />
              <Input placeholder="Provider (optional)" {...regAdd("provider")} />
              <div><label className="text-sm font-medium">Current balance ($)</label><Input type="number" {...regAdd("balance")} /></div>
              <Button type="submit" className="w-full" disabled={add.isPending}>Add Account</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Total Superannuation</p>
          <p className="text-3xl font-bold"><CurrencyAmount value={totalSuper} /></p>
          <p className="text-xs text-muted-foreground mt-1">Updated manually — update balance after each statement</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-4">
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
          {accounts.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No super accounts. Add one above.</CardContent></Card>}
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
