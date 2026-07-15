import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { grantSuperAdminSchema } from "@/lib/schemas";
import { getAuthorisedSuperAdmin, withAuth } from "@/lib/auth";

export const GET = withAuth(async () => {
  try {
    await getAuthorisedSuperAdmin();
    const superAdmins = await prisma.userSettings.findMany({
      where: { isSuperAdmin: true },
      select: { id: true, ownerEmail: true },
      orderBy: { ownerEmail: "asc" },
    });
    return Response.json(superAdmins);
  } catch {
    return Response.json({ error: "Failed to load super admins" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    await getAuthorisedSuperAdmin();
    const body = await req.json();
    const parsed = grantSuperAdminSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const target = await prisma.userSettings.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true },
    });
    if (!target) {
      return Response.json({ error: "No account found with that ID" }, { status: 404 });
    }
    const updated = await prisma.userSettings.update({
      where: { id: target.id },
      data: { isSuperAdmin: true },
      select: { id: true, ownerEmail: true },
    });
    return Response.json(updated, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to grant super admin" }, { status: 500 });
  }
});
