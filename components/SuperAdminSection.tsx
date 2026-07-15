"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SuperAdmin = {
  id: string;
  ownerEmail: string | null;
};

export default function SuperAdminSection() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState(false);

  const { data: superAdmins = [], isLoading } = useQuery<SuperAdmin[]>({
    queryKey: queryKeys.superAdmins.all(),
    queryFn: async () => {
      const response = await fetch("/api/admin/super-admins");
      if (!response.ok) throw new Error("Failed to load super admins");
      return response.json();
    },
  });

  const grantMutation = useMutation({
    mutationFn: async (data: { userId: string }) => {
      const response = await fetch("/api/admin/super-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to grant super admin");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdmins.all() });
      setUserId("");
      setGrantError(null);
      setGrantSuccess(true);
      setTimeout(() => setGrantSuccess(false), 4000);
    },
    onError: (error: Error) => setGrantError(error.message),
  });

  function handleGrant(event: React.FormEvent) {
    event.preventDefault();
    setGrantError(null);
    setGrantSuccess(false);
    grantMutation.mutate({ userId });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Super Admins</h3>
        <p className="text-sm text-muted-foreground">
          Grant super admin access to another user using their Account ID (found under Security in their Settings).
        </p>
      </div>

      <form onSubmit={handleGrant} className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <label htmlFor="grant-user-id" className="text-sm font-medium">
            Account ID
          </label>
          <Input
            id="grant-user-id"
            type="text"
            placeholder="e.g. cln..."
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={grantMutation.isPending}>
          {grantMutation.isPending ? "Granting…" : "Grant Super Admin"}
        </Button>
      </form>

      {grantError && <p className="text-sm text-destructive">{grantError}</p>}
      {grantSuccess && (
        <p className="text-sm text-green-600">Super admin access granted.</p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : superAdmins.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Account ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {superAdmins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>{admin.ownerEmail ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{admin.id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">No super admins yet.</p>
      )}
    </div>
  );
}
