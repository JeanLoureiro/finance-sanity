import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertyExpenseEntrySchema } from "@/lib/schemas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entries = await prisma.propertyExpenseEntry.findMany({
      where: { propertyId: id },
      orderBy: { date: "desc" },
    });
    return Response.json(entries);
  } catch {
    return Response.json({ error: "Failed to load expense entries" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = propertyExpenseEntrySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const entry = await prisma.propertyExpenseEntry.create({
      data: {
        propertyId: id,
        date: new Date(parsed.data.date),
        category: parsed.data.category,
        amount: parsed.data.amount,
        notes: parsed.data.notes ?? null,
      },
    });
    return Response.json(entry, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create expense entry" }, { status: 500 });
  }
}
