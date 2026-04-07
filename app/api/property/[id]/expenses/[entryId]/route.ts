import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertyExpenseEntrySchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;
    const body = await req.json();
    const parsed = propertyExpenseEntrySchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { date, ...rest } = parsed.data;
    const entry = await prisma.propertyExpenseEntry.update({
      where: { id: entryId },
      data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    });
    return Response.json(entry);
  } catch (e) {
    console.error("[PATCH /api/property/[id]/expenses/[entryId]]", e);
    return Response.json({ error: "Failed to update expense entry" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;
    await prisma.propertyExpenseEntry.delete({ where: { id: entryId } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete expense entry" }, { status: 500 });
  }
}
