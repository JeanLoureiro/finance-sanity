import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["READ", "WRITE"]),
});

export const GET = withAuth(async () => {
  const { settingsId } = await getAuthorisedSettings("OWNER");
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
    },
  });
  return Response.json(grants);
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

  // Send invitation email via Supabase Admin API
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      redirectTo: `${appUrl}/accept-invite?token=${grant.token}`,
    }
  );

  if (inviteError) {
    // Roll back the grant if the email fails
    await prisma.sharedAccess.delete({ where: { id: grant.id } });
    
    // Handle rate limiting specifically
    if (inviteError.message?.includes('429') || inviteError.message?.toLowerCase().includes('rate limit')) {
      return Response.json(
        { 
          error: "Rate limit exceeded. Please wait a few minutes before sending another invitation.",
          detail: inviteError.message 
        },
        { status: 429 }
      );
    }
    
    return Response.json(
      { error: "Failed to send invitation email", detail: inviteError.message },
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
