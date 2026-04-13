import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import SideIncomeClient from "./SideIncomeClient";

export default async function SideIncomePage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const data = await prisma.sideIncomeEntry.findMany({ where: { settingsId }, orderBy: { date: "desc" } });
    queryClient.setQueryData(queryKeys.sideIncome.all(), JSON.parse(JSON.stringify(data)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SideIncomeClient />
    </HydrationBoundary>
  );
}
