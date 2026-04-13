import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { verifyOTP, consumeOTP } from "@/lib/otp";
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

  // Get or create the Supabase user for this email
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData.user) {
    return Response.json({ error: "Failed to resolve user account" }, { status: 500 });
  }

  // Create a session directly — avoids PKCE verifier issues
  const { data: sessionData, error: sessionError } = await adminClient.auth.admin.createSession(
    linkData.user.id
  );

  if (sessionError || !sessionData.session) {
    return Response.json({ error: "Failed to create session" }, { status: 500 });
  }

  // Set the session on the SSR client so auth cookies are written to the response
  const supabase = await createClient();
  const { error: setError } = await supabase.auth.setSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  });

  if (setError) {
    return Response.json({ error: "Failed to establish session" }, { status: 500 });
  }

  await consumeOTP(parsed.data.token);

  return NextResponse.json({ redirectTo: "/net-worth" });
}
