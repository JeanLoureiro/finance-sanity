"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";

type BillingSettings = {
  subscriptionTier: "FREE" | "PRO";
  subscriptionStatus: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  entitlements: {
    tier: "FREE" | "PRO";
    isActive: boolean;
    isTrialing: boolean;
    trialDaysRemaining: number | null;
  };
};

const statusLabel: Record<BillingSettings["subscriptionStatus"], string> = {
  TRIALING: "Trial",
  ACTIVE: "Active",
  PAST_DUE: "Payment failed",
  CANCELED: "Canceled",
  INCOMPLETE: "Incomplete",
};

export default function BillingSection() {
  const [priceKey, setPriceKey] = useState<"monthly" | "annual">("monthly");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<BillingSettings>({
    queryKey: queryKeys.settings(),
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to load billing status");
      return response.json();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: "monthly" | "annual") => {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to start checkout");
      }
      return response.json() as Promise<{ url: string }>;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to open billing portal");
      }
      return response.json() as Promise<{ url: string }>;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  if (isLoading || !data?.entitlements) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const { entitlements } = data;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan and payment method.
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">
          Current plan: {entitlements.tier === "PRO" ? "Premium" : "Free"}
          {" — "}
          {statusLabel[data.subscriptionStatus]}
        </p>
        {entitlements.isTrialing && entitlements.trialDaysRemaining !== null && (
          <p className="text-sm text-muted-foreground">
            Trial ends in {entitlements.trialDaysRemaining} day{entitlements.trialDaysRemaining === 1 ? "" : "s"}.
          </p>
        )}
        {!entitlements.isTrialing && data.subscriptionStatus === "ACTIVE" && data.currentPeriodEnd && (
          <p className="text-sm text-muted-foreground">
            {data.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
            {new Date(data.currentPeriodEnd).toLocaleDateString()}.
          </p>
        )}
        {data.subscriptionStatus === "PAST_DUE" && (
          <p className="text-sm text-destructive">
            Your last payment failed — update your card to keep Pro access.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!entitlements.isActive && (
        <div className="flex items-end gap-2">
          <div className="w-40 space-y-1">
            <label className="text-sm font-medium">Billing cycle</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={priceKey}
              onChange={(event) => setPriceKey(event.target.value as "monthly" | "annual")}
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <Button
            disabled={checkoutMutation.isPending}
            onClick={() => {
              setError(null);
              checkoutMutation.mutate(priceKey);
            }}
          >
            {checkoutMutation.isPending ? "Redirecting…" : "Upgrade to Premium"}
          </Button>
        </div>
      )}

      {data.stripeCustomerId && (
        <Button
          variant="outline"
          disabled={portalMutation.isPending}
          onClick={() => {
            setError(null);
            portalMutation.mutate();
          }}
        >
          {portalMutation.isPending ? "Redirecting…" : "Manage billing"}
        </Button>
      )}
    </div>
  );
}
