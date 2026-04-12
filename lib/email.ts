import { Resend } from "resend";
import { render } from "@react-email/components";
import MagicLinkEmail from "@/emails/magic-link";
import InvitationEmail from "@/emails/invitation";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(
  email: string,
  magicLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = await render(
      MagicLinkEmail({ magicLink, email })
    );

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Finance Sanity <onboarding@resend.dev>",
      to: email,
      subject: "Sign in to Finance Sanity",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send magic link email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending magic link email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendInvitationEmail(
  granteeEmail: string,
  invitedByEmail: string,
  inviteLink: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = await render(
      InvitationEmail({
        inviteLink,
        invitedByEmail,
        granteeEmail,
        role,
      })
    );

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Finance Sanity <onboarding@resend.dev>",
      to: granteeEmail,
      subject: `${invitedByEmail} invited you to Finance Sanity`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send invitation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
