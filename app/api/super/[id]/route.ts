import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { superAccountSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = superAccountSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const account = await prisma.superAccount.update({ where: { id }, data: parsed.data });
    return Response.json(account);
  } catch {
    return Response.json({ error: "Failed to update super account" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.superAccount.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete super account" }, { status: 500 });
  }
}
