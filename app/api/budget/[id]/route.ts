import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { budgetItemSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = budgetItemSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    // Only update fields that were explicitly sent — don't let Zod defaults overwrite existing values
    const data = Object.fromEntries(
      Object.entries(parsed.data).filter(([k]) => k in body)
    );
    const item = await prisma.budgetItem.update({ where: { id }, data });
    return Response.json({ ...item, monthlyAmount: Number(item.monthlyAmount) });
  } catch {
    return Response.json({ error: "Failed to update budget item" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.budgetItem.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete budget item" }, { status: 500 });
  }
}
