import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = propertySchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { purchaseDate, mortgageStartDate, equityLoanStartDate, ...rest } = parsed.data;
    const property = await prisma.property.update({
      where: { id },
      data: {
        ...rest,
        ...(purchaseDate ? { purchaseDate: new Date(purchaseDate) } : {}),
        ...(mortgageStartDate !== undefined ? { mortgageStartDate: mortgageStartDate ? new Date(mortgageStartDate) : null } : {}),
        ...(equityLoanStartDate !== undefined ? { equityLoanStartDate: equityLoanStartDate ? new Date(equityLoanStartDate) : null } : {}),
      },
    });
    return Response.json(property);
  } catch {
    return Response.json({ error: "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.property.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete property" }, { status: 500 });
  }
}
