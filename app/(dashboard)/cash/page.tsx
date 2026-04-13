import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import CashClient from "./CashClient";

export default async function CashPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const [accounts, budgetItems, settings] = await Promise.all([
      prisma.bankAccount.findMany({ where: { settingsId }, orderBy: { sortOrder: "asc" } }),
      prisma.budgetItem.findMany({ where: { settingsId }, orderBy: { sortOrder: "asc" } }),
      prisma.userSettings.findUnique({ where: { id: settingsId } }),
    ]);
    queryClient.setQueryData(queryKeys.cash.accounts(), JSON.parse(JSON.stringify(accounts)));
    queryClient.setQueryData(queryKeys.budget.items(), JSON.parse(JSON.stringify(budgetItems)));
    queryClient.setQueryData(queryKeys.settings(), JSON.parse(JSON.stringify(settings)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CashClient />
    </HydrationBoundary>
  );
}
