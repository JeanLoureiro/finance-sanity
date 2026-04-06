import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  amount: z.coerce.number().positive("Amount must be positive"),
  note: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payments = await prisma.loanExtraPayment.findMany({
      where: { loanId: id },
      orderBy: { date: "asc" },
    });
    return Response.json(
      payments.map((p) => ({ ...p, amount: Number(p.amount) }))
    );
  } catch {
    return Response.json({ error: "Failed to load payments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = paymentSchema.safeParse(body);
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
}
