import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";
import { updateInviteStatusSchema } from "@/lib/schemas";

// GET is public — no auth required (used by the accept-invite page before login)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const grant = await prisma.sharedAccess.findUnique({
      where: { token },
      select: {
        granteeEmail: true,
        ownerEmail: true,
        role: true,
        status: true,
      },
    });

    if (!grant || grant.status !== "PENDING") {
      return Response.json(
        { error: "Invite not found or already used" },
        { status: 404 }
      );
    }

    return Response.json({
      granteeEmail: grant.granteeEmail,
      ownerEmail: grant.ownerEmail,
      role: grant.role,
    });
  } catch {
    return Response.json({ error: "Failed to load invite" }, { status: 500 });
  }
}

// DELETE revokes the invite — owner only
export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) => {
  try {
    const { token } = await params;
    const { settingsId } = await getAuthorisedSettings("OWNER");

    const grant = await prisma.sharedAccess.findUnique({
      where: { token },
      select: { id: true, ownerSettingsId: true },
    });

    if (!grant) {
      return Response.json({ error: "Invite not found" }, { status: 404 });
    }

    if (grant.ownerSettingsId !== settingsId) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.sharedAccess.update({
      where: { token },
      data: { status: "REVOKED" },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to revoke invite" }, { status: 500 });
  }
});

// PATCH updates status of a revoked grant — owner only
export const PATCH = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) => {
  try {
    const { token } = await params;
    const { settingsId } = await getAuthorisedSettings("OWNER");

    const body = await req.json();
    const parsed = updateInviteStatusSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const grant = await prisma.sharedAccess.findUnique({
      where: { token },
      select: { id: true, ownerSettingsId: true, status: true, granteeUserId: true },
    });

    if (!grant) {
      return Response.json({ error: "Invite not found" }, { status: 404 });
    }

    if (grant.ownerSettingsId !== settingsId) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    if (grant.status !== "REVOKED") {
      return Response.json(
        { error: "Only revoked grants can have their status changed" },
        { status: 409 }
      );
    }

    if (parsed.data.status === "ACCEPTED" && grant.granteeUserId === "") {
      return Response.json(
        { error: "Cannot restore to accepted: user has never accepted the invitation" },
        { status: 422 }
      );
    }

    await prisma.sharedAccess.update({
      where: { token },
      data: { status: parsed.data.status },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to update invite status" }, { status: 500 });
  }
});
