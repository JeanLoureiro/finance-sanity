"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        redirectTo: `${window.location.origin}/auth/verify`,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Failed to send magic link");
      return;
    }

    setSent(true);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, var(--fs-accent-50) 0%, var(--fs-surface-0) 45%)" }}
    >
      <Card className="w-full max-w-sm rounded-xl border-[var(--fs-line-1)] shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[var(--fs-accent-500)] to-[var(--fs-accent-700)]">
              <svg className="size-[18px]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <polyline points="2.5,15.5 7,9.5 11,12.5 16,4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
                <circle cx="16" cy="4.5" r="2.2" fill="white" />
              </svg>
            </div>
            <CardTitle className="tracking-tight" style={{ letterSpacing: "-0.01em" }}>Financial Sanity</CardTitle>
          </div>
          <CardDescription>Sign in or create your free account</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              Check your email - we sent a magic link to{" "}
              <strong>{email}</strong>.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send magic link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
