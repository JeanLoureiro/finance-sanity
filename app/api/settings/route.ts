import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsBaseSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";

/**
 * Gets or creates the UserSettings row for the given Supabase user ID.
 * On first login after the multi-user migration is deployed, claims the
 * existing unlinked row rather than creating a fresh one.
 */
async function getOrCreateSettingsForUser(userId: string) {
  const linked = await prisma.userSettings.findUnique({ where: { userId } });
  if (linked) return linked;

  // Migration path: claim the unlinked legacy row if exactly one exists.
  const unlinked = await prisma.userSettings.findFirst({
    where: { userId: null },
  });
  if (unlinked) {
    return prisma.userSettings.update({
      where: { id: unlinked.id },
      data: { userId },
    });
  }

  return prisma.userSettings.create({ data: { userId, salary: 0, netIncome: 0 } });
}

export const GET = withAuth(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Grantees (shared access): return the owner's settings without creating rows.
  const authorisedSettings = await getAuthorisedSettings("READ").catch(
    () => null
  );

  if (authorisedSettings && authorisedSettings.role !== "OWNER") {
    const settings = await prisma.userSettings.findUnique({
      where: { id: authorisedSettings.settingsId },
    });
    if (!settings) {
      return Response.json({ error: "Settings not found" }, { status: 404 });
    }
    return Response.json({ ...settings, role: authorisedSettings.role });
  }

  // Owner path: get-or-create.
  const settings = await getOrCreateSettingsForUser(user.id);
  return Response.json({ ...settings, role: "OWNER" });
});

export const PATCH = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  console.log("PATCH /api/settings body keys:", Object.keys(body));
  console.log(
    "PATCH /api/settings body sample:",
    JSON.stringify({
      salary: body.salary,
      jobStartDate: body.jobStartDate,
      etfAllocation: body.etfAllocation,
    })
  );

  const parsed = settingsBaseSchema.partial().safeParse(body);
  if (!parsed.success) {
    console.error(
      "PATCH /api/settings validation error:",
      JSON.stringify(parsed.error.flatten())
    );
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  console.log("PATCH /api/settings parsed OK, keys:", Object.keys(parsed.data));

  const { settingsId } = await getAuthorisedSettings("WRITE");

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
          {
            error: "Validation failed",
            issues: { fieldErrors: { jobStartDate: ["Invalid date"] } },
          },
          { status: 400 }
        );
      }
      patchData.jobStartDate = date;
    }
  }

  const updated = await prisma.userSettings.update({
    where: { id: settingsId },
    data: patchData,
  });

  return Response.json(updated);
});
