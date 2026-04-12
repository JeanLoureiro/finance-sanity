import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { budgetItemSchema } from "@/lib/schemas";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";


export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
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
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = budgetItemSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { settingsId } = await getAuthorisedSettings("WRITE");
    const item = await prisma.budgetItem.create({
      data: { ...parsed.data, settingsId },
    });
    return Response.json({ ...item, monthlyAmount: Number(item.monthlyAmount) }, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create budget item" }, { status: 500 });
  }
});
