import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsBaseSchema } from "@/lib/schemas";

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
    console.log("PATCH /api/settings body keys:", Object.keys(body));
    console.log("PATCH /api/settings body sample:", JSON.stringify({ salary: body.salary, jobStartDate: body.jobStartDate, etfAllocation: body.etfAllocation }));
    const parsed = settingsBaseSchema.partial().safeParse(body);

    if (!parsed.success) {
      console.error("PATCH /api/settings validation error:", JSON.stringify(parsed.error.flatten()));
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    console.log("PATCH /api/settings parsed OK, keys:", Object.keys(parsed.data));

    const settings = await getOrCreateSettings();

    const patchData = {
      ...parsed.data,
    } as Parameters<typeof prisma.userSettings.update>[0]["data"];

    if ("jobStartDate" in patchData) {
      const value = patchData.jobStartDate;

      if (value === undefined || value === "" || value === null) {
        patchData.jobStartDate = null;
      } else {
        const date = new Date(value as string | number | Date);
        if (Number.isNaN(date.getTime())) {
          return Response.json(
            { error: "Validation failed", issues: { fieldErrors: { jobStartDate: ["Invalid date"] } } },
            { status: 400 }
          );
        }
        patchData.jobStartDate = date;
      }
    }

    const updated = await prisma.userSettings.update({
      where: { id: settings.id },
      data: patchData,
    });

    return Response.json(updated);
  } catch (err: unknown) {
    console.error("PATCH /api/settings error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "Failed to save settings", detail: message }, { status: 500 });
  }
}
