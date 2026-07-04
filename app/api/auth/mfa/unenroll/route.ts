import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mfaUnenrollSchema } from "@/lib/schemas";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = mfaUnenrollSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({
    factorId: parsed.data.factorId,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
});
