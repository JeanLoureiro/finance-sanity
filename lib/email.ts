import { Resend } from "resend";
import { render } from "@react-email/components";
import InvitationEmail from "@/emails/invitation";
import SnapshotEmail from "@/emails/snapshot";
import type { SnapshotEmailSections } from "@/lib/snapshotEmailSections";

const resend = new Resend(process.env.RESEND_API_KEY);
const mockEmails = process.env.MOCK_EMAILS === "true";

export async function sendInvitationEmail(
  granteeEmail: string,
  invitedByEmail: string,
  inviteLink: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Mock email sending in development if MOCK_EMAILS=true
    if (mockEmails) {
      console.log("📧 [MOCK] Invitation Email");
      console.log("To:", granteeEmail);
      console.log("From:", invitedByEmail);
      console.log("Role:", role);
      console.log("Subject:", `${invitedByEmail} invited you to Financial Sanity`);
      console.log("Invite Link:", inviteLink);
      console.log("---");
      return { success: true };
    }

    const emailHtml = await render(
      InvitationEmail({
        inviteLink,
        invitedByEmail,
        granteeEmail,
        role,
      })
    );

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Financial Sanity <noreply@financialsanity.app>",
      to: granteeEmail,
      subject: `${invitedByEmail} invited you to Financial Sanity`,
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

interface SnapshotEmailData {
  snapshotDate: Date;
  netWorth: number;
  totalAssets: number;
  liabilitiesTotal: number;
  ownerEmail: string;
  sections: SnapshotEmailSections;
}

export async function sendSnapshotEmail(
  recipients: string[],
  data: SnapshotEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (mockEmails) {
      console.log("📧 [MOCK] Snapshot Email");
      console.log("To:", recipients.join(", "));
      console.log("Net Worth:", data.netWorth);
      console.log("Sections:", Object.keys(data.sections).join(", "));
      console.log("---");
      return { success: true };
    }

    const emailHtml = await render(SnapshotEmail(data));

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Financial Sanity <noreply@financialsanity.app>",
      to: recipients,
      subject: `Net Worth Snapshot — ${new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(data.snapshotDate))}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send snapshot email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending snapshot email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
