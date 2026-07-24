import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import { computeEntitlements } from "@/lib/entitlements";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const settings = await prisma.userSettings.findUnique({ where: { id: settingsId } });
    if (settings) {
      const { tier, isActive, isTrialing, trialDaysRemaining } = computeEntitlements(settings);
      queryClient.setQueryData(
        queryKeys.settings(),
        JSON.parse(JSON.stringify({ ...settings, entitlements: { tier, isActive, isTrialing, trialDaysRemaining } }))
      );
    }
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsClient />
    </HydrationBoundary>
  );
}
