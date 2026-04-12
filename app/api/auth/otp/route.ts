import { NextRequest } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";

const otpSchema = z.object({
  email: z.string().email("Invalid email address"),
  redirectTo: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = otpSchema.safeParse(body);
  
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: parsed.data.redirectTo,
    },
  });

  if (error) {
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
      return Response.json(
        { 
          error: "Rate limit exceeded. Please wait a few minutes before trying again.",
          detail: error.message 
        },
        { status: 429 }
      );
    }
    
    return Response.json(
      { error: "Failed to send magic link", detail: error.message },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
