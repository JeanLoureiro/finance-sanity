import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/schemas";

// We use a single UserSettings row — get or create it
async function getOrCreateSettings() {
  const existing = await prisma.userSettings.findFirst();
  if (existing) return existing;

  return prisma.userSettings.create({
    data: {
      salary: 0,
      netIncome: 0,
    },
  });
}

export async function GET() {
  try {
    const settings = await getOrCreateSettings();
    return Response.json(settings);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = settingsSchema.partial().safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await getOrCreateSettings();
    const updated = await prisma.userSettings.update({
      where: { id: settings.id },
      data: parsed.data as Parameters<typeof prisma.userSettings.update>[0]["data"],
    });

    return Response.json(updated);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
