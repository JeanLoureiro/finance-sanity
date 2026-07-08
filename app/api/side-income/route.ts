import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sideIncomeSchema } from "@/lib/schemas";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";


export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
    const entries = await prisma.sideIncomeEntry.findMany({
      where: { settingsId },
      orderBy: { date: "desc" },
    });
    return Response.json(
      entries.map((e) => ({ ...e, sideIncome: Number(e.sideIncome), rentalIncome: Number(e.rentalIncome) }))
    );
  } catch {
    return Response.json({ error: "Failed to load side income" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = sideIncomeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { settingsId } = await getAuthorisedSettings("WRITE");
    const entry = await prisma.sideIncomeEntry.create({
      data: {
        settingsId,
        date: new Date(parsed.data.date),
        sideIncome: parsed.data.sideIncome,
        rentalIncome: parsed.data.rentalIncome,
        notes: parsed.data.notes ?? null,
      },
    });
    return Response.json({ ...entry, sideIncome: Number(entry.sideIncome), rentalIncome: Number(entry.rentalIncome) }, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create entry" }, { status: 500 });
  }
});
