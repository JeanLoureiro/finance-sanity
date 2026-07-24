import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const TRIAL_PERIOD_DAYS = 14;

const PRICE_ID_BY_KEY: Record<"monthly" | "annual", string> = {
  monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY!,
  annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL!,
};

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function resolvePriceId(priceKey: "monthly" | "annual"): string {
  return PRICE_ID_BY_KEY[priceKey];
}

export async function createCheckoutSession(
  settingsId: string,
  priceKey: "monthly" | "annual",
  ownerEmail: string | undefined
): Promise<string> {
  const settings = await prisma.userSettings.findUniqueOrThrow({
    where: { id: settingsId },
    select: { stripeCustomerId: true, trialEndsAt: true },
  });

  let customerId = settings.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ownerEmail,
      metadata: { settingsId },
    });
    customerId = customer.id;
  }

  // Trial starts on first checkout attempt and is persisted immediately so
  // an abandoned/retried checkout never resets the clock.
  let trialEndsAt = settings.trialEndsAt;
  if (!trialEndsAt) {
    trialEndsAt = new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  }

  await prisma.userSettings.update({
    where: { id: settingsId },
    data: { stripeCustomerId: customerId, trialEndsAt },
  });

  const trialEnd = Math.floor(trialEndsAt.getTime() / 1000);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: resolvePriceId(priceKey), quantity: 1 }],
    subscription_data: trialEnd > Math.floor(Date.now() / 1000) ? { trial_end: trialEnd } : undefined,
    success_url: `${appUrl()}/settings#billing`,
    cancel_url: `${appUrl()}/settings#billing`,
    metadata: { settingsId },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout session URL");
  }

  return session.url;
}

export async function createBillingPortalSession(settingsId: string): Promise<string> {
  const settings = await prisma.userSettings.findUniqueOrThrow({
    where: { id: settingsId },
    select: { stripeCustomerId: true },
  });

  if (!settings.stripeCustomerId) {
    throw new Error("Account has no Stripe customer to manage");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: settings.stripeCustomerId,
    return_url: `${appUrl()}/settings#billing`,
  });

  return session.url;
}

function tierForPriceId(priceId: string | null | undefined): "FREE" | "PRO" {
  if (!priceId) return "FREE";
  return priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_ID_PRO_ANNUAL
    ? "PRO"
    : "FREE";
}

function statusFromStripe(status: Stripe.Subscription.Status): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

async function updateSettingsFromSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const settings = await prisma.userSettings.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!settings) return;

  const priceId = subscription.items.data[0]?.price.id ?? null;
  const currentPeriodEndSeconds = subscription.items.data[0]?.current_period_end;

  await prisma.userSettings.update({
    where: { id: settings.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionTier: tierForPriceId(priceId),
      subscriptionStatus: statusFromStripe(subscription.status),
      currentPeriodEnd: currentPeriodEndSeconds ? new Date(currentPeriodEndSeconds * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

export async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent): Promise<void> {
  const session = event.data.object;
  if (!session.subscription) return;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await updateSettingsFromSubscription(subscription);
}

export async function handleSubscriptionUpdated(event: Stripe.CustomerSubscriptionUpdatedEvent): Promise<void> {
  await updateSettingsFromSubscription(event.data.object);
}

export async function handleSubscriptionDeleted(event: Stripe.CustomerSubscriptionDeletedEvent): Promise<void> {
  await updateSettingsFromSubscription(event.data.object);
}

export async function handleInvoicePaymentFailed(event: Stripe.InvoicePaymentFailedEvent): Promise<void> {
  const invoice = event.data.object;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const settings = await prisma.userSettings.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!settings) return;

  await prisma.userSettings.update({
    where: { id: settings.id },
    data: { subscriptionStatus: "PAST_DUE" },
  });
}
