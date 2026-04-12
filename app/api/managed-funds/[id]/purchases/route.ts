import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { purchaseSchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const GET = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings();
    const holding = await prisma.managedFundHolding.findUnique({ where: { id }, select: { settingsId: true } });
    if (!holding) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(holding.settingsId, authorisedSettings);
    const purchases = await prisma.managedFundPurchase.findMany({
      where: { holdingId: id },
      orderBy: { date: "asc" },
    });
    return Response.json(purchases);
  } catch {
    return Response.json({ error: "Failed to load purchases" }, { status: 500 });
  }
});

export const POST = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const holding = await prisma.managedFundHolding.findUnique({ where: { id }, select: { settingsId: true } });
    if (!holding) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(holding.settingsId, authorisedSettings);
    const body = await req.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const purchase = await prisma.managedFundPurchase.create({
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
});
