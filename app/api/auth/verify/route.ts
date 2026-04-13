import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { z } from "zod";

const verifySchema = z.object({
  token: z.string().min(1),
});

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

  const { data, error: signInError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (signInError || !data.properties?.hashed_token) {
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: data.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError) {
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }

  return NextResponse.json({ redirectTo: "/net-worth" });
}
