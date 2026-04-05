import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { budgetItemSchema } from "@/lib/schemas";

async function getSettingsId() {
  const s = await prisma.userSettings.findFirst();
  if (!s) throw new Error("No settings found");
  return s.id;
}

export async function GET() {
  try {
    const settingsId = await getSettingsId();
    const items = await prisma.budgetItem.findMany({
      where: { settingsId },
      orderBy: { sortOrder: "asc" },
    });
    return Response.json(
      items.map((i) => ({ ...i, monthlyAmount: Number(i.monthlyAmount) }))
    );
  } catch {
    return Response.json({ error: "Failed to load budget" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = budgetItemSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const settingsId = await getSettingsId();
    const item = await prisma.budgetItem.create({
      data: { ...parsed.data, settingsId },
    });
    return Response.json({ ...item, monthlyAmount: Number(item.monthlyAmount) }, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create budget item" }, { status: 500 });
  }
}
