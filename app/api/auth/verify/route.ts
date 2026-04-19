import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { verifyOTP, consumeOTP } from "@/lib/otp";
import { verifySchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { valid, email, error } = await verifyOTP(parsed.data.token);

  if (!valid || !email) {
    return Response.json(
      { error: error || "Invalid or expired token" },
      { status: 401 }
    );
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Generate a Supabase magic link token for this email (gets/creates the user)
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData.properties?.hashed_token) {
    console.error("generateLink error:", linkError);
    return Response.json({ error: "Failed to generate auth token" }, { status: 500 });
  }

  // Verify the hashed token via the SSR client — this sets the session cookies
  // Note: hashed tokens use token_hash, not the email+token form
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError) {
    console.error("verifyOtp error:", verifyError);
    return Response.json({ error: "Failed to establish session" }, { status: 500 });
  }

  await consumeOTP(parsed.data.token);

  return NextResponse.json({ redirectTo: "/net-worth" });
}
