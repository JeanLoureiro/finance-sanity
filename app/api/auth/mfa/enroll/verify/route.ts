import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mfaEnrollVerifySchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = mfaEnrollVerifySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: parsed.data.factorId,
    code: parsed.data.code,
  });

  if (error) {
    return Response.json({ error: "Invalid code" }, { status: 401 });
  }

  return Response.json({ redirectTo: "/dashboard" });
}
