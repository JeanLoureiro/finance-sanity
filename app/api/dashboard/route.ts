import { getAuthorisedSettings, withAuth } from "@/lib/auth";
import { computeNetWorth } from "@/lib/netWorth";

export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
    const data = await computeNetWorth(settingsId);
    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to compute net worth" }, { status: 500 });
  }
});
