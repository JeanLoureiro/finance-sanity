import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import SuperClient from "./SuperClient";

export default async function SuperPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const data = await prisma.superAccount.findMany({ where: { settingsId }, orderBy: { sortOrder: "asc" } });
    queryClient.setQueryData(queryKeys.super(), JSON.parse(JSON.stringify(data)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SuperClient />
    </HydrationBoundary>
  );
}
