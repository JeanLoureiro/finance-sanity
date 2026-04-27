import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Reads the verified user identity from the request headers injected by
 * proxy.ts middleware. The middleware calls getUser() once (server-side JWT
 * verification) and writes the result into x-user-id / x-user-email so that
 * server components never need a second Supabase network round-trip.
 *
 * React.cache() deduplicates within a single render tree — multiple server
 * components calling getAuthUser() share one header read per request.
 */
export const getAuthUser = cache(async () => {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const email = headersList.get("x-user-email");

  if (!userId) {
    return { data: { user: null }, error: new Error("Not authenticated") } as const;
  }

  return {
    data: { user: { id: userId, email: email ?? undefined } },
    error: null,
  } as const;
});

export type AuthorisedSettings = {
  settingsId: string;
  role: "OWNER" | "WRITE" | "READ";
};

export class AuthError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const roleHierarchy: Record<string, number> = { READ: 1, WRITE: 2, OWNER: 3 };

/**
 * Resolves the settings row for the currently authenticated user,
 * enforcing the required minimum role.
 *
 * Resolution order:
 *   1. User owns a UserSettings row (userId matches) → role = OWNER
 *   2. User has an ACCEPTED SharedAccess grant → role = grant.role
 *
 * Throws AuthError(401) if not authenticated.
 * Throws AuthError(403) if authenticated but not authorised.
 */
export const getAuthorisedSettings = cache(async (
  requiredRole: "READ" | "WRITE" | "OWNER" = "READ"
): Promise<AuthorisedSettings> => {
  const {
    data: { user },
    error,
  } = await getAuthUser();

  if (error || !user) {
    throw new AuthError(401, "Not authenticated");
  }

  const userId = user.id;

  // Check 1: Is this user the owner?
  const ownedSettings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (ownedSettings) {
    return { settingsId: ownedSettings.id, role: "OWNER" };
  }

  // Check 2: Does this user have an accepted SharedAccess grant?
  const grant = await prisma.sharedAccess.findFirst({
    where: {
      granteeUserId: userId,
      status: "ACCEPTED",
    },
    select: {
      ownerSettingsId: true,
      role: true,
    },
  });

  if (!grant) {
    throw new AuthError(403, "Access denied");
  }

  const grantedLevel = roleHierarchy[grant.role] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole] ?? 0;

  if (grantedLevel < requiredLevel) {
    throw new AuthError(403, "Insufficient permissions — write access required");
  }

  return {
    settingsId: grant.ownerSettingsId,
    role: grant.role as "READ" | "WRITE",
  };
});

/**
 * Verifies that a resource's settingsId matches the authorised settings row.
 * Use in [id]-scoped mutation routes to prevent cross-user manipulation.
 */
export function assertOwnership(
  resourceSettingsId: string,
  authorisedSettings: AuthorisedSettings
): void {
  if (resourceSettingsId !== authorisedSettings.settingsId) {
    throw new AuthError(403, "Resource does not belong to your account");
  }
}

/**
 * Wraps a Next.js route handler to catch AuthError and return the correct
 * HTTP response. Keeps individual routes clean.
 */
export function withAuth<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>
): (...args: TArgs) => Promise<Response> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AuthError) {
        return Response.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      throw error;
    }
  };
}
