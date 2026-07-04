import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/schemas";
import { getOrCreateSettingsForUser } from "@/lib/userSettings";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (!data.user) {
    return Response.json({ error: "Signup failed" }, { status: 500 });
  }

  try {
    await getOrCreateSettingsForUser(data.user.id, data.user.email ?? "");
  } catch {
    // ignored — retried on first login
  }

  return Response.json({ redirectTo: "/auth/mfa" }, { status: 201 });
}
