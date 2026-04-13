import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryKeys } from "@/lib/queryKeys";
import BudgetClient from "./BudgetClient";

export default async function BudgetPage() {
  const queryClient = new QueryClient();
  try {
    const { settingsId } = await getAuthorisedSettings();
    const [items, settings] = await Promise.all([
      prisma.budgetItem.findMany({ where: { settingsId }, orderBy: { sortOrder: "asc" } }),
      prisma.userSettings.findUnique({ where: { id: settingsId } }),
    ]);
    queryClient.setQueryData(queryKeys.budget.items(), JSON.parse(JSON.stringify(items)));
    queryClient.setQueryData(queryKeys.settings(), JSON.parse(JSON.stringify(settings)));
  } catch {
    // middleware handles redirect if unauthenticated
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BudgetClient />
    </HydrationBoundary>
  );
}
