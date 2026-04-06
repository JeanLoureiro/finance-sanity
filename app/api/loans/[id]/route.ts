import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loanSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = loanSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { startDate, ...rest } = Object.fromEntries(
      Object.entries(parsed.data).filter(([k]) => k in body)
    ) as typeof parsed.data;
    const loan = await prisma.loan.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
      },
    });
    return Response.json(loan);
  } catch {
    return Response.json({ error: "Failed to update loan" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.loan.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete loan" }, { status: 500 });
  }
}
