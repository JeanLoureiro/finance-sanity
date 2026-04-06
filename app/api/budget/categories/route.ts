import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { budgetCategorySchema } from "@/lib/schemas";

const DEFAULT_CATEGORIES = [
  "Vehicle",
  "Bills",
  "Mortgage",
  "Kids",
  "Groceries",
  "Health",
  "Insurance",
  "Subscriptions",
  "Transport",
  "Entertainment",
  "Education",
  "Travel",
  "General",
];

async function getSettingsId() {
  const s = await prisma.userSettings.findFirst();
  if (!s) throw new Error("No settings found");
  return s.id;
}

export async function GET() {
  try {
    const settingsId = await getSettingsId();
    let categories = await prisma.budgetCategory.findMany({
      where: { settingsId },
      orderBy: { sortOrder: "asc" },
    });
    if (categories.length === 0) {
      categories = await prisma.$transaction(
        DEFAULT_CATEGORIES.map((name, i) =>
          prisma.budgetCategory.create({ data: { settingsId, name, sortOrder: i } })
        )
      );
    }
    return Response.json(categories);
  } catch {
    return Response.json({ error: "Failed to load budget categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = budgetCategorySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const settingsId = await getSettingsId();
    const count = await prisma.budgetCategory.count({ where: { settingsId } });
    const category = await prisma.budgetCategory.create({
      data: { ...parsed.data, settingsId, sortOrder: parsed.data.sortOrder ?? count },
    });
    return Response.json(category, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create budget category" }, { status: 500 });
  }
}
