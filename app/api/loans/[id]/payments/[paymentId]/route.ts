import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    await prisma.loanExtraPayment.delete({ where: { id: paymentId } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
