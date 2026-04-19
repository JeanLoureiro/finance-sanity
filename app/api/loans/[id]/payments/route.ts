import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loanPaymentSchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const GET = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings();
    const loan = await prisma.loan.findUnique({ where: { id }, select: { settingsId: true } });
    if (!loan) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(loan.settingsId, authorisedSettings);
    const payments = await prisma.loanExtraPayment.findMany({
      where: { loanId: id },
      orderBy: { date: "asc" },
    });
    return Response.json(payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })));
  } catch {
    return Response.json({ error: "Failed to load payments" }, { status: 500 });
  }
});

export const POST = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const loan = await prisma.loan.findUnique({ where: { id }, select: { settingsId: true } });
    if (!loan) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(loan.settingsId, authorisedSettings);
    const body = await req.json();
    const parsed = loanPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const payment = await prisma.loanExtraPayment.create({
      data: {
        loanId: id,
        date: new Date(parsed.data.date),
        amount: parsed.data.amount,
        note: parsed.data.note ?? null,
      },
    });
    return Response.json({ ...payment, amount: Number(payment.amount) }, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to add payment" }, { status: 500 });
  }
});
