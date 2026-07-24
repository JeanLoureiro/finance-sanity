import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus, SubscriptionTier } from "@/app/generated/prisma/client";

export type EntitlementLimits = {
  maxAccountsPerAssetClass: number;
  maxProperties: number;
  cgtEngineEnabled: boolean;
  firePlannerEnabled: boolean;
  snapshotEmailsEnabled: boolean;
};

export type Entitlements = {
  tier: SubscriptionTier;
  isActive: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  limits: EntitlementLimits;
};

const FREE_LIMITS: EntitlementLimits = {
  maxAccountsPerAssetClass: 3,
  maxProperties: 1,
  cgtEngineEnabled: false,
  firePlannerEnabled: false,
  snapshotEmailsEnabled: false,
};

const PRO_LIMITS: EntitlementLimits = {
  maxAccountsPerAssetClass: Infinity,
  maxProperties: Infinity,
  cgtEngineEnabled: true,
  firePlannerEnabled: true,
  snapshotEmailsEnabled: true,
};

export type SubscriptionState = {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
};

export function computeEntitlements(state: SubscriptionState, now: Date = new Date()): Entitlements {
  const isTrialing = state.subscriptionStatus === "TRIALING" && state.trialEndsAt !== null && state.trialEndsAt > now;
  const isActive =
    state.subscriptionTier === "PRO" && (state.subscriptionStatus === "ACTIVE" || isTrialing);

  const trialDaysRemaining =
    state.trialEndsAt !== null
      ? Math.max(0, Math.ceil((state.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

  return {
    tier: state.subscriptionTier,
    isActive,
    isTrialing,
    trialDaysRemaining,
    limits: isActive ? PRO_LIMITS : FREE_LIMITS,
  };
}

export async function getAccountEntitlements(settingsId: string): Promise<Entitlements> {
  const settings = await prisma.userSettings.findUniqueOrThrow({
    where: { id: settingsId },
    select: { subscriptionTier: true, subscriptionStatus: true, trialEndsAt: true },
  });
  return computeEntitlements(settings);
}
