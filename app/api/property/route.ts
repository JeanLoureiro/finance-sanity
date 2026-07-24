import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/schemas";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";
import { getAccountEntitlements } from "@/lib/entitlements";


export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
    const properties = await prisma.property.findMany({
      where: { settingsId },
      orderBy: { sortOrder: "asc" },
    });
    return Response.json(properties);
  } catch {
    return Response.json({ error: "Failed to load properties" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = propertySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { settingsId } = await getAuthorisedSettings("WRITE");
    const entitlements = await getAccountEntitlements(settingsId);
    if (!entitlements.isActive) {
      const existingCount = await prisma.property.count({ where: { settingsId } });
      if (existingCount >= entitlements.limits.maxProperties) {
        return Response.json(
          { error: "Upgrade to Pro to add more properties" },
          { status: 402 }
        );
      }
    }
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
});
