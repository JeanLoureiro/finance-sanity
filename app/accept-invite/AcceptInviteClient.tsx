"use client";

import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const roleLabel = invite.role === "WRITE" ? "full read & write" : "read-only";

  async function handleAccept() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login, then back here after auth
      router.push(`/login?redirectedFrom=/accept-invite?token=${token}`);
      return;
    }

    const response = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Failed to accept invite");
      setLoading(false);
      return;
    }

    // The API redirects to /net-worth — follow it
    router.push("/net-worth");
  }

  async function handleSignIn() {
    setCheckingAuth(true);
    router.push(`/login?redirectedFrom=/accept-invite?token=${token}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>You have been invited</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong>{invite.ownerEmail || "Someone"}</strong> has invited{" "}
            <strong>{invite.granteeEmail}</strong> to access their{" "}
            <strong>Finance Sanity</strong> data with{" "}
            <strong>{roleLabel}</strong> access.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={loading || checkingAuth}
          >
            {loading ? "Accepting…" : "Accept invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
