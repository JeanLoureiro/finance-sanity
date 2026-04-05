import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { stockHoldingSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = stockHoldingSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const holding = await prisma.stockHolding.update({ where: { id }, data: parsed.data });
    return Response.json(holding);
  } catch {
    return Response.json({ error: "Failed to update stock" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.stockHolding.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete stock" }, { status: 500 });
  }
}
