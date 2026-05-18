import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loanPaymentSchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (
  req: NextRequest,
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
    const body = await req.json();
    const parsed = loanPaymentSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const updated = await prisma.loanExtraPayment.update({
      where: { id: paymentId },
      data: {
        ...(parsed.data.date !== undefined && { date: new Date(parsed.data.date) }),
        ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
        ...(parsed.data.note !== undefined && { note: parsed.data.note }),
      },
    });
    return Response.json(updated);
  } catch {
    return Response.json({ error: "Failed to update payment" }, { status: 500 });
  }
});

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
