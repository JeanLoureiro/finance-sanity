import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { otherAssetSchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.otherAsset.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
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
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.otherAsset.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    await prisma.otherAsset.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete asset" }, { status: 500 });
  }
});
