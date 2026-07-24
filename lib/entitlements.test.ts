import { describe, it, expect } from "vitest";
import { computeEntitlements, type SubscriptionState } from "./entitlements";

const NOW = new Date("2026-07-18T00:00:00Z");

function state(overrides: Partial<SubscriptionState>): SubscriptionState {
  return {
    subscriptionTier: "FREE",
    subscriptionStatus: "TRIALING",
    trialEndsAt: null,
    ...overrides,
  };
}

describe("computeEntitlements — trialDaysRemaining", () => {
  it("returns null when there is no trialEndsAt", () => {
    const result = computeEntitlements(state({ trialEndsAt: null }), NOW);
    expect(result.trialDaysRemaining).toBeNull();
  });

  it("rounds up remaining whole days for a future trial end", () => {
    const trialEndsAt = new Date(NOW.getTime() + 3.2 * 24 * 60 * 60 * 1000);
    const result = computeEntitlements(state({ trialEndsAt }), NOW);
    expect(result.trialDaysRemaining).toBe(4);
  });

  it("returns 0 (not negative) once the trial end has passed", () => {
    const trialEndsAt = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000);
    const result = computeEntitlements(state({ trialEndsAt }), NOW);
    expect(result.trialDaysRemaining).toBe(0);
  });

  it("returns 0 exactly at the trial end boundary", () => {
    const result = computeEntitlements(state({ trialEndsAt: NOW }), NOW);
    expect(result.trialDaysRemaining).toBe(0);
  });
});

describe("computeEntitlements — isActive matrix", () => {
  const tiers = ["FREE", "PRO"] as const;
  const statuses = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "INCOMPLETE"] as const;

  for (const tier of tiers) {
    for (const status of statuses) {
      it(`tier=${tier} status=${status} with no active trial is inactive unless PRO+ACTIVE`, () => {
        const result = computeEntitlements(
          state({ subscriptionTier: tier, subscriptionStatus: status, trialEndsAt: null }),
          NOW
        );
        const expected = tier === "PRO" && status === "ACTIVE";
        expect(result.isActive).toBe(expected);
      });
    }
  }

  it("PRO + TRIALING with a future trialEndsAt is active and trialing", () => {
    const trialEndsAt = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
    const result = computeEntitlements(
      state({ subscriptionTier: "PRO", subscriptionStatus: "TRIALING", trialEndsAt }),
      NOW
    );
    expect(result.isActive).toBe(true);
    expect(result.isTrialing).toBe(true);
  });

  it("PRO + TRIALING with a past trialEndsAt is inactive", () => {
    const trialEndsAt = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
    const result = computeEntitlements(
      state({ subscriptionTier: "PRO", subscriptionStatus: "TRIALING", trialEndsAt }),
      NOW
    );
    expect(result.isActive).toBe(false);
    expect(result.isTrialing).toBe(false);
  });

  it("FREE tier is never active regardless of status", () => {
    for (const status of statuses) {
      const result = computeEntitlements(state({ subscriptionTier: "FREE", subscriptionStatus: status }), NOW);
      expect(result.isActive).toBe(false);
    }
  });
});

describe("computeEntitlements — limits", () => {
  it("returns finite Free-tier limits when inactive", () => {
    const result = computeEntitlements(state({ subscriptionTier: "FREE", subscriptionStatus: "TRIALING" }), NOW);
    expect(result.limits.maxAccountsPerAssetClass).toBe(3);
    expect(result.limits.cgtEngineEnabled).toBe(false);
    expect(result.limits.firePlannerEnabled).toBe(false);
    expect(result.limits.snapshotEmailsEnabled).toBe(false);
  });

  it("returns unlocked Pro-tier limits when active", () => {
    const result = computeEntitlements(state({ subscriptionTier: "PRO", subscriptionStatus: "ACTIVE" }), NOW);
    expect(result.limits.maxAccountsPerAssetClass).toBe(Infinity);
    expect(result.limits.cgtEngineEnabled).toBe(true);
    expect(result.limits.firePlannerEnabled).toBe(true);
    expect(result.limits.snapshotEmailsEnabled).toBe(true);
  });
});
