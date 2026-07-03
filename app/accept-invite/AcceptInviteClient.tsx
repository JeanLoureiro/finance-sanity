"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InviteMetadata = {
  granteeEmail: string;
  ownerEmail: string;
  role: "READ" | "WRITE";
};

type Props = {
  token: string;
  invite: InviteMetadata;
};

export default function AcceptInviteClient({ token, invite }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const roleLabel = invite.role === "WRITE" ? "full read & write" : "read-only";

  async function acceptInvite() {
    const response = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Failed to accept invite");
      setLoading(false);
      return;
    }

    // The accept endpoint sets the fs-active-context cookie server-side.
    // Navigate to the dashboard where the shared context will be active.
    router.push("/dashboard");
  }

  useEffect(() => {
    let cancelled = false;

    async function autoAccept() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        router.push(`/login?redirectedFrom=/accept-invite?token=${token}`);
        return;
      }

      await acceptInvite();
    }

    autoAccept();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router, supabase]);

  async function handleRetry() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirectedFrom=/accept-invite?token=${token}`);
      return;
    }

    await acceptInvite();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, var(--fs-accent-50) 0%, var(--fs-surface-0) 45%)" }}
    >
      <Card className="w-full max-w-sm rounded-xl border-[var(--fs-line-1)] shadow-none">
        <CardHeader>
          <CardTitle>
            {loading && !error ? "Accepting invitation…" : "You have been invited"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong>{invite.ownerEmail || "Someone"}</strong> has invited{" "}
            <strong>{invite.granteeEmail}</strong> to access their{" "}
            <strong>Financial Sanity</strong> data with{" "}
            <strong>{roleLabel}</strong> access.
          </p>

          {loading && !error && (
            <p className="text-sm text-muted-foreground">
              Please wait while we set up your access...
            </p>
          )}

          {error && (
            <>
              <p className="text-sm text-destructive">{error}</p>
              <Button
                className="w-full"
                onClick={handleRetry}
                disabled={loading}
              >
                Try again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
