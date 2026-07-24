import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { freeTierOverrideSchema } from "@/lib/schemas";
import { getAuthorisedSuperAdmin, withAuth } from "@/lib/auth";

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { settingsId } = await getAuthorisedSuperAdmin();
    const body = await req.json();
    const parsed = freeTierOverrideSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const updated = await prisma.userSettings.update({
      where: { id: settingsId },
      data: { superAdminFreeTierOverride: parsed.data.enabled },
      select: { superAdminFreeTierOverride: true },
    });
    return Response.json(updated);
  } catch {
    return Response.json({ error: "Failed to update free tier override" }, { status: 500 });
  }
});
