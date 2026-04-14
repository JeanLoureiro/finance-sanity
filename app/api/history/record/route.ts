import { eomonth } from "@/lib/finance";
import { recordSnapshotForSettings } from "@/lib/snapshotService";
import { getAuthorisedSettings, withAuth } from "@/lib/auth";

export const POST = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings("WRITE");
    const snapshot = await recordSnapshotForSettings(settingsId, eomonth(new Date()));
    return Response.json({ success: true, snapshot });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to record month" }, { status: 500 });
  }
});
