"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { SettingsInput } from "@/lib/schemas";
import { queryKeys } from "@/lib/queryKeys";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: Partial<SettingsInput>) =>
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings() }),
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SettingsInput>();

  useEffect(() => {
    if (data && !data.error) reset(data);
  }, [data, reset]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Income */}
      <Card>
        <CardHeader><CardTitle className="text-base">Income</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Annual Salary ($)" error={errors.salary?.message}>
            <Input type="number" {...register("salary")} />
          </Field>
          <Field label="Tax Bracket (e.g. 0.35 = 35%)" error={errors.taxBracket?.message}>
            <Input type="number" {...register("taxBracket")} />
          </Field>
          <Field label="Salary Frequency" error={errors.salaryFrequency?.message}>
            <Select
              defaultValue={data?.salaryFrequency}
              onValueChange={(v) => setValue("salaryFrequency", v as SettingsInput["salaryFrequency"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Monthly", "Weekly", "2-weeks", "4-weeks", "Twice Monthly"].map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Net Monthly Income ($)" error={errors.netIncome?.message}>
            <Input type="number" {...register("netIncome")} />
          </Field>
          <Field label="Day of Month Paid" error={errors.dayOfMonthPaid?.message}>
            <Input type="number" min={1} max={31} {...register("dayOfMonthPaid")} />
          </Field>
        </CardContent>
      </Card>

      {/* Investments */}
      <Card>
        <CardHeader><CardTitle className="text-base">Investments</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Bank Interest Rate (e.g. 0.06)" error={errors.bankInterestRate?.message}>
            <Input type="number" {...register("bankInterestRate")} />
          </Field>
          <Field label="Brokerage Fee (e.g. 0.001)" error={errors.brokerage?.message}>
            <Input type="number" {...register("brokerage")} />
          </Field>
          <div className="col-span-2 pt-2">
            <p className="text-sm font-medium mb-3">Asset Allocation Targets (must sum to 100%)</p>
            {errors.etfAllocation && (
              <p className="text-xs text-red-500 mb-2">{errors.etfAllocation.message}</p>
            )}
            <div className="grid grid-cols-5 gap-2">
              {(["ETFs", "Stocks", "Crypto", "Cash", "Managed Funds"] as const).map((label, i) => {
                const key = (["etfAllocation", "stockAllocation", "cryptoAllocation", "cashAllocation", "mfAllocation"] as const)[i];
                return (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" min="0" max="1" {...register(key)} />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader><CardTitle className="text-base">Goals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Cash Savings Target ($)" error={errors.cashSavingsTarget?.message}>
            <Input type="number" {...register("cashSavingsTarget")} />
          </Field>
          <Field label="Emergency Fund Months" error={errors.emergencyFundMonths?.message}>
            <Input type="number" min={1} max={24} {...register("emergencyFundMonths")} />
          </Field>
          <Field label="EOY Cash Goal ($)">
            <Input type="number" {...register("eoyGoal")} />
          </Field>
        </CardContent>
      </Card>

      {/* CGT */}
      <Card>
        <CardHeader><CardTitle className="text-base">Capital Gains Tax</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="CGT Method">
            <Select
              defaultValue={data?.cgtMethod}
              onValueChange={(v) => setValue("cgtMethod", v as SettingsInput["cgtMethod"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FIFO">FIFO</SelectItem>
                <SelectItem value="UK_POOL">UK Shared Pool</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Short-Term Tax Rate (e.g. 0.32)">
            <Input type="number" {...register("shortTermTaxRate")} />
          </Field>
          <Field label="Long-Term Tax Rate (e.g. 0.16)">
            <Input type="number" {...register("longTermTaxRate")} />
          </Field>
        </CardContent>
      </Card>

      {/* FIRE */}
      <Card>
        <CardHeader><CardTitle className="text-base">FIRE Settings</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Year of Birth" error={errors.yearOfBirth?.message}>
            <Input type="number" {...register("yearOfBirth")} />
          </Field>
          <Field label="Super Preservation Age">
            <Input type="number" min={55} max={70} {...register("preservationAge")} />
          </Field>
          <Field label="Inflation Rate (e.g. 0.03)">
            <Input type="number" {...register("inflationRate")} />
          </Field>
          <Field label="Withdrawal Rate (e.g. 0.05)">
            <Input type="number" {...register("withdrawalRate")} />
          </Field>
          <Field label="Super Contribution % (e.g. 0.115)">
            <Input type="number" {...register("superContribPct")} />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
