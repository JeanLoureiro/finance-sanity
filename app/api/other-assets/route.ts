import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { otherAssetSchema } from "@/lib/schemas";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";


export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
    const assets = await prisma.otherAsset.findMany({
      where: { settingsId },
      orderBy: { purchaseDate: "desc" },
    });
    return Response.json(assets);
  } catch {
    return Response.json({ error: "Failed to load other assets" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = otherAssetSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { settingsId } = await getAuthorisedSettings("WRITE");
    const asset = await prisma.otherAsset.create({
      data: {
        settingsId,
        description: parsed.data.description,
        purchaseDate: new Date(parsed.data.purchaseDate),
        units: parsed.data.units,
        currency: parsed.data.currency,
        unitPurchasePrice: parsed.data.unitPurchasePrice,
        liveUnitPrice: parsed.data.liveUnitPrice ?? null,
        soldUnits: parsed.data.soldUnits,
      },
    });
    return Response.json(asset, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create asset" }, { status: 500 });
  }
});
