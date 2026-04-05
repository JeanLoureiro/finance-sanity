import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loanSchema } from "@/lib/schemas";

async function getSettingsId() {
  const s = await prisma.userSettings.findFirst();
  if (!s) throw new Error("No settings found");
  return s.id;
}

export async function GET() {
  try {
    const settingsId = await getSettingsId();
    const loans = await prisma.loan.findMany({
      where: { settingsId },
      orderBy: { startDate: "asc" },
    });
    return Response.json(loans);
  } catch {
    return Response.json({ error: "Failed to load loans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loanSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const settingsId = await getSettingsId();
    const loan = await prisma.loan.create({
      data: {
        settingsId,
        name: parsed.data.name,
        startDate: new Date(parsed.data.startDate),
        interestFrequency: parsed.data.interestFrequency,
        annualRate: parsed.data.annualRate,
        regularPayment: parsed.data.regularPayment,
        startingBalance: parsed.data.startingBalance,
      },
    });
    return Response.json(loan, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create loan" }, { status: 500 });
  }
}
