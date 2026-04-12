import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) => {
  try {
    const { paymentId } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const payment = await prisma.loanExtraPayment.findUnique({
      where: { id: paymentId },
      include: { loan: { select: { settingsId: true } } },
    });
    if (!payment) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(payment.loan.settingsId, authorisedSettings);
    await prisma.loanExtraPayment.delete({ where: { id: paymentId } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete payment" }, { status: 500 });
  }
});
