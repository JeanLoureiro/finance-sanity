import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dividendSchema } from "@/lib/schemas";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";


export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
    const dividends = await prisma.dividend.findMany({
      where: { settingsId },
      orderBy: { paymentDate: "desc" },
    });
    return Response.json(
      dividends.map((d) => ({ ...d, netAmount: Number(d.netAmount), priceAtDividend: d.priceAtDividend ? Number(d.priceAtDividend) : null }))
    );
  } catch {
    return Response.json({ error: "Failed to load dividends" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = dividendSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { settingsId } = await getAuthorisedSettings("WRITE");
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
    return Response.json({ ...dividend, netAmount: Number(dividend.netAmount), priceAtDividend: dividend.priceAtDividend ? Number(dividend.priceAtDividend) : null }, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create dividend" }, { status: 500 });
  }
});
