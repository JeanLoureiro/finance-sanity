"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

export function FreeTierTestBanner() {
  const { data: settings } = useQuery<{
    isSuperAdmin?: boolean;
    superAdminFreeTierOverride?: boolean;
  }>({
    queryKey: queryKeys.settings(),
    queryFn: () => fetch("/api/settings").then((response) => response.json()),
    staleTime: 5 * 60 * 1000,
  });

  if (!settings?.isSuperAdmin || !settings.superAdminFreeTierOverride) {
    return null;
  }

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 text-center text-sm font-medium text-amber-700 dark:text-amber-400">
      Super Admin testing mode — viewing this account as Free tier. Turn it off in Settings → Super Admin.
    </div>
  );
}
