import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dividendSchema } from "@/lib/schemas";

async function getSettingsId() {
  const s = await prisma.userSettings.findFirst();
  if (!s) throw new Error("No settings found");
  return s.id;
}

export async function GET() {
  try {
    const settingsId = await getSettingsId();
    const dividends = await prisma.dividend.findMany({
      where: { settingsId },
      orderBy: { paymentDate: "desc" },
    });
    return Response.json(dividends);
  } catch {
    return Response.json({ error: "Failed to load dividends" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = dividendSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const settingsId = await getSettingsId();
    const dividend = await prisma.dividend.create({
      data: {
        settingsId,
        paymentDate: new Date(parsed.data.paymentDate),
        ticker: parsed.data.ticker,
        holdingType: parsed.data.holdingType,
        exDividendDate: parsed.data.exDividendDate ? new Date(parsed.data.exDividendDate) : null,
        reinvested: parsed.data.reinvested,
        netAmount: parsed.data.netAmount,
        priceAtDividend: parsed.data.priceAtDividend ?? null,
      },
    });
    return Response.json(dividend, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create dividend" }, { status: 500 });
  }
}
