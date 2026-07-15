import { cache } from "react";
import { headers, cookies } from "next/headers";
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
 *   1. Cookie `fs-active-context` (settingsId) — validated against ownership
 *      or an ACCEPTED SharedAccess grant before being used. Silently ignored
 *      when stale (e.g. access was revoked).
 *   2. User owns a UserSettings row (userId matches) → role = OWNER
 *   3. User has an ACCEPTED SharedAccess grant → role = grant.role
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

  // Check the active-context cookie first.
  const cookieStore = await cookies();
  const activeContextId = cookieStore.get("fs-active-context")?.value;

  if (activeContextId) {
    // Validate: does this user own the requested settings row?
    const ownedByUser = await prisma.userSettings.findUnique({
      where: { id: activeContextId, userId },
      select: { id: true },
    });

    if (ownedByUser) {
      // OWNER role satisfies any required role.
      return { settingsId: ownedByUser.id, role: "OWNER" };
    }

    // Validate: is this user an accepted grantee for the requested settings?
    const grantForContext = await prisma.sharedAccess.findFirst({
      where: {
        ownerSettingsId: activeContextId,
        granteeUserId: userId,
        status: "ACCEPTED",
      },
      select: { ownerSettingsId: true, role: true },
    });

    if (grantForContext) {
      const grantedLevel = roleHierarchy[grantForContext.role] ?? 0;
      const requiredLevel = roleHierarchy[requiredRole] ?? 0;
      if (grantedLevel < requiredLevel) {
        throw new AuthError(403, "Insufficient permissions — write access required");
      }
      return {
        settingsId: grantForContext.ownerSettingsId,
        role: grantForContext.role as "READ" | "WRITE",
      };
    }

    // Cookie is stale or revoked — fall through to default resolution.
  }

  // Default resolution: own settings first, then any accepted grant.
  const ownedSettings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (ownedSettings) {
    return { settingsId: ownedSettings.id, role: "OWNER" };
  }

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
 * Resolves the UserSettings id of the currently authenticated user and
 * verifies they hold the super-admin flag.
 *
 * Throws AuthError(401) if not authenticated.
 * Throws AuthError(403) if authenticated but not a super admin.
 */
export const getAuthorisedSuperAdmin = cache(async (): Promise<{ settingsId: string }> => {
  const {
    data: { user },
    error,
  } = await getAuthUser();

  if (error || !user) {
    throw new AuthError(401, "Not authenticated");
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: { id: true, isSuperAdmin: true },
  });

  if (!settings?.isSuperAdmin) {
    throw new AuthError(403, "Super admin access required");
  }

  return { settingsId: settings.id };
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
