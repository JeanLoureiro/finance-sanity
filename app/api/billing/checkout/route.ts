import { NextRequest } from "next/server";
import { checkoutSchema } from "@/lib/schemas";
import { getAuthorisedSettings, getAuthUser, withAuth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/billing";

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { settingsId } = await getAuthorisedSettings("OWNER");
    const {
      data: { user },
    } = await getAuthUser();
    const url = await createCheckoutSession(settingsId, parsed.data.priceId, user?.email);
    return Response.json({ url });
  } catch {
    return Response.json({ error: "Failed to start checkout" }, { status: 500 });
  }
});
