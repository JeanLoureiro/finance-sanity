import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.property.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    const body = await req.json();
    const parsed = propertySchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { purchaseDate, mortgageStartDate, equityLoanStartDate, ...rest } = parsed.data;
    const property = await prisma.property.update({
      where: { id },
      data: {
        ...rest,
        ...(purchaseDate ? { purchaseDate: new Date(purchaseDate) } : {}),
        ...(mortgageStartDate !== undefined ? { mortgageStartDate: mortgageStartDate ? new Date(mortgageStartDate) : null } : {}),
        ...(equityLoanStartDate !== undefined ? { equityLoanStartDate: equityLoanStartDate ? new Date(equityLoanStartDate) : null } : {}),
      },
    });
    return Response.json(property);
  } catch (error) {
    console.error("[PATCH /api/property/[id]]", error);
    return Response.json({ error: "Failed to update property", detail: String(error) }, { status: 500 });
  }
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.property.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    await prisma.property.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete property" }, { status: 500 });
  }
});
