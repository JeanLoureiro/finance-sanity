import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loanSchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.loan.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    const body = await req.json();
    const parsed = loanSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { startDate, ...rest } = Object.fromEntries(
      Object.entries(parsed.data).filter(([k]) => k in body)
    ) as typeof parsed.data;
    const loan = await prisma.loan.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
      },
    });
    return Response.json(loan);
  } catch {
    return Response.json({ error: "Failed to update loan" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.loan.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    await prisma.loan.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete loan" }, { status: 500 });
  }
});
