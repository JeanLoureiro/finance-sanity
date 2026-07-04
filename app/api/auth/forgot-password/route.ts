import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  const supabase = await createClient();
  const origin = new URL(request.url).origin;

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/api/auth/callback?next=/auth/reset-password`,
  });

  // Always return success to avoid email enumeration.
  return Response.json({ success: true });
}
