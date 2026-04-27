"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import type { SettingsInput } from "@/lib/schemas";
import { queryKeys } from "@/lib/queryKeys";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import SharingSection from "@/components/SharingSection";

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="pb-2 border-b border-border mb-4">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

function Field({
  label,
  error,
  children,
  description,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [testEmailStatus, setTestEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [testEmailMessage, setTestEmailMessage] = useState("");

  const { data, isLoading } = useQuery<SettingsInput & { error?: string; role?: string }>({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((response) => response.json()),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: Partial<SettingsInput>) =>
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }).then((response) => response.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings() }),
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<SettingsInput>();

  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (data && !data.error) reset(data);
  }, [data, reset]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-24" />
        {[...Array(4)].map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  const EMAIL_SECTIONS = [
    { key: "snapshotEmailCash",         label: "Cash" },
    { key: "snapshotEmailETFs",         label: "ETFs" },
    { key: "snapshotEmailStocks",       label: "Stocks" },
    { key: "snapshotEmailManagedFunds", label: "Managed Funds" },
    { key: "snapshotEmailCrypto",       label: "Crypto" },
    { key: "snapshotEmailOtherAssets",  label: "Other Assets" },
    { key: "snapshotEmailSuper",        label: "Superannuation" },
    { key: "snapshotEmailProperty",     label: "Property" },
    { key: "snapshotEmailLoans",        label: "Loans" },
    { key: "snapshotEmailBudget",       label: "Budget" },
    { key: "snapshotEmailSideIncome",   label: "Side Income" },
    { key: "snapshotEmailDividends",    label: "Dividends" },
  ] as const;

  return (
    <div className="pb-24">
      <form onSubmit={handleSubmit((values) => mutate(values))} className="space-y-10 max-w-2xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Configure</p>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        </div>

        {/* Income */}
        <section>
          <SectionHeader title="Income" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Annual Salary ($)" error={errors.salary?.message}>
              <Input type="number" {...register("salary")} />
            </Field>
            <Field label="Tax Bracket" description="e.g. 0.35 = 35%" error={errors.taxBracket?.message}>
              <Input type="number" {...register("taxBracket")} />
            </Field>
            <Field label="Salary Frequency" error={errors.salaryFrequency?.message}>
              <Select
                defaultValue={data?.salaryFrequency}
                onValueChange={(value) => setValue("salaryFrequency", value as SettingsInput["salaryFrequency"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Monthly", "Weekly", "2-weeks", "4-weeks", "Twice Monthly"].map((frequency) => (
                    <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>
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
          </div>
        </section>

        {/* Automations */}
        <section>
          <SectionHeader title="Automations" />
          <div className="divide-y divide-border">
            <SwitchRow
              label="Auto-record snapshot on payday"
              description="Saves a net-worth snapshot each time you get paid. Weekly and fortnightly users need a Job Start Date set to calculate the cycle."
              checked={!!watchedValues.autoSnapshot}
              onCheckedChange={(checked) => setValue("autoSnapshot", checked)}
            />
          </div>
        </section>

        {/* Investments */}
        <section>
          <SectionHeader title="Investments" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bank Interest Rate" description="e.g. 0.06 = 6%" error={errors.bankInterestRate?.message}>
              <Input type="number" {...register("bankInterestRate")} />
            </Field>
            <Field label="Brokerage Fee" description="e.g. 0.001 = 0.1%" error={errors.brokerage?.message}>
              <Input type="number" {...register("brokerage")} />
            </Field>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium mb-1">Asset Allocation Targets</p>
            <p className="text-xs text-muted-foreground mb-3">Must sum to 100% (values between 0 and 1)</p>
            {errors.etfAllocation && (
              <p className="text-xs text-loss mb-2">{errors.etfAllocation.message}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(["ETFs", "Stocks", "Crypto", "Cash", "Managed Funds"] as const).map((label, index) => {
                const key = (["etfAllocation", "stockAllocation", "cryptoAllocation", "cashAllocation", "mfAllocation"] as const)[index];
                return (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" min="0" max="1" step="0.01" {...register(key)} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Goals */}
        <section>
          <SectionHeader title="Goals" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Cash Savings Target ($)" error={errors.cashSavingsTarget?.message}>
              <Input type="number" {...register("cashSavingsTarget")} />
            </Field>
            <Field label="Emergency Fund Months" error={errors.emergencyFundMonths?.message}>
              <Input type="number" min={1} max={24} {...register("emergencyFundMonths")} />
            </Field>
            <Field label="End of Year Cash Goal ($)">
              <Input type="number" {...register("eoyGoal")} />
            </Field>
          </div>
        </section>

        {/* Capital Gains Tax */}
        <section>
          <SectionHeader title="Capital Gains Tax" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CGT Method">
              <Select
                defaultValue={data?.cgtMethod}
                onValueChange={(value) => setValue("cgtMethod", value as SettingsInput["cgtMethod"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIFO">FIFO</SelectItem>
                  <SelectItem value="UK_POOL">UK Shared Pool</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Short-Term Tax Rate" description="e.g. 0.32 = 32%">
              <Input type="number" {...register("shortTermTaxRate")} />
            </Field>
            <Field label="Long-Term Tax Rate" description="e.g. 0.16 = 16%">
              <Input type="number" {...register("longTermTaxRate")} />
            </Field>
          </div>
        </section>

        {/* FIRE Settings */}
        <section>
          <SectionHeader title="FIRE Settings" description="Used to generate your Financial Independence projections" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Year of Birth" error={errors.yearOfBirth?.message}>
              <Input type="number" {...register("yearOfBirth")} />
            </Field>
            <Field label="Super Preservation Age">
              <Input type="number" min={55} max={70} {...register("preservationAge")} />
            </Field>
            <Field label="Inflation Rate" description="e.g. 0.03 = 3%">
              <Input type="number" {...register("inflationRate")} />
            </Field>
            <Field label="Withdrawal Rate (SWR)" description="e.g. 0.05 = 5%">
              <Input type="number" {...register("withdrawalRate")} />
            </Field>
            <Field label="Super Contribution %" description="e.g. 0.115 = 11.5%">
              <Input type="number" {...register("superContribPct")} />
            </Field>
          </div>
        </section>

        {/* Snapshot Email */}
        <section>
          <SectionHeader
            title="Snapshot Email"
            description="Choose which sections appear in the automatic snapshot email. Sections with no data are omitted regardless."
          />
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testEmailStatus === "sending"}
              onClick={async () => {
                setTestEmailStatus("sending");
                setTestEmailMessage("");
                const response = await fetch("/api/history/send-test-email", { method: "POST" });
                const json = await response.json();
                if (response.ok) {
                  setTestEmailStatus("sent");
                  setTestEmailMessage(`Sent to ${json.sentTo}`);
                } else {
                  setTestEmailStatus("error");
                  setTestEmailMessage(json.error ?? "Failed to send");
                }
              }}
            >
              {testEmailStatus === "sending" ? "Sending…" : "Send test email"}
            </Button>
            {testEmailMessage && (
              <p className={`text-xs ${testEmailStatus === "error" ? "text-loss" : "text-gain"}`}>
                {testEmailMessage}
              </p>
            )}
          </div>
          <div className="divide-y divide-border">
            {EMAIL_SECTIONS.map(({ key, label }) => (
              <SwitchRow
                key={key}
                label={label}
                checked={!!watchedValues[key]}
                onCheckedChange={(checked) => setValue(key, checked)}
              />
            ))}
          </div>
        </section>
      </form>

      {data?.role === "OWNER" && (
        <Card className="mt-10 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <SharingSection />
          </CardContent>
        </Card>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-end gap-3 border-t border-border bg-background/90 px-6 py-3 backdrop-blur-md md:left-16">
        <Button
          type="submit"
          disabled={isPending}
          onClick={handleSubmit((values) => mutate(values))}
        >
          {isPending ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
