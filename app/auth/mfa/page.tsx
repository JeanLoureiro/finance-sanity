"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mfaVerifySchema, mfaEnrollVerifySchema, type MfaVerifyInput, type MfaEnrollVerifyInput } from "@/lib/schemas";
import BrandLogoMark from "@/components/landing/BrandLogoMark";

type FactorStatus =
  | { status: "loading" }
  | { status: "enrolled"; factorId: string }
  | { status: "not-enrolled" }
  | { status: "error"; message: string };

type EnrollState =
  | { step: "idle" }
  | { step: "scanning"; factorId: string; qrCode: string; secret: string };

function OtpInput({
  value,
  onChange,
  autoFocus,
  disabled,
  onComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  onComplete?: () => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const slots = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  function handleChange(slotIndex: number, event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, "");
    if (!raw) return;

    const newSlots = [...slots];

    if (raw.length > 1) {
      // Handle paste: distribute digits from this slot onward
      for (let i = 0; i < raw.length && slotIndex + i < 6; i++) {
        newSlots[slotIndex + i] = raw[i];
      }
      const newCode = newSlots.join("");
      onChange(newCode);
      const nextFocus = Math.min(slotIndex + raw.length, 5);
      inputRefs.current[nextFocus]?.focus();
      if (newCode.length === 6) {
        onComplete?.();
      }
      return;
    }

    newSlots[slotIndex] = raw[0];
    const newCode = newSlots.join("");
    onChange(newCode);

    if (slotIndex < 5) {
      inputRefs.current[slotIndex + 1]?.focus();
    }

    if (newCode.length === 6) {
      onComplete?.();
    }
  }

  function handleKeyDown(slotIndex: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (slots[slotIndex]) {
        const newSlots = [...slots];
        newSlots[slotIndex] = "";
        onChange(newSlots.join(""));
      } else if (slotIndex > 0) {
        const newSlots = [...slots];
        newSlots[slotIndex - 1] = "";
        onChange(newSlots.join(""));
        inputRefs.current[slotIndex - 1]?.focus();
      }
      event.preventDefault();
    } else if (event.key === "ArrowLeft" && slotIndex > 0) {
      inputRefs.current[slotIndex - 1]?.focus();
    } else if (event.key === "ArrowRight" && slotIndex < 5) {
      inputRefs.current[slotIndex + 1]?.focus();
    }
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    event.target.select();
  }

  return (
    <div role="group" aria-label="One-time code" className="flex gap-2 justify-center">
      {slots.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { inputRefs.current[index] = element; }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          aria-label={`Digit ${index + 1} of 6`}
          autoFocus={autoFocus && index === 0}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={handleFocus}
          className="w-11 h-14 text-center text-xl font-semibold rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 caret-transparent"
        />
      ))}
    </div>
  );
}

function MfaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [factorStatus, setFactorStatus] = useState<FactorStatus>({ status: "loading" });
  const [enrollState, setEnrollState] = useState<EnrollState>({ step: "idle" });
  const [serverError, setServerError] = useState<string | null>(null);

  const verifyForm = useForm<MfaVerifyInput>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: { code: "" },
  });

  const enrollVerifyForm = useForm<MfaEnrollVerifyInput>({
    resolver: zodResolver(mfaEnrollVerifySchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    fetch("/api/auth/mfa/factors")
      .then((response) => response.json())
      .then((data) => {
        if (data.enrolled) {
          setFactorStatus({ status: "enrolled", factorId: data.factorId });
        } else {
          setFactorStatus({ status: "not-enrolled" });
        }
      })
      .catch(() => {
        setFactorStatus({ status: "error", message: "Failed to load MFA status" });
      });
  }, []);

  async function handleVerify(values: MfaVerifyInput) {
    setServerError(null);
    const response = await fetch("/api/auth/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setServerError(data.error ?? "Verification failed");
      return;
    }

    router.push(next ?? data.redirectTo ?? "/dashboard");
  }

  async function handleStartEnroll() {
    setServerError(null);
    const response = await fetch("/api/auth/mfa/enroll", { method: "POST" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setServerError(data.error ?? "Failed to start MFA setup");
      return;
    }

    setEnrollState({ step: "scanning", factorId: data.factorId, qrCode: data.qrCode, secret: data.secret });
    enrollVerifyForm.setValue("factorId", data.factorId);
  }

  async function handleEnrollVerify(values: MfaEnrollVerifyInput) {
    setServerError(null);
    const response = await fetch("/api/auth/mfa/enroll/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setServerError(data.error ?? "Invalid code");
      return;
    }

    router.push(next ?? data.redirectTo ?? "/dashboard");
  }

  if (factorStatus.status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (factorStatus.status === "error") {
    return <p className="text-sm text-destructive">{factorStatus.message}</p>;
  }

  if (factorStatus.status === "enrolled") {
    return (
      <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-6">
        <input type="hidden" {...verifyForm.register("factorId")} value={factorStatus.factorId} />
        <div className="space-y-3">
          <Controller
            name="code"
            control={verifyForm.control}
            render={({ field }) => (
              <OtpInput
                value={field.value ?? ""}
                onChange={field.onChange}
                autoFocus
                disabled={verifyForm.formState.isSubmitting}
                onComplete={() => verifyForm.handleSubmit(handleVerify)()}
              />
            )}
          />
          {verifyForm.formState.errors.code && (
            <p className="text-xs text-destructive text-center">
              {verifyForm.formState.errors.code.message}
            </p>
          )}
        </div>
        {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={verifyForm.formState.isSubmitting}>
          {verifyForm.formState.isSubmitting ? "Verifying…" : "Verify"}
        </Button>
      </form>
    );
  }

  // Not enrolled — show mandatory enrollment flow
  if (enrollState.step === "idle") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Two-factor authentication is required. You will need an authenticator
          app such as Google Authenticator, Authy, or 1Password.
        </p>
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        <Button className="w-full" onClick={handleStartEnroll}>
          Set up authenticator
        </Button>
      </div>
    );
  }

  // Enrollment scanning step
  return (
    <form
      onSubmit={enrollVerifyForm.handleSubmit(handleEnrollVerify)}
      className="space-y-6"
    >
      <input type="hidden" {...enrollVerifyForm.register("factorId")} />
      <p className="text-sm text-muted-foreground">
        Scan this QR code with your authenticator app, then enter the 6-digit
        code to confirm.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={enrollState.qrCode}
        alt="MFA QR code"
        className="mx-auto w-40 h-40 rounded-lg border border-border"
      />
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">
          Can&apos;t scan? Enter manually
        </summary>
        <code className="block mt-2 break-all p-2 rounded bg-muted text-muted-foreground select-all">
          {enrollState.secret}
        </code>
      </details>
      <div className="space-y-3">
        <Controller
          name="code"
          control={enrollVerifyForm.control}
          render={({ field }) => (
            <OtpInput
              value={field.value ?? ""}
              onChange={field.onChange}
              autoFocus
              disabled={enrollVerifyForm.formState.isSubmitting}
              onComplete={() => enrollVerifyForm.handleSubmit(handleEnrollVerify)()}
            />
          )}
        />
        {enrollVerifyForm.formState.errors.code && (
          <p className="text-xs text-destructive text-center">
            {enrollVerifyForm.formState.errors.code.message}
          </p>
        )}
      </div>
      {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={enrollVerifyForm.formState.isSubmitting}
      >
        {enrollVerifyForm.formState.isSubmitting ? "Confirming…" : "Confirm and continue"}
      </Button>
    </form>
  );
}

export default function MfaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2.5 mb-2">
            <BrandLogoMark size="md" />
            <CardTitle className="tracking-tight" style={{ letterSpacing: "-0.01em" }}>
              Financial Sanity
            </CardTitle>
          </div>
          <CardDescription>Two-factor authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <MfaContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
