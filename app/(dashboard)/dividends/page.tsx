import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import DividendsClient from "./DividendsClient";

export default async function DividendsPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const data = await prisma.dividend.findMany({ where: { settingsId }, orderBy: { paymentDate: "desc" } });
    queryClient.setQueryData(queryKeys.dividends.all(), JSON.parse(JSON.stringify(data)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DividendsClient />
    </HydrationBoundary>
  );
}
