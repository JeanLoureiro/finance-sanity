import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { managedFundHoldingSchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.managedFundHolding.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    const body = await req.json();
    const parsed = managedFundHoldingSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const holding = await prisma.managedFundHolding.update({ where: { id }, data: parsed.data });
    return Response.json(holding);
  } catch {
    return Response.json({ error: "Failed to update managed fund" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.managedFundHolding.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    await prisma.managedFundHolding.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete managed fund" }, { status: 500 });
  }
});
