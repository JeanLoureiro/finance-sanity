"use client";

import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  useEffect(() => {
    if (linkError || !isRecoveryFlow) return;

    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!session) {
          setExchangeState("error");
          return;
        }

        // Supabase rejects password updates from an AAL1 session when the
        // account has MFA enrolled — verify MFA first, then return here.
        const { data: assuranceLevel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceLevel?.nextLevel === "aal2" && assuranceLevel.currentLevel !== "aal2") {
          const returnTo = encodeURIComponent("/auth/reset-password?type=recovery");
          router.push(`/auth/mfa?next=${returnTo}`);
          return;
        }

        setExchangeState("ready");
      })
      .catch(() => setExchangeState("error"));
  }, [linkError, isRecoveryFlow, router]);

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
        <div className="relative">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            autoFocus
            className="pr-10"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-10"
            {...form.register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
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
