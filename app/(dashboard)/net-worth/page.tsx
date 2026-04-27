import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { computeNetWorth } from "@/lib/netWorth";
import { queryKeys } from "@/lib/queryKeys";
import NetWorthClient from "./NetWorthClient";

export default async function NetWorthPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const data = await computeNetWorth(settingsId);
    queryClient.setQueryData(queryKeys.netWorth(), JSON.parse(JSON.stringify(data)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NetWorthClient />
    </HydrationBoundary>
  );
}
