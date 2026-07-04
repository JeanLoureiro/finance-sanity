"use client";

import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function MfaContent() {
  const router = useRouter();
  const [factorStatus, setFactorStatus] = useState<FactorStatus>({ status: "loading" });
  const [enrollState, setEnrollState] = useState<EnrollState>({ step: "idle" });
  const [serverError, setServerError] = useState<string | null>(null);

  const verifyForm = useForm<MfaVerifyInput>({
    resolver: zodResolver(mfaVerifySchema),
  });

  const enrollVerifyForm = useForm<MfaEnrollVerifyInput>({
    resolver: zodResolver(mfaEnrollVerifySchema),
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

    router.push(data.redirectTo ?? "/dashboard");
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

    router.push(data.redirectTo ?? "/dashboard");
  }

  if (factorStatus.status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (factorStatus.status === "error") {
    return <p className="text-sm text-destructive">{factorStatus.message}</p>;
  }

  if (factorStatus.status === "enrolled") {
    return (
      <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-4">
        <input type="hidden" {...verifyForm.register("factorId")} value={factorStatus.factorId} />
        <div className="space-y-2">
          <Label htmlFor="totp-code">6-digit code</Label>
          <Input
            id="totp-code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            autoFocus
            autoComplete="one-time-code"
            {...verifyForm.register("code")}
          />
          {verifyForm.formState.errors.code && (
            <p className="text-xs text-destructive">
              {verifyForm.formState.errors.code.message}
            </p>
          )}
        </div>
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
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
      className="space-y-4"
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
      <div className="space-y-2">
        <Label htmlFor="enroll-code">6-digit code</Label>
        <Input
          id="enroll-code"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          placeholder="000000"
          autoFocus
          autoComplete="one-time-code"
          {...enrollVerifyForm.register("code")}
        />
        {enrollVerifyForm.formState.errors.code && (
          <p className="text-xs text-destructive">
            {enrollVerifyForm.formState.errors.code.message}
          </p>
        )}
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
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
