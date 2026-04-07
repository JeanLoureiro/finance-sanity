import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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
