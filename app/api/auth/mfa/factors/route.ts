import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const verifiedTotpFactor = data.totp.find(
    (factor) => factor.status === "verified"
  );

  return Response.json({
    enrolled: !!verifiedTotpFactor,
    factorId: verifiedTotpFactor?.id ?? null,
  });
}
