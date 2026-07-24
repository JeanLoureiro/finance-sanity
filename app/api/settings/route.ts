import { NextRequest } from "next/server";
import { settingsBaseSchema } from "@/lib/schemas";
import { getAuthUser, getAuthorisedSettings, withAuth } from "@/lib/auth";
import { getOrCreateSettingsForUser } from "@/lib/userSettings";
import { prisma } from "@/lib/prisma";
import { computeEntitlements } from "@/lib/entitlements";

export const GET = withAuth(async () => {
  const {
    data: { user },
  } = await getAuthUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Ensure the user's own UserSettings row exists (idempotent).
  // This runs before getAuthorisedSettings so the cache entry is populated
  // with the freshly-created row when the active context is the user's own.
  await getOrCreateSettingsForUser(user.id, user.email ?? "");

  const { settingsId } = await getAuthorisedSettings("READ");
  const settings = await prisma.userSettings.findUnique({ where: { id: settingsId } });
  if (!settings) {
    return Response.json({ error: "Settings not found" }, { status: 404 });
  }
  // Limits (e.g. Infinity for unlimited on Pro) aren't JSON-serialisable and
  // aren't needed for display — gating routes call getAccountEntitlements
  // directly. Only expose the plan/status fields the Billing UI displays.
  const { tier, isActive, isTrialing, trialDaysRemaining } = computeEntitlements(settings);
  return Response.json({ ...settings, entitlements: { tier, isActive, isTrialing, trialDaysRemaining } });
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
