import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  magicLink: string;
  email: string;
}

export default function MagicLinkEmail({
  magicLink,
  email,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to Finance Sanity</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Finance Sanity</Heading>
          <Text style={text}>
            Click the button below to sign in to your account:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={magicLink}>
              Sign In
            </Button>
          </Section>
          <Text style={text}>
            This link will expire in 1 hour and can only be used once.
          </Text>
          <Text style={footer}>
            If you didn&apos;t request this email, you can safely ignore it.
          </Text>
          <Text style={footer}>
            Requested for: <strong>{email}</strong>
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
