import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { budgetTypeSchema } from "@/lib/schemas";

const DEFAULT_TYPES = [
  "Fixed Costs",
  "Splurge",
  "Extras",
  "Savings",
  "Investments",
];

async function getSettingsId() {
  const s = await prisma.userSettings.findFirst();
  if (!s) throw new Error("No settings found");
  return s.id;
}

export async function GET() {
  try {
    const settingsId = await getSettingsId();
    let types = await prisma.budgetType.findMany({
      where: { settingsId },
      orderBy: { sortOrder: "asc" },
    });
    if (types.length === 0) {
      types = await prisma.$transaction(
        DEFAULT_TYPES.map((name, i) =>
          prisma.budgetType.create({ data: { settingsId, name, sortOrder: i } })
        )
      );
    }
    return Response.json(types);
  } catch {
    return Response.json({ error: "Failed to load budget types" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = budgetTypeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const settingsId = await getSettingsId();
    const count = await prisma.budgetType.count({ where: { settingsId } });
    const type = await prisma.budgetType.create({
      data: { ...parsed.data, settingsId, sortOrder: parsed.data.sortOrder ?? count },
    });
    return Response.json(type, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create budget type" }, { status: 500 });
  }
}
