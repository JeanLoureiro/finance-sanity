import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/schemas";

async function getSettingsId() {
  const s = await prisma.userSettings.findFirst();
  if (!s) throw new Error("No settings found");
  return s.id;
}

export async function GET() {
  try {
    const settingsId = await getSettingsId();
    const properties = await prisma.property.findMany({
      where: { settingsId },
      orderBy: { sortOrder: "asc" },
    });
    return Response.json(properties);
  } catch {
    return Response.json({ error: "Failed to load properties" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = propertySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const settingsId = await getSettingsId();
    const property = await prisma.property.create({
      data: {
        settingsId,
        name: parsed.data.name,
        purchaseDate: new Date(parsed.data.purchaseDate),
        isPrimaryResidence: parsed.data.isPrimaryResidence,
        purchaseValue: parsed.data.purchaseValue,
        currentValue: parsed.data.currentValue,
        netRentProfit: parsed.data.netRentProfit,
        mortgageStartDate: parsed.data.mortgageStartDate ? new Date(parsed.data.mortgageStartDate) : null,
        mortgageAnnualRate: parsed.data.mortgageAnnualRate ?? null,
        mortgageMonthlyPayment: parsed.data.mortgageMonthlyPayment ?? null,
        mortgageStartBalance: parsed.data.mortgageStartBalance ?? null,
        mortgageCurrentBalance: parsed.data.mortgageCurrentBalance ?? null,
        mortgagePaymentFrequency: parsed.data.mortgagePaymentFrequency ?? "monthly",
        equityLoanStartDate: parsed.data.equityLoanStartDate ? new Date(parsed.data.equityLoanStartDate) : null,
        equityLoanAnnualRate: parsed.data.equityLoanAnnualRate ?? null,
        equityLoanStartBalance: parsed.data.equityLoanStartBalance ?? null,
        equityLoanCurrentBalance: parsed.data.equityLoanCurrentBalance ?? null,
        equityLoanMonthlyPayment: parsed.data.equityLoanMonthlyPayment ?? null,
        equityLoanPaymentFrequency: parsed.data.equityLoanPaymentFrequency ?? "monthly",
      },
    });
    return Response.json(property, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create property" }, { status: 500 });
  }
}
