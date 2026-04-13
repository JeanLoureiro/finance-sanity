import { NextRequest } from "next/server";
import { z } from "zod";
import { generateOTP } from "@/lib/otp";
import { sendMagicLinkEmail } from "@/lib/email";

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

  try {
    const token = await generateOTP(parsed.data.email);
    
    const redirectTo = parsed.data.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`;
    const magicLink = `${redirectTo}?token=${token}`;

    const { success, error } = await sendMagicLinkEmail(
      parsed.data.email,
      magicLink
    );

    if (!success) {
      return Response.json(
        { error: "Failed to send magic link", detail: error },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in OTP route:", error);
    return Response.json(
      { 
        error: "Failed to send magic link", 
        detail: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
