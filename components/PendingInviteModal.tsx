"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PendingInvite = {
  token: string;
  ownerEmail: string;
  role: "READ" | "WRITE";
};

export function PendingInviteModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // dismissed tracks whether the user clicked "Remind me later" this session
  const [dismissed, setDismissed] = useState(false);

  const { data: invites = [] } = useQuery<PendingInvite[]>({
    queryKey: queryKeys.sharing.pending(),
    queryFn: () => fetch("/api/invitations/pending").then((response) => response.json()),
    staleTime: Infinity, // only fetch once per session
  });

  const acceptMutation = useMutation({
    mutationFn: (token: string) =>
      fetch(`/api/invitations/${token}/accept`, { method: "POST", redirect: "manual" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharing.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
      router.refresh();
    },
  });

  // Always show the first pending invite; after accepting it is removed from the list
  const invite = invites[0];
  const open = !!invite && !dismissed;

  if (!invite) return null;

  const roleLabel = invite.role === "WRITE" ? "full read & write" : "read-only";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) setDismissed(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>You have a pending invitation</DialogTitle>
          <DialogDescription>
            <strong>{invite.ownerEmail || "Someone"}</strong> has invited you to access
            their <strong>Financial Sanity</strong> data with{" "}
            <strong>{roleLabel}</strong> access.
          </DialogDescription>
        </DialogHeader>

        {invites.length > 1 && (
          <p className="text-xs text-muted-foreground">
            You have {invites.length} pending invitations.
          </p>
        )}

        {acceptMutation.isError && (
          <p className="text-xs text-destructive">
            Failed to accept invitation. Please try again.
          </p>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setDismissed(true)}
            disabled={acceptMutation.isPending}
          >
            Remind me later
          </Button>
          <Button
            onClick={() => acceptMutation.mutate(invite.token)}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? "Accepting…" : "Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
