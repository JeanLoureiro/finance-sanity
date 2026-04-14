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
import { Skeleton } from "@/components/ui/skeleton";
import SharingSection from "@/components/SharingSection";

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

  const { data, isLoading } = useQuery<SettingsInput & { error?: string }>({
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-28" />
        {[...Array(5)].map((_, index) => (
          <Card key={index}>
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <Skeleton className="h-10 w-36" />
      </div>
    );
  }

  return (
    <>
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
          <div className="col-span-2 flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="autoSnapshot"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300"
              {...register("autoSnapshot")}
            />
            <div>
              <label htmlFor="autoSnapshot" className="cursor-pointer text-sm font-medium">
                Auto-record snapshot on payday
              </label>
              <p className="text-xs text-muted-foreground">
                Automatically saves a net-worth snapshot each time you get paid. Weekly and fortnightly users need a Job Start Date set to calculate the cycle.
              </p>
            </div>
          </div>
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

    {console.log("Rendering sharing section check, role:", data?.role, "should show:", data?.role === "OWNER")}

    {data?.role === "OWNER" && (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Sharing</CardTitle>
        </CardHeader>
        <CardContent>
          <SharingSection />
        </CardContent>
      </Card>
    )}
    </>
  );
}
