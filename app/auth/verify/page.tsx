"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BrandLogoMark from "@/components/landing/BrandLogoMark";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!token) return;
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const data = await response.json();
      window.location.href = data.redirectTo || "/dashboard";
      return;
    }

    const data = await response.json().catch(() => ({}));
    setError(data.error ?? "Sign in failed. Please request a new magic link.");
    setLoading(false);
  }

  if (!token) {
    return (
      <p className="text-sm text-destructive">
        Invalid link. Please request a new magic link from the{" "}
        <a href="/login" className="underline">
          login page
        </a>
        .
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click the button below to complete your sign in.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleSignIn} disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, var(--fs-accent-50) 0%, var(--fs-surface-0) 45%)" }}
    >
      <Card className="w-full max-w-sm rounded-xl border-[var(--fs-line-1)] shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2.5 mb-2">
            <BrandLogoMark size="md" />
            <CardTitle style={{ letterSpacing: "-0.01em" }}>Financial Sanity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
            <VerifyContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
