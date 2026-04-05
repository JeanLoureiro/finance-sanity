import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bankAccountSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = bankAccountSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const account = await prisma.bankAccount.update({
      where: { id },
      data: parsed.data,
    });
    return Response.json(account);
  } catch {
    return Response.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.bankAccount.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
