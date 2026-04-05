import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { purchaseSchema } from "@/lib/schemas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchases = await prisma.stockPurchase.findMany({
      where: { holdingId: id },
      orderBy: { date: "asc" },
    });
    return Response.json(purchases);
  } catch {
    return Response.json({ error: "Failed to load purchases" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const purchase = await prisma.stockPurchase.create({
      data: {
        holdingId: id,
        date: new Date(parsed.data.date),
        units: parsed.data.units,
        price: parsed.data.price,
        brokerage: parsed.data.brokerage,
        direction: parsed.data.direction,
      },
    });
    return Response.json(purchase, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
