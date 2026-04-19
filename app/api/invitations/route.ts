import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";
import { inviteSchema } from "@/lib/schemas";

export const GET = withAuth(async () => {
  const { settingsId } = await getAuthorisedSettings("OWNER");
  console.log("settingsId", settingsId);
  const grants = await prisma.sharedAccess.findMany({
    where: { ownerSettingsId: settingsId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      granteeEmail: true,
      role: true,
      status: true,
      token: true,
      createdAt: true,
      granteeUserId: true,
    },
  });
  return Response.json(
    grants.map(({ granteeUserId, ...grant }) => ({
      ...grant,
      wasAccepted: granteeUserId !== "",
    }))
  );
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { settingsId } = await getAuthorisedSettings("OWNER");

  // Prevent duplicate active invites for the same email
  const existing = await prisma.sharedAccess.findFirst({
    where: {
      ownerSettingsId: settingsId,
      granteeEmail: parsed.data.email,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });
  if (existing) {
    return Response.json(
      { error: "An active invite already exists for this email" },
      { status: 409 }
    );
  }

  // Retrieve the owner's email for display on the accept page
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ownerEmail = user?.email ?? "";

  // Store owner email on UserSettings if not already set
  if (ownerEmail) {
    await prisma.userSettings.update({
      where: { id: settingsId },
      data: { ownerEmail },
    });
  }

  const grant = await prisma.sharedAccess.create({
    data: {
      ownerSettingsId: settingsId,
      granteeEmail: parsed.data.email,
      ownerEmail,
      role: parsed.data.role,
    },
  });

  // Send invitation email via Resend
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteLink = `${appUrl}/accept-invite?token=${grant.token}`;
  
  const { success, error: emailError } = await sendInvitationEmail(
    parsed.data.email,
    ownerEmail,
    inviteLink,
    parsed.data.role
  );

  if (!success) {
    // Roll back the grant if the email fails
    await prisma.sharedAccess.delete({ where: { id: grant.id } });
    
    return Response.json(
      { error: "Failed to send invitation email", detail: emailError },
      { status: 500 }
    );
  }

  return Response.json(
    {
      id: grant.id,
      granteeEmail: grant.granteeEmail,
      role: grant.role,
      status: grant.status,
      token: grant.token,
      createdAt: grant.createdAt,
    },
    { status: 201 }
  );
});
