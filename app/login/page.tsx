"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BrandLogoMark from "@/components/landing/BrandLogoMark";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? (mode === "login" ? "Invalid email or password" : "Failed to create account"));
      return;
    }

    const data = await response.json().catch(() => ({}));
    if (data.message) {
      setNotice(data.message);
      setMode("login");
      return;
    }
    router.push(data.redirectTo ?? "/auth/mfa");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, var(--fs-accent-50) 0%, var(--fs-surface-0) 45%)" }}
    >
      <Card className="w-full max-w-sm rounded-xl border-[var(--fs-line-1)] shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2.5 mb-2">
            <BrandLogoMark size="md" />
            <CardTitle className="tracking-tight" style={{ letterSpacing: "-0.01em" }}>Financial Sanity</CardTitle>
          </div>
          <CardDescription>
            {mode === "login" ? "Sign in to your account" : "Create your free account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>
            {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === "login" ? "Signing in…" : "Creating account…"
                : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  className="underline hover:text-foreground transition-colors"
                  onClick={() => { setMode("signup"); setError(null); }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="underline hover:text-foreground transition-colors"
                  onClick={() => { setMode("login"); setError(null); }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
          {mode === "login" && (
            <div className="mt-2 text-center text-sm">
              <a
                href="/auth/forgot-password"
                className="text-muted-foreground underline hover:text-foreground transition-colors"
              >
                Forgot password?
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
