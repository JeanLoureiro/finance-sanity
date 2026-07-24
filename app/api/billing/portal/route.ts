import { getAuthorisedSettings, withAuth } from "@/lib/auth";
import { createBillingPortalSession } from "@/lib/billing";

export const POST = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings("OWNER");
    const url = await createBillingPortalSession(settingsId);
    return Response.json({ url });
  } catch {
    return Response.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
});
