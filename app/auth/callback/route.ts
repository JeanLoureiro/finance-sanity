import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const next = searchParams.get("next") ?? "/net-worth";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (token) {
    const { valid, email, error } = await verifyOTP(token);
    
    if (!valid || !email) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error || "invalid_token")}`);
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error: signInError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (signInError || !data.properties?.hashed_token) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: data.properties.hashed_token,
      type: "magiclink",
    });

    if (!verifyError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
