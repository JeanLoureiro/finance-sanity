import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; purchaseId: string }> }
) {
  try {
    const { purchaseId } = await params;
    await prisma.cryptoPurchase.delete({ where: { id: purchaseId } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete purchase" }, { status: 500 });
  }
}
