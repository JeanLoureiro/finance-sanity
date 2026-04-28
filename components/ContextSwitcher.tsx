"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AccountContext = {
  settingsId: string;
  label: string;
  type: "OWNER" | "READ" | "WRITE";
  ownerEmail: string;
  isActive: boolean;
};

interface ContextSwitcherProps {
  collapsed: boolean;
}

export function ContextSwitcher({ collapsed }: ContextSwitcherProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: contexts = [] } = useQuery<AccountContext[]>({
    queryKey: queryKeys.contexts.all(),
    queryFn: () => fetch("/api/contexts").then((response) => response.json()),
    staleTime: Infinity,
  });

  const switchMutation = useMutation({
    mutationFn: (settingsId: string) =>
      fetch("/api/contexts/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsId }),
      }).then((response) => response.json()),
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.refresh();
    },
  });

  // Only render when there is more than one context.
  if (contexts.length <= 1) return null;

  const activeContext = contexts.find((context) => context.isActive) ?? contexts[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={collapsed ? activeContext.label : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
          collapsed ? "justify-center size-8" : "w-full px-2.5 py-2"
        )}
      >
        <Users className="size-4 flex-shrink-0 opacity-85" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{activeContext.label}</span>
            <ChevronDown className="size-3.5 flex-shrink-0 opacity-60" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align={collapsed ? "start" : "end"} className="w-56">
        {contexts.map((context) => (
          <DropdownMenuItem
            key={context.settingsId}
            disabled={switchMutation.isPending}
            onClick={() => {
              if (!context.isActive) {
                switchMutation.mutate(context.settingsId);
              }
            }}
            className={cn("flex items-center gap-2 cursor-pointer", context.isActive && "font-medium")}
          >
            <span className="flex-1 truncate">{context.label}</span>
            {context.isActive && <Check className="size-3.5 flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
