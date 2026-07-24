"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch, Controller } from "react-hook-form";
import type { SettingsInput } from "@/lib/schemas";
import { queryKeys } from "@/lib/queryKeys";
import { useEffect, useRef, useState } from "react";
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
import SuperAdminSection from "@/components/SuperAdminSection";
import BillingSection from "@/components/BillingSection";

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

type MfaFactorsResponse = { enrolled: boolean; factorId: string | null };
type MfaEnrollData = { factorId: string; qrCode: string; secret: string };

function SecuritySection() {
  const queryClient = useQueryClient();
  const [enrollData, setEnrollData] = useState<MfaEnrollData | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const { data: mfaData, isLoading } = useQuery<MfaFactorsResponse>({
    queryKey: queryKeys.mfa.factors(),
    queryFn: () => fetch("/api/auth/mfa/factors").then((response) => response.json()),
  });

  async function handleStartEnroll() {
    setEnrollError(null);
    const response = await fetch("/api/auth/mfa/enroll", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setEnrollError(data.error ?? "Failed to start setup");
      return;
    }
    setEnrollData(data);
    setConfirmCode("");
  }

  async function handleChangeAuthenticator() {
    if (!mfaData?.factorId) return;
    setEnrollError(null);
    setIsChanging(true);
    // Unenroll existing factor first, then immediately enroll a new one.
    const unenrollResponse = await fetch("/api/auth/mfa/unenroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factorId: mfaData.factorId }),
    });
    if (!unenrollResponse.ok) {
      const data = await unenrollResponse.json().catch(() => ({}));
      setEnrollError(data.error ?? "Failed to remove existing factor");
      setIsChanging(false);
      return;
    }
    await handleStartEnroll();
    setIsChanging(false);
  }

  async function handleConfirmEnroll() {
    if (!enrollData) return;
    setConfirmError(null);
    const response = await fetch("/api/auth/mfa/enroll/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factorId: enrollData.factorId, code: confirmCode }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setConfirmError(data.error ?? "Invalid code");
      return;
    }
    setEnrollData(null);
    setConfirmCode("");
    queryClient.invalidateQueries({ queryKey: queryKeys.mfa.factors() });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (enrollData) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scan this QR code with your authenticator app, then enter the 6-digit
          code to confirm.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={enrollData.qrCode}
          alt="MFA QR code"
          className="w-36 h-36 rounded-lg border border-border"
        />
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Can&apos;t scan? Enter manually
          </summary>
          <code className="block mt-2 break-all p-2 rounded bg-muted text-muted-foreground select-all">
            {enrollData.secret}
          </code>
        </details>
        <div className="space-y-1">
          <Label htmlFor="confirm-mfa-code">6-digit code</Label>
          <Input
            id="confirm-mfa-code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            value={confirmCode}
            onChange={(event) => setConfirmCode(event.target.value)}
          />
          {confirmError && <p className="text-xs text-destructive">{confirmError}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleConfirmEnroll} size="sm">
            Confirm
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEnrollData(null); setEnrollError(null); }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Authenticator app</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mfaData?.enrolled ? "Active — required at every sign in" : "Not configured"}
          </p>
        </div>
        {mfaData?.enrolled ? (
          <span className="text-xs font-medium text-gain">Active</span>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">Inactive</span>
        )}
      </div>
      {enrollError && <p className="text-xs text-destructive">{enrollError}</p>}
      {mfaData?.enrolled ? (
        <Button
          variant="outline"
          size="sm"
          disabled={isChanging}
          onClick={handleChangeAuthenticator}
        >
          {isChanging ? "Working…" : "Change authenticator app"}
        </Button>
      ) : (
        <Button size="sm" onClick={handleStartEnroll}>
          Set up authenticator
        </Button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [testEmailStatus, setTestEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [testEmailMessage, setTestEmailMessage] = useState("");

  const { data, isLoading } = useQuery<
    SettingsInput & { error?: string; role?: string; id?: string; isSuperAdmin?: boolean }
  >({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((response) => response.json()),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: Partial<SettingsInput>) => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Failed to save settings");
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings() }),
  });

  // Separate auto-save for nav toggles: persists each toggle immediately without
  // invalidating the full query (which would reset other unsaved form fields).
  const { mutate: autoSaveNav } = useMutation({
    mutationFn: async (values: Partial<SettingsInput>) => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Failed to save settings");
      return json;
    },
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings() }),
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
  // Prevent reset(data) from firing when data changes come from a local setQueryData
  // call (nav toggle immediate hide). Only reset from server-fetched data.
  const skipNextReset = useRef(false);

  useEffect(() => {
    if (data && !data.error) {
      if (skipNextReset.current) {
        skipNextReset.current = false;
        return;
      }
      reset(data);
    }
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

  const NAV_SECTIONS = [
    { key: "useETFs",         label: "ETFs" },
    { key: "useStocks",       label: "Stocks" },
    { key: "useCrypto",       label: "Crypto" },
    { key: "useManagedFunds", label: "Managed Funds" },
    { key: "useSuper",        label: "Super" },
    { key: "useDividends",    label: "Dividends" },
    { key: "useProperty",     label: "Property" },
    { key: "useCash",         label: "Cash & Savings" },
    { key: "useOtherAssets",  label: "Other Assets" },
    { key: "useLiabilities",  label: "Loans & Debt" },
    { key: "useBudget",       label: "Budget" },
    { key: "useSideIncome",   label: "Side Income" },
    { key: "useFIRE",         label: "FIRE Projection" },
    { key: "useCapitalGains", label: "Capital Gains" },
  ] as const;

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

  const ANCHOR_SECTIONS = [
    { id: "income",          label: "Income" },
    { id: "automations",     label: "Automations" },
    { id: "investments",     label: "Investments" },
    { id: "goals",           label: "Goals" },
    { id: "capital-gains",   label: "Capital Gains" },
    { id: "fire-settings",   label: "FIRE" },
    { id: "navigation",      label: "Navigation" },
    { id: "snapshot-email",  label: "Email" },
    { id: "security",        label: "Security" },
    ...(data?.role === "OWNER" ? [{ id: "sharing", label: "Sharing" }] : []),
    ...(data?.role === "OWNER" ? [{ id: "billing", label: "Billing" }] : []),
    ...(data?.isSuperAdmin ? [{ id: "super-admin", label: "Super Admin" }] : []),
  ];

  return (
    <div>
      <form onSubmit={handleSubmit((values) => mutate(values))} className="space-y-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Configure</p>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 sticky top-0 z-10 bg-background/90 backdrop-blur-md py-3 -mx-6 px-6 border-b border-border">
          {ANCHOR_SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Income */}
        <section className="scroll-mt-14" id="income">
          <SectionHeader title="Income" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Annual Salary ($)" description="Before tax" error={errors.salary?.message}>
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
            <div className="sm:col-span-2">
              <Field label="Day of Month Paid" error={errors.dayOfMonthPaid?.message}>
                <Input type="number" min={1} max={31} {...register("dayOfMonthPaid")} />
              </Field>
            </div>
          </div>
        </section>

        {/* Automations */}
        <section className="scroll-mt-14" id="automations">
          <SectionHeader title="Automations" />
          <div className="divide-y divide-border">
            <SwitchRow
              label="Auto-record snapshot on payday"
              description="Saves a dashboard snapshot each time you get paid. Weekly and fortnightly users need a Job Start Date set to calculate the cycle."
              checked={!!watchedValues.autoSnapshot}
              onCheckedChange={(checked) => setValue("autoSnapshot", checked)}
            />
          </div>
        </section>

        {/* Investments */}
        <section className="scroll-mt-14" id="investments">
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
        <section className="scroll-mt-14" id="goals">
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
        <section className="scroll-mt-14" id="capital-gains">
          <SectionHeader title="Capital Gains Tax" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CGT Method" description="First In First Out">
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
        <section className="scroll-mt-14" id="fire-settings">
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

        {/* Navigation */}
        <section className="scroll-mt-14" id="navigation">
          <SectionHeader
            title="Navigation"
            description="Show or hide pages in the sidebar. Turn off sections you don't use to keep the menu clean."
          />
          <div className="divide-y divide-border">
            {NAV_SECTIONS.map(({ key, label }) => (
              <Controller
                key={key}
                control={control}
                name={key}
                render={({ field }) => (
                  <SwitchRow
                    label={label}
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      skipNextReset.current = true;
                      queryClient.setQueryData(
                        queryKeys.settings(),
                        (previous: Record<string, unknown> | undefined) =>
                          previous ? { ...previous, [key]: checked } : undefined
                      );
                      autoSaveNav({ [key]: checked });
                    }}
                  />
                )}
              />
            ))}
          </div>
        </section>

        {/* Snapshot Email */}
        <section className="scroll-mt-14" id="snapshot-email">
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
        <Card id="sharing" className="mt-10 scroll-mt-14">
          <CardHeader>
            <CardTitle className="text-base">Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <SharingSection />
          </CardContent>
        </Card>
      )}

      {data?.role === "OWNER" && (
        <Card id="billing" className="mt-10 scroll-mt-14">
          <CardHeader>
            <CardTitle className="text-base">Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <BillingSection />
          </CardContent>
        </Card>
      )}

      <Card id="security" className="mt-10 scroll-mt-14">
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SecuritySection />
          {data?.id && (
            <div className="space-y-1 pt-4 border-t border-border">
              <p className="text-sm font-medium">Account ID</p>
              <p className="text-xs text-muted-foreground">
                Share this with a super admin so they can grant you super admin access.
              </p>
              <code className="block mt-1 p-2 rounded bg-muted text-xs text-muted-foreground select-all">
                {data.id}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {data?.isSuperAdmin && (
        <Card id="super-admin" className="mt-10 scroll-mt-14">
          <CardHeader>
            <CardTitle className="text-base">Super Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <SuperAdminSection />
          </CardContent>
        </Card>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-border bg-background/90 px-6 py-3 backdrop-blur-md -mx-6">
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
