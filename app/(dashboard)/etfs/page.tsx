import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import ETFsClient from "./ETFsClient";

export default async function ETFsPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const data = await prisma.eTFHolding.findMany({
      where: { settingsId },
      include: { purchases: { orderBy: { date: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    queryClient.setQueryData(queryKeys.holdings.all("etfs"), JSON.parse(JSON.stringify(data)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ETFsClient />
    </HydrationBoundary>
  );
}
