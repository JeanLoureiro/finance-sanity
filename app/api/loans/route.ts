import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loanSchema } from "@/lib/schemas";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";


export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
    const loans = await prisma.loan.findMany({
      where: { settingsId },
      orderBy: { startDate: "asc" },
    });
    return Response.json(loans);
  } catch {
    return Response.json({ error: "Failed to load loans" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = loanSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { settingsId } = await getAuthorisedSettings("WRITE");
    const loan = await prisma.loan.create({
      data: {
        settingsId,
        name: parsed.data.name,
        startDate: new Date(parsed.data.startDate),
        interestFrequency: parsed.data.interestFrequency,
        annualRate: parsed.data.annualRate,
        regularPayment: parsed.data.regularPayment,
        startingBalance: parsed.data.startingBalance,
        adminFee: parsed.data.adminFee,
      },
    });
    return Response.json(loan, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create loan" }, { status: 500 });
  }
});
