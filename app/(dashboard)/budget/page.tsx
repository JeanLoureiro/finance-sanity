import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import BudgetClient from "./BudgetClient";

export default async function BudgetPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const [items, settings, types, categories, bankAccounts] = await Promise.all([
      prisma.budgetItem.findMany({ where: { settingsId }, orderBy: { sortOrder: "asc" } }),
      prisma.userSettings.findUnique({ where: { id: settingsId } }),
      prisma.budgetType.findMany({ where: { settingsId }, orderBy: { sortOrder: "asc" } }),
      prisma.budgetCategory.findMany({ where: { settingsId }, orderBy: { sortOrder: "asc" } }),
      prisma.bankAccount.findMany({ where: { settingsId }, orderBy: { sortOrder: "asc" } }),
    ]);
    queryClient.setQueryData(queryKeys.budget.items(), JSON.parse(JSON.stringify(items)));
    queryClient.setQueryData(queryKeys.settings(), JSON.parse(JSON.stringify(settings)));
    // Only cache types/categories if they already exist. When empty, the client-side
    // query hits /api/budget/types which seeds the default set — prefetching [] would
    // populate the cache and suppress that seed for 5 minutes (staleTime).
    if (types.length > 0) queryClient.setQueryData(queryKeys.budget.types(), JSON.parse(JSON.stringify(types)));
    if (categories.length > 0) queryClient.setQueryData(queryKeys.budget.categories(), JSON.parse(JSON.stringify(categories)));
    queryClient.setQueryData(queryKeys.cash.accounts(), JSON.parse(JSON.stringify(bankAccounts)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BudgetClient />
    </HydrationBoundary>
  );
}
