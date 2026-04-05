import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sideIncomeSchema } from "@/lib/schemas";

async function getSettingsId() {
  const s = await prisma.userSettings.findFirst();
  if (!s) throw new Error("No settings found");
  return s.id;
}

export async function GET() {
  try {
    const settingsId = await getSettingsId();
    const entries = await prisma.sideIncomeEntry.findMany({
      where: { settingsId },
      orderBy: { date: "desc" },
    });
    return Response.json(entries);
  } catch {
    return Response.json({ error: "Failed to load side income" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sideIncomeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const settingsId = await getSettingsId();
    const entry = await prisma.sideIncomeEntry.create({
      data: {
        settingsId,
        date: new Date(parsed.data.date),
        sideIncome: parsed.data.sideIncome,
        rentalIncome: parsed.data.rentalIncome,
        notes: parsed.data.notes ?? null,
      },
    });
    return Response.json(entry, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
