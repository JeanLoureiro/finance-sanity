import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { otherAssetSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = otherAssetSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { purchaseDate, ...rest } = parsed.data;
    const asset = await prisma.otherAsset.update({
      where: { id },
      data: {
        ...rest,
        ...(purchaseDate ? { purchaseDate: new Date(purchaseDate) } : {}),
      },
    });
    return Response.json(asset);
  } catch {
    return Response.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.otherAsset.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
