import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InvitationEmailProps {
  inviteLink: string;
  invitedByEmail: string;
  granteeEmail: string;
  role: string;
}

export default function InvitationEmail({
  inviteLink,
  invitedByEmail,
  granteeEmail,
  role,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        You&apos;ve been invited to Finance Sanity by {invitedByEmail}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Finance Sanity</Heading>
          <Text style={text}>
            <strong>{invitedByEmail}</strong> has invited you to access their
            financial data with <strong>{role}</strong> permissions.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
          </Section>
          <Text style={text}>
            Click the button above to create your account and accept the
            invitation.
          </Text>
          <Text style={footer}>
            If you weren&apos;t expecting this invitation, you can safely ignore
            this email.
          </Text>
          <Text style={footer}>
            Invited email: <strong>{granteeEmail}</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "560px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
};

const buttonContainer = {
  padding: "27px 40px",
};

const button = {
  backgroundColor: "#000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 40px",
};
