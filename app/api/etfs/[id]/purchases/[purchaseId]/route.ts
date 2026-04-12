import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; purchaseId: string }> }
) => {
  try {
    const { purchaseId } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const purchase = await prisma.eTFPurchase.findUnique({
      where: { id: purchaseId },
      include: { holding: { select: { settingsId: true } } },
    });
    if (!purchase) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(purchase.holding.settingsId, authorisedSettings);
    await prisma.eTFPurchase.delete({ where: { id: purchaseId } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete purchase" }, { status: 500 });
  }
});
