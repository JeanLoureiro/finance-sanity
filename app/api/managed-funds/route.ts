import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { managedFundHoldingSchema } from "@/lib/schemas";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";


export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
    const holdings = await prisma.managedFundHolding.findMany({
      where: { settingsId },
      include: { purchases: { orderBy: { date: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    return Response.json(holdings);
  } catch {
    return Response.json({ error: "Failed to load managed funds" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = managedFundHoldingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { settingsId } = await getAuthorisedSettings("WRITE");
    const holding = await prisma.managedFundHolding.create({
      data: { ...parsed.data, settingsId },
    });
    return Response.json(holding, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create managed fund" }, { status: 500 });
  }
});
