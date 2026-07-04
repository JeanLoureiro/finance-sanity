"use client";

import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resetPasswordFormSchema, type ResetPasswordFormInput } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import BrandLogoMark from "@/components/landing/BrandLogoMark";

type ExchangeState = "exchanging" | "ready" | "error";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");
  const typeParam = searchParams.get("type");
  const isRecoveryFlow = typeParam === "recovery";
  const [exchangeState, setExchangeState] = useState<ExchangeState>(
    linkError || !isRecoveryFlow ? "error" : "exchanging"
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  useEffect(() => {
    if (linkError || !isRecoveryFlow) return;

    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setExchangeState("ready");
        } else {
          setExchangeState("error");
        }
      })
      .catch(() => setExchangeState("error"));
  }, [linkError, isRecoveryFlow]);

  async function handleSubmit(values: ResetPasswordFormInput) {
    setServerError(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: values.password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setServerError(data.error ?? "Failed to reset password");
      return;
    }

    router.push(data.redirectTo ?? "/auth/mfa");
  }

  if (exchangeState === "exchanging") {
    return <p className="text-sm text-muted-foreground">Verifying reset link…</p>;
  }

  if (exchangeState === "error") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          This reset link is invalid or has expired.
        </p>
        <a
          href="/auth/forgot-password"
          className="block text-center text-sm underline text-muted-foreground hover:text-foreground transition-colors"
        >
          Request a new link
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          autoFocus
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2.5 mb-2">
            <BrandLogoMark size="md" />
            <CardTitle
              className="tracking-tight"
              style={{ letterSpacing: "-0.01em" }}
            >
              Financial Sanity
            </CardTitle>
          </div>
          <CardDescription>Choose a new password</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">
                Verifying reset link…
              </p>
            }
          >
            <ResetPasswordContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
