import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import PropertyClient from "./PropertyClient";

export default async function PropertyPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const data = await prisma.property.findMany({ where: { settingsId }, orderBy: { sortOrder: "asc" } });
    queryClient.setQueryData(queryKeys.properties.all(), JSON.parse(JSON.stringify(data)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PropertyClient />
    </HydrationBoundary>
  );
}
