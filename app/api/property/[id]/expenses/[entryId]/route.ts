import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertyExpenseEntrySchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) => {
  try {
    const { entryId } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const entry = await prisma.propertyExpenseEntry.findUnique({
      where: { id: entryId },
      include: { property: { select: { settingsId: true } } },
    });
    if (!entry) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(entry.property.settingsId, authorisedSettings);
    const body = await req.json();
    const parsed = propertyExpenseEntrySchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { date, ...rest } = parsed.data;
    const updated = await prisma.propertyExpenseEntry.update({
      where: { id: entryId },
      data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    });
    return Response.json(updated);
  } catch (error) {
    console.error("[PATCH /api/property/[id]/expenses/[entryId]]", error);
    return Response.json({ error: "Failed to update expense entry" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) => {
  try {
    const { entryId } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const entry = await prisma.propertyExpenseEntry.findUnique({
      where: { id: entryId },
      include: { property: { select: { settingsId: true } } },
    });
    if (!entry) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(entry.property.settingsId, authorisedSettings);
    await prisma.propertyExpenseEntry.delete({ where: { id: entryId } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete expense entry" }, { status: 500 });
  }
});
