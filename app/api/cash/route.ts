import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bankAccountSchema } from "@/lib/schemas";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";


export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
    const accounts = await prisma.bankAccount.findMany({
      where: { settingsId },
      orderBy: { sortOrder: "asc" },
    });
    return Response.json(
      accounts.map((a) => ({ ...a, balance: Number(a.balance) }))
    );
  } catch {
    return Response.json({ error: "Failed to load accounts" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = bankAccountSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { settingsId } = await getAuthorisedSettings("WRITE");
    const account = await prisma.bankAccount.create({
      data: { ...parsed.data, settingsId },
    });
    return Response.json({ ...account, balance: Number(account.balance) }, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create account" }, { status: 500 });
  }
});
