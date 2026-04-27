import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";

export const POST = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) => {
  try {
    const { token } = await params;
    const { settingsId } = await getAuthorisedSettings("OWNER");

    const grant = await prisma.sharedAccess.findUnique({
      where: { token },
      select: {
        id: true,
        ownerSettingsId: true,
        granteeEmail: true,
        ownerEmail: true,
        role: true,
        status: true,
        token: true,
      },
    });

    if (!grant) {
      return Response.json({ error: "Invite not found" }, { status: 404 });
    }

    if (grant.ownerSettingsId !== settingsId) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    if (grant.status !== "PENDING") {
      return Response.json(
        { error: "Can only resend pending invitations" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const inviteLink = `${appUrl}/accept-invite?token=${grant.token}`;

    const { success, error: emailError } = await sendInvitationEmail(
      grant.granteeEmail,
      grant.ownerEmail,
      inviteLink,
      grant.role
    );

    if (!success) {
      return Response.json(
        { error: "Failed to resend invitation email", detail: emailError },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to resend invite" }, { status: 500 });
  }
});
