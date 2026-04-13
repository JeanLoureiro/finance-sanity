import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import LoansClient from "./LoansClient";

export default async function LoansPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const data = await prisma.loan.findMany({ where: { settingsId }, orderBy: { startDate: "asc" } });
    queryClient.setQueryData(queryKeys.loans.all(), JSON.parse(JSON.stringify(data)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LoansClient />
    </HydrationBoundary>
  );
}
