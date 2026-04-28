import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthUser, withAuth } from "@/lib/auth";

export const GET = withAuth(async () => {
  const {
    data: { user },
  } = await getAuthUser();

  const cookieStore = await cookies();
  const activeId = cookieStore.get("fs-active-context")?.value ?? null;

  const [ownSettings, grants] = await Promise.all([
    prisma.userSettings.findUnique({
      where: { userId: user!.id },
      select: { id: true, ownerEmail: true },
    }),
    prisma.sharedAccess.findMany({
      where: { granteeUserId: user!.id, status: "ACCEPTED" },
      select: { ownerSettingsId: true, ownerEmail: true, role: true },
    }),
  ]);

  const contexts: {
    settingsId: string;
    label: string;
    type: "OWNER" | "READ" | "WRITE";
    ownerEmail: string;
    isActive: boolean;
  }[] = [];

  if (ownSettings) {
    contexts.push({
      settingsId: ownSettings.id,
      label: "My Account",
      type: "OWNER",
      ownerEmail: ownSettings.ownerEmail ?? "",
      isActive: activeId === ownSettings.id || activeId === null,
    });
  }

  for (const grant of grants) {
    contexts.push({
      settingsId: grant.ownerSettingsId,
      label: `Shared by ${grant.ownerEmail}`,
      type: grant.role as "READ" | "WRITE",
      ownerEmail: grant.ownerEmail,
      isActive: activeId === grant.ownerSettingsId,
    });
  }

  // If the cookie is stale (points to a context not in the list), clear it
  // and mark the first available context as active.
  const hasActive = contexts.some((context) => context.isActive);
  if (!hasActive && contexts.length > 0) {
    contexts[0].isActive = true;
    cookieStore.delete("fs-active-context");
  }

  return Response.json(contexts);
});
