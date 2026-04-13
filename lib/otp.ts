import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 60;

export async function generateOTP(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.oTPToken.upsert({
    where: { email },
    create: {
      email,
      token,
      expiresAt,
    },
    update: {
      token,
      expiresAt,
      usedAt: null,
    },
  });

  return token;
}

export async function verifyOTP(
  token: string
): Promise<{ valid: boolean; email?: string; error?: string }> {
  const otpRecord = await prisma.oTPToken.findUnique({
    where: { token },
  });

  if (!otpRecord) {
    return { valid: false, error: "Invalid or expired token" };
  }

  if (otpRecord.usedAt) {
    return { valid: false, error: "Token has already been used" };
  }

  if (otpRecord.expiresAt < new Date()) {
    return { valid: false, error: "Token has expired" };
  }

  return { valid: true, email: otpRecord.email };
}

export async function consumeOTP(token: string): Promise<void> {
  await prisma.oTPToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}
