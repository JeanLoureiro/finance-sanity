import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertyIncomeEntrySchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const GET = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings();
    const property = await prisma.property.findUnique({ where: { id }, select: { settingsId: true } });
    if (!property) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(property.settingsId, authorisedSettings);
    const entries = await prisma.propertyIncomeEntry.findMany({
      where: { propertyId: id },
      orderBy: { date: "desc" },
    });
    return Response.json(entries);
  } catch {
    return Response.json({ error: "Failed to load income entries" }, { status: 500 });
  }
});

export const POST = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const property = await prisma.property.findUnique({ where: { id }, select: { settingsId: true } });
    if (!property) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(property.settingsId, authorisedSettings);
    const body = await req.json();
    const parsed = propertyIncomeEntrySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const entry = await prisma.propertyIncomeEntry.create({
      data: {
        propertyId: id,
        date: new Date(parsed.data.date),
        grossRent: parsed.data.grossRent,
        frequency: parsed.data.frequency,
        notes: parsed.data.notes ?? null,
      },
    });
    return Response.json(entry, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create income entry" }, { status: 500 });
  }
});
