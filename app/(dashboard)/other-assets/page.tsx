import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import OtherAssetsClient from "./OtherAssetsClient";

export default async function OtherAssetsPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const data = await prisma.otherAsset.findMany({ where: { settingsId }, orderBy: { purchaseDate: "desc" } });
    queryClient.setQueryData(queryKeys.otherAssets(), JSON.parse(JSON.stringify(data)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OtherAssetsClient />
    </HydrationBoundary>
  );
}
