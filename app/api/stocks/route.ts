import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { stockHoldingSchema } from "@/lib/schemas";

async function getSettingsId() {
  const s = await prisma.userSettings.findFirst();
  if (!s) throw new Error("No settings found");
  return s.id;
}

export async function GET() {
  try {
    const settingsId = await getSettingsId();
    const holdings = await prisma.stockHolding.findMany({
      where: { settingsId },
      include: { purchases: { orderBy: { date: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    return Response.json(holdings);
  } catch {
    return Response.json({ error: "Failed to load stocks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = stockHoldingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const settingsId = await getSettingsId();
    const holding = await prisma.stockHolding.create({
      data: { ...parsed.data, settingsId },
    });
    return Response.json(holding, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create stock" }, { status: 500 });
  }
}
