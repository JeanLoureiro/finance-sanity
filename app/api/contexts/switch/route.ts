import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthUser, withAuth } from "@/lib/auth";

export const POST = withAuth(async (req: NextRequest) => {
  const {
    data: { user },
  } = await getAuthUser();

  const body = await req.json();
  const settingsId: unknown = body.settingsId;

  if (!settingsId || typeof settingsId !== "string") {
    return Response.json({ error: "settingsId is required" }, { status: 400 });
  }

  // Validate the requesting user has access to this settingsId.
  const [isOwner, isGrantee] = await Promise.all([
    prisma.userSettings.findUnique({
      where: { id: settingsId, userId: user!.id },
      select: { id: true },
    }),
    prisma.sharedAccess.findFirst({
      where: {
        ownerSettingsId: settingsId,
        granteeUserId: user!.id,
        status: "ACCEPTED",
      },
      select: { id: true },
    }),
  ]);

  if (!isOwner && !isGrantee) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set("fs-active-context", settingsId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return Response.json({ settingsId });
});
