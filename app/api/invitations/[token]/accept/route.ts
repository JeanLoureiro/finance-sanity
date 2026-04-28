import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthUser, withAuth } from "@/lib/auth";

export const POST = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) => {
  try {
    const { token } = await params;
    const {
      data: { user },
    } = await getAuthUser();

    const grant = await prisma.sharedAccess.findUnique({
      where: { token },
      select: { id: true, granteeEmail: true, status: true, ownerSettingsId: true },
    });

    if (!grant || grant.status !== "PENDING") {
      return Response.json(
        { error: "Invite not found or already used" },
        { status: 404 }
      );
    }

    if (grant.granteeEmail.toLowerCase() !== user!.email?.toLowerCase()) {
      return Response.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      );
    }

    await prisma.sharedAccess.update({
      where: { id: grant.id },
      data: { status: "ACCEPTED", granteeUserId: user!.id },
    });

    // Auto-switch the active context to the newly accepted shared settings.
    const cookieStore = await cookies();
    cookieStore.set("fs-active-context", grant.ownerSettingsId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return Response.json({ ownerSettingsId: grant.ownerSettingsId });
  } catch {
    return Response.json({ error: "Failed to accept invite" }, { status: 500 });
  }
});
