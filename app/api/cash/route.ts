import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bankAccountSchema } from "@/lib/schemas";

async function getSettingsId() {
  const s = await prisma.userSettings.findFirst();
  if (!s) throw new Error("No settings found");
  return s.id;
}

export async function GET() {
  try {
    const settingsId = await getSettingsId();
    const accounts = await prisma.bankAccount.findMany({
      where: { settingsId },
      orderBy: { sortOrder: "asc" },
    });
    return Response.json(accounts);
  } catch {
    return Response.json({ error: "Failed to load accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bankAccountSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const settingsId = await getSettingsId();
    const account = await prisma.bankAccount.create({
      data: { ...parsed.data, settingsId },
    });
    return Response.json(account, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create account" }, { status: 500 });
  }
}
