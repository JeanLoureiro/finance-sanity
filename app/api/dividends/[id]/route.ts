import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dividendSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = dividendSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { paymentDate, exDividendDate, ...rest } = parsed.data;
    const dividend = await prisma.dividend.update({
      where: { id },
      data: {
        ...rest,
        ...(paymentDate ? { paymentDate: new Date(paymentDate) } : {}),
        ...(exDividendDate !== undefined ? { exDividendDate: exDividendDate ? new Date(exDividendDate) : null } : {}),
      },
    });
    return Response.json(dividend);
  } catch {
    return Response.json({ error: "Failed to update dividend" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.dividend.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete dividend" }, { status: 500 });
  }
}
