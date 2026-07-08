import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dividendSchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.dividend.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    const body = await req.json();
    const parsed = dividendSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { paymentDate, exDividendDate, ...rest } = parsed.data;
    const dividend = await prisma.dividend.update({
      where: { id },
      data: {
        ...rest,
        ...(paymentDate ? { paymentDate: new Date(paymentDate) } : {}),
        ...(exDividendDate !== undefined ? { exDividendDate: exDividendDate ? new Date(exDividendDate) : null } : {}),
      },
    });
    return Response.json({ ...dividend, netAmount: Number(dividend.netAmount), priceAtDividend: dividend.priceAtDividend ? Number(dividend.priceAtDividend) : null });
  } catch {
    return Response.json({ error: "Failed to update dividend" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.dividend.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    await prisma.dividend.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete dividend" }, { status: 500 });
  }
});
