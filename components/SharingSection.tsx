"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Grant = {
  id: string;
  granteeEmail: string;
  role: "READ" | "WRITE";
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  token: string;
  createdAt: string;
};

const statusLabel: Record<Grant["status"], string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REVOKED: "Revoked",
};

const roleLabel: Record<Grant["role"], string> = {
  READ: "Read only",
  WRITE: "Read & write",
};

export default function SharingSection() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"READ" | "WRITE">("READ");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const { data: grants = [], isLoading } = useQuery<Grant[]>({
    queryKey: queryKeys.sharing.grants(),
    queryFn: async () => {
      const response = await fetch("/api/invitations");
      if (!response.ok) throw new Error("Failed to load grants");
      return response.json();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: "READ" | "WRITE" }) => {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to send invite");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharing.grants() });
      setEmail("");
      setRole("READ");
      setInviteError(null);
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 4000);
    },
    onError: (error: Error) => {
      setInviteError(error.message);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to revoke");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharing.grants() });
    },
  });

  function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setInviteError(null);
    setInviteSuccess(false);
    inviteMutation.mutate({ email, role });
  }

  const activeGrants = grants.filter((grant) => grant.status !== "REVOKED");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sharing</h3>
        <p className="text-sm text-muted-foreground">
          Invite someone to view or edit your financial data.
        </p>
      </div>

      <form onSubmit={handleInvite} className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <label htmlFor="invite-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="invite-email"
            type="email"
            placeholder="partner@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="w-40 space-y-1">
          <label className="text-sm font-medium">Access</label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as "READ" | "WRITE")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="READ">Read only</SelectItem>
              <SelectItem value="WRITE">Read &amp; write</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={inviteMutation.isPending}>
          {inviteMutation.isPending ? "Sending…" : "Send invite"}
        </Button>
      </form>

      {inviteError && (
        <p className="text-sm text-destructive">{inviteError}</p>
      )}
      {inviteSuccess && (
        <p className="text-sm text-green-600">Invitation sent successfully.</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : activeGrants.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeGrants.map((grant) => (
              <TableRow key={grant.id}>
                <TableCell>{grant.granteeEmail}</TableCell>
                <TableCell>{roleLabel[grant.role]}</TableCell>
                <TableCell>{statusLabel[grant.status]}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(grant.token)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">No active shares.</p>
      )}
    </div>
  );
}
